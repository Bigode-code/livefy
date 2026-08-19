#include <windows.h>
#include <sddl.h>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <vector>

#define IOCTL_LIVEFY_AUDIO_PUSH_PCM CTL_CODE(FILE_DEVICE_UNKNOWN, 0x800, METHOD_BUFFERED, FILE_WRITE_DATA)

static HANDLE g_StopEvent = nullptr;
static HANDLE g_WorkerThread = nullptr;
static SERVICE_STATUS_HANDLE g_ServiceHandle = nullptr;

#pragma pack(push, 1)
struct AudioHeader {
    char magic[4]; std::uint16_t version; std::uint16_t sampleFormat;
    std::uint32_t sampleRate; std::uint16_t channels; std::uint16_t bitsPerSample;
    std::uint32_t payloadBytes; std::uint32_t sequence; std::uint64_t timestamp;
};
#pragma pack(pop)

static bool readExact(HANDLE pipe, void* destination, DWORD length) {
    auto* cursor = static_cast<unsigned char*>(destination);
    while (length > 0) {
        DWORD received = 0;
        if (!ReadFile(pipe, cursor, length, &received, nullptr) || received == 0) return false;
        cursor += received; length -= received;
    }
    return true;
}

static bool stopping() { return g_StopEvent && WaitForSingleObject(g_StopEvent, 0) == WAIT_OBJECT_0; }

static int runBridge() {
    std::printf("Livefy Audio bridge: 48000 Hz, stereo, s16le\n");
    PSECURITY_DESCRIPTOR descriptor = nullptr;
    ConvertStringSecurityDescriptorToSecurityDescriptorW(
        L"D:(A;;GA;;;AU)(A;;GA;;;SY)(A;;GA;;;BA)", SDDL_REVISION_1, &descriptor, nullptr);
    SECURITY_ATTRIBUTES security{sizeof(security), descriptor, FALSE};
    while (!stopping()) {
        HANDLE device = CreateFileW(L"\\\\.\\LivefyAudioControl", GENERIC_READ | GENERIC_WRITE,
            FILE_SHARE_READ | FILE_SHARE_WRITE, nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
        if (device == INVALID_HANDLE_VALUE) {
            std::fprintf(stderr, "Livefy Audio driver unavailable (Win32=%lu). Retrying...\n", GetLastError());
            if (WaitForSingleObject(g_StopEvent, 1000) == WAIT_OBJECT_0) break;
            continue;
        }
        HANDLE pipe = CreateNamedPipeW(L"\\\\.\\pipe\\livefy-audio-pcm-v1", PIPE_ACCESS_INBOUND,
            PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT, 1, 0, 256 * 1024, 0, &security);
        if (pipe == INVALID_HANDLE_VALUE) {
            std::fprintf(stderr, "Cannot create PCM pipe (Win32=%lu).\n", GetLastError());
            CloseHandle(device); return 2;
        }
        std::printf("Waiting for Livefy Agent...\n");
        BOOL connected = ConnectNamedPipe(pipe, nullptr) || GetLastError() == ERROR_PIPE_CONNECTED;
        if (!connected) { CloseHandle(pipe); CloseHandle(device); continue; }
        std::printf("Livefy Agent connected.\n");
        AudioHeader header{};
        while (!stopping() && readExact(pipe, &header, sizeof(header))) {
            bool valid = std::memcmp(header.magic, "LFPA", 4) == 0 && header.version == 1 &&
                header.sampleFormat == 1 && header.sampleRate == 48000 && header.channels == 2 &&
                header.bitsPerSample == 16 && header.payloadBytes > 0 &&
                header.payloadBytes <= 256 * 1024 && (header.payloadBytes % 4) == 0;
            if (!valid) { std::fprintf(stderr, "Invalid PCM frame header; reconnecting.\n"); break; }
            std::vector<unsigned char> pcm(header.payloadBytes);
            if (!readExact(pipe, pcm.data(), header.payloadBytes)) break;
            DWORD returned = 0;
            if (!DeviceIoControl(device, IOCTL_LIVEFY_AUDIO_PUSH_PCM, pcm.data(), header.payloadBytes,
                nullptr, 0, &returned, nullptr)) {
                std::fprintf(stderr, "PCM push failed (Win32=%lu); reconnecting.\n", GetLastError()); break;
            }
        }
        DisconnectNamedPipe(pipe); CloseHandle(pipe); CloseHandle(device);
        std::printf("Livefy Agent disconnected.\n");
    }
    if (descriptor) LocalFree(descriptor);
    return 0;
}

static void setServiceState(DWORD state, DWORD error = NO_ERROR) {
    if (!g_ServiceHandle) return;
    SERVICE_STATUS status{}; status.dwServiceType = SERVICE_WIN32_OWN_PROCESS;
    status.dwCurrentState = state; status.dwWin32ExitCode = error;
    status.dwControlsAccepted = state == SERVICE_RUNNING ? SERVICE_ACCEPT_STOP | SERVICE_ACCEPT_SHUTDOWN : 0;
    SetServiceStatus(g_ServiceHandle, &status);
}

static DWORD WINAPI serviceControl(DWORD control, DWORD, void*, void*) {
    if (control == SERVICE_CONTROL_STOP || control == SERVICE_CONTROL_SHUTDOWN) {
        setServiceState(SERVICE_STOP_PENDING);
        SetEvent(g_StopEvent);
        if (g_WorkerThread) CancelSynchronousIo(g_WorkerThread);
    }
    return NO_ERROR;
}

static void WINAPI serviceMain(DWORD, wchar_t**) {
    g_ServiceHandle = RegisterServiceCtrlHandlerExW(L"LivefyAudioBridge", serviceControl, nullptr);
    if (!g_ServiceHandle) return;
    setServiceState(SERVICE_START_PENDING);
    g_WorkerThread = OpenThread(THREAD_TERMINATE, FALSE, GetCurrentThreadId());
    setServiceState(SERVICE_RUNNING);
    int result = runBridge();
    if (g_WorkerThread) { CloseHandle(g_WorkerThread); g_WorkerThread = nullptr; }
    setServiceState(SERVICE_STOPPED, result == 0 ? NO_ERROR : ERROR_SERVICE_SPECIFIC_ERROR);
}

int wmain(int argc, wchar_t** argv) {
    g_StopEvent = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    if (!g_StopEvent) return 3;
    int result = 0;
    if (argc > 1 && _wcsicmp(argv[1], L"--service") == 0) {
        SERVICE_TABLE_ENTRYW table[] = {{const_cast<wchar_t*>(L"LivefyAudioBridge"), serviceMain}, {nullptr, nullptr}};
        if (!StartServiceCtrlDispatcherW(table)) result = static_cast<int>(GetLastError());
    } else {
        result = runBridge();
    }
    CloseHandle(g_StopEvent);
    return result;
}
