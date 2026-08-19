#include <windows.h>
#include <newdev.h>
#include <setupapi.h>
#include <devguid.h>
#include <cstdio>
#include <string>
#include <vector>

static constexpr wchar_t HardwareId[] = L"Root\\LivefyAudio";

static int install(const wchar_t* infArgument) {
    wchar_t inf[MAX_PATH]{};
    if (!GetFullPathNameW(infArgument, MAX_PATH, inf, nullptr)) {
        std::fwprintf(stderr, L"GetFullPathName failed: Win32=%lu\n", GetLastError()); return 2;
    }
    HDEVINFO devices = SetupDiCreateDeviceInfoList(&GUID_DEVCLASS_MEDIA, nullptr);
    if (devices == INVALID_HANDLE_VALUE) {
        std::fwprintf(stderr, L"SetupDiCreateDeviceInfoList failed: Win32=%lu\n", GetLastError()); return 3;
    }
    SP_DEVINFO_DATA data{sizeof(data)};
    bool ok = SetupDiCreateDeviceInfoW(devices, L"Livefy Audio", &GUID_DEVCLASS_MEDIA, nullptr, nullptr,
        DICD_GENERATE_ID, &data) != FALSE;
    wchar_t multiId[] = L"Root\\LivefyAudio\0\0";
    if (ok) ok = SetupDiSetDeviceRegistryPropertyW(devices, &data, SPDRP_HARDWAREID,
        reinterpret_cast<const BYTE*>(multiId), sizeof(multiId)) != FALSE;
    if (ok) ok = SetupDiCallClassInstaller(DIF_REGISTERDEVICE, devices, &data) != FALSE;
    if (!ok) {
        DWORD error = GetLastError(); SetupDiDestroyDeviceInfoList(devices);
        std::fwprintf(stderr, L"Root device creation failed: Win32=%lu\n", error); return 4;
    }
    SetupDiDestroyDeviceInfoList(devices);
    BOOL reboot = FALSE;
    if (!UpdateDriverForPlugAndPlayDevicesW(nullptr, HardwareId, inf, INSTALLFLAG_FORCE, &reboot)) {
        std::fwprintf(stderr, L"Driver installation failed: Win32=%lu\n", GetLastError()); return 5;
    }
    std::wprintf(L"Livefy Audio installed. rebootRequired=%s\n", reboot ? L"true" : L"false");
    return reboot ? 10 : 0;
}

static bool hasHardwareId(HDEVINFO devices, SP_DEVINFO_DATA* data) {
    DWORD type = 0, required = 0;
    SetupDiGetDeviceRegistryPropertyW(devices, data, SPDRP_HARDWAREID, &type, nullptr, 0, &required);
    if (!required) return false;
    std::vector<BYTE> storage(required);
    if (!SetupDiGetDeviceRegistryPropertyW(devices, data, SPDRP_HARDWAREID, &type, storage.data(), required, nullptr)) return false;
    for (auto* id = reinterpret_cast<const wchar_t*>(storage.data()); *id; id += wcslen(id) + 1)
        if (_wcsicmp(id, HardwareId) == 0) return true;
    return false;
}

static int uninstall() {
    HDEVINFO devices = SetupDiGetClassDevsW(&GUID_DEVCLASS_MEDIA, nullptr, nullptr, DIGCF_ALLCLASSES);
    if (devices == INVALID_HANDLE_VALUE) return 3;
    unsigned removed = 0;
    for (DWORD index = 0;; ++index) {
        SP_DEVINFO_DATA data{sizeof(data)};
        if (!SetupDiEnumDeviceInfo(devices, index, &data)) {
            if (GetLastError() == ERROR_NO_MORE_ITEMS) break;
            continue;
        }
        if (!hasHardwareId(devices, &data)) continue;
        SP_REMOVEDEVICE_PARAMS removal{};
        removal.ClassInstallHeader.cbSize = sizeof(SP_CLASSINSTALL_HEADER);
        removal.ClassInstallHeader.InstallFunction = DIF_REMOVE;
        removal.Scope = DI_REMOVEDEVICE_GLOBAL;
        removal.HwProfile = 0;
        if (SetupDiSetClassInstallParamsW(devices, &data, &removal.ClassInstallHeader, sizeof(removal)) &&
            SetupDiCallClassInstaller(DIF_REMOVE, devices, &data)) ++removed;
    }
    SetupDiDestroyDeviceInfoList(devices);
    std::printf("Livefy Audio devices removed=%u\n", removed);
    return 0;
}

int wmain(int argc, wchar_t** argv) {
    if (argc >= 3 && _wcsicmp(argv[1], L"install") == 0) return install(argv[2]);
    if (argc >= 2 && _wcsicmp(argv[1], L"uninstall") == 0) return uninstall();
    std::fwprintf(stderr, L"Usage: livefy-audio-manager.exe install <absolute-inf> | uninstall\n"); return 1;
}
