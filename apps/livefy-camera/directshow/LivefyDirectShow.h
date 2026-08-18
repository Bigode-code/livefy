#pragma once
#include <streams.h>
#include <algorithm>
#include <ks.h>
#include <ksmedia.h>
#include <atomic>
#include <mutex>
#include <thread>
#include <vector>

// {B8A1DA92-D00F-4EEA-85EC-91017B657A55}
DEFINE_GUID(CLSID_LivefyCameraDirectShow,0xb8a1da92,0xd00f,0x4eea,0x85,0xec,0x91,0x01,0x7b,0x65,0x7a,0x55);

class LivefyFrameReader {
public:
    LivefyFrameReader();~LivefyFrameReader();
    void CopyNV12(BYTE* destination,size_t length);
    bool Connected()const{return m_connected;}
private:
    void Run();bool ReadExact(HANDLE pipe,void* destination,DWORD length);void Placeholder();
    std::vector<BYTE>m_latest;std::mutex m_mutex;std::atomic<bool>m_stopping{false};std::atomic<bool>m_connected{false};std::thread m_thread;
};

class LivefyCameraStream:public CSourceStream,public IAMStreamConfig,public IKsPropertySet{
public:
    LivefyCameraStream(HRESULT* result,CSource* filter);~LivefyCameraStream()override=default;
    STDMETHODIMP NonDelegatingQueryInterface(REFIID iid,void** object)override;
    HRESULT GetMediaType(int position,CMediaType* mediaType)override;HRESULT CheckMediaType(const CMediaType* mediaType)override;HRESULT DecideBufferSize(IMemAllocator* allocator,ALLOCATOR_PROPERTIES* properties)override;HRESULT FillBuffer(IMediaSample* sample)override;
    STDMETHODIMP SetFormat(AM_MEDIA_TYPE* mediaType)override;STDMETHODIMP GetFormat(AM_MEDIA_TYPE** mediaType)override;STDMETHODIMP GetNumberOfCapabilities(int* count,int* size)override;STDMETHODIMP GetStreamCaps(int index,AM_MEDIA_TYPE** mediaType,BYTE* capabilities)override;
    STDMETHODIMP Set(REFGUID,DWORD,LPVOID,DWORD,LPVOID,DWORD)override{return E_NOTIMPL;}STDMETHODIMP Get(REFGUID propertySet,DWORD propertyId,LPVOID, DWORD,LPVOID propertyData,DWORD dataLength,DWORD* returned)override;STDMETHODIMP QuerySupported(REFGUID propertySet,DWORD propertyId,DWORD* support)override;
private:
    HRESULT BuildMediaType(bool nv12,CMediaType* mediaType);void NV12ToYUY2(const BYTE* source,BYTE* destination);
    LivefyFrameReader m_reader;CCritSec m_state;REFERENCE_TIME m_sampleTime=0;ULONGLONG m_nextTick=0;
};

class LivefyCameraFilter:public CSource{
public:
    static CUnknown* WINAPI CreateInstance(IUnknown* outer,HRESULT* result);
    ~LivefyCameraFilter() override;
private:
    LivefyCameraFilter(IUnknown* outer,HRESULT* result);LivefyCameraStream* m_stream=nullptr;
};
