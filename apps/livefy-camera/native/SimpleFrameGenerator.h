#pragma once
#include <atomic>
#include <mutex>
#include <thread>
#include <vector>

class SimpleFrameGenerator {
public:
    SimpleFrameGenerator();
    ~SimpleFrameGenerator();
    HRESULT Initialize(_In_ IMFMediaType* mediaType);
    HRESULT CreateFrame(_Inout_updates_bytes_(length) BYTE* destination,_In_ DWORD length,_In_ LONG pitch,_In_ ULONG unusedMask);
private:
    void ReaderLoop();
    bool ReadExact(HANDLE pipe,void* destination,DWORD length);
    void FillPlaceholder();
    UINT32 m_width=0;
    UINT32 m_height=0;
    std::vector<BYTE> m_latest;
    std::mutex m_mutex;
    std::atomic<bool> m_stopping{false};
    std::thread m_reader;
};
