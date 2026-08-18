#include <windows.h>
#include <mfapi.h>
#include <mfidl.h>
#include <mfreadwrite.h>
#include <iostream>
#include <fstream>
#include <string>
#pragma comment(lib,"mfplat.lib")
#pragma comment(lib,"mf.lib")
#pragma comment(lib,"mfreadwrite.lib")
#pragma comment(lib,"mfuuid.lib")

int wmain(int argc,wchar_t** argv){
    const int targetFrames=argc>1?_wtoi(argv[1]):90;CoInitializeEx(nullptr,COINIT_MULTITHREADED);HRESULT hr=MFStartup(MF_VERSION);IMFAttributes* attrs=nullptr;IMFActivate** devices=nullptr;UINT32 count=0;IMFMediaSource* source=nullptr;IMFSourceReader* reader=nullptr;IMFMediaType* type=nullptr;
    if(SUCCEEDED(hr))hr=MFCreateAttributes(&attrs,1);if(SUCCEEDED(hr))hr=attrs->SetGUID(MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE,MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_GUID);if(SUCCEEDED(hr))hr=MFEnumDeviceSources(attrs,&devices,&count);
    IMFActivate* selected=nullptr;for(UINT32 i=0;i<count;i++){WCHAR* name=nullptr;UINT32 length=0;if(SUCCEEDED(devices[i]->GetAllocatedString(MF_DEVSOURCE_ATTRIBUTE_FRIENDLY_NAME,&name,&length))){std::wcout<<L"device="<<name<<L"\n";if(_wcsicmp(name,L"Livefy Camera")==0)selected=devices[i];CoTaskMemFree(name);}}
    if(!selected){std::wcerr<<L"Livefy Camera was not enumerated\n";hr=HRESULT_FROM_WIN32(ERROR_NOT_FOUND);}if(SUCCEEDED(hr))hr=selected->ActivateObject(IID_PPV_ARGS(&source));if(SUCCEEDED(hr))hr=MFCreateSourceReaderFromMediaSource(source,nullptr,&reader);if(SUCCEEDED(hr))hr=MFCreateMediaType(&type);
    if(SUCCEEDED(hr))hr=type->SetGUID(MF_MT_MAJOR_TYPE,MFMediaType_Video);if(SUCCEEDED(hr))hr=type->SetGUID(MF_MT_SUBTYPE,MFVideoFormat_NV12);if(SUCCEEDED(hr))hr=MFSetAttributeSize(type,MF_MT_FRAME_SIZE,1080,1920);if(SUCCEEDED(hr))hr=MFSetAttributeRatio(type,MF_MT_FRAME_RATE,30,1);if(SUCCEEDED(hr))hr=reader->SetCurrentMediaType(MF_SOURCE_READER_FIRST_VIDEO_STREAM,nullptr,type);
    LONGLONG first=0,last=0;int received=0;for(;SUCCEEDED(hr)&&received<targetFrames;received++){DWORD stream=0,flags=0;LONGLONG timestamp=0;IMFSample* sample=nullptr;hr=reader->ReadSample(MF_SOURCE_READER_FIRST_VIDEO_STREAM,0,&stream,&flags,&timestamp,&sample);if(sample){if(received==0){IMFMediaBuffer* buffer=nullptr;BYTE* bytes=nullptr;DWORD max=0,current=0;if(SUCCEEDED(sample->ConvertToContiguousBuffer(&buffer))&&SUCCEEDED(buffer->Lock(&bytes,&max,&current))){std::ofstream output("livefy-camera-frame.nv12",std::ios::binary);output.write(reinterpret_cast<char*>(bytes),current);buffer->Unlock();}if(buffer)buffer->Release();first=timestamp;}last=timestamp;sample->Release();}}
    if(SUCCEEDED(hr))std::wcout<<L"name=Livefy Camera width=1080 height=1920 pixelFormat=NV12 frames="<<received<<L" fps="<<(last>first?(received-1)*10000000.0/(last-first):0)<<L" evidence=livefy-camera-frame.nv12\n";
    if(type)type->Release();if(reader)reader->Release();if(source)source->Release();if(devices){for(UINT32 i=0;i<count;i++)devices[i]->Release();CoTaskMemFree(devices);}if(attrs)attrs->Release();MFShutdown();CoUninitialize();return FAILED(hr)?static_cast<int>(hr):0;
}
