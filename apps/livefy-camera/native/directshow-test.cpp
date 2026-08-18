#include <windows.h>
#include <dshow.h>
#include <iostream>
#pragma comment(lib,"strmiids.lib")
#pragma comment(lib,"ole32.lib")

int wmain(){CoInitializeEx(nullptr,COINIT_MULTITHREADED);ICreateDevEnum* devices=nullptr;IEnumMoniker* entries=nullptr;HRESULT hr=CoCreateInstance(CLSID_SystemDeviceEnum,nullptr,CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&devices));if(SUCCEEDED(hr))hr=devices->CreateClassEnumerator(CLSID_VideoInputDeviceCategory,&entries,0);bool found=false;if(hr==S_FALSE)hr=S_OK;IMoniker* moniker=nullptr;ULONG fetched=0;while(entries&&entries->Next(1,&moniker,&fetched)==S_OK){IPropertyBag* properties=nullptr;if(SUCCEEDED(moniker->BindToStorage(nullptr,nullptr,IID_PPV_ARGS(&properties)))){VARIANT name;VariantInit(&name);if(SUCCEEDED(properties->Read(L"FriendlyName",&name,nullptr))){std::wcout<<L"device="<<name.bstrVal<<L"\n";if(_wcsicmp(name.bstrVal,L"Livefy Camera")==0){found=true;IBaseFilter* filter=nullptr;HRESULT open=moniker->BindToObject(nullptr,nullptr,IID_PPV_ARGS(&filter));std::wcout<<L"livefy.bind=0x"<<std::hex<<open<<std::dec<<L"\n";if(filter)filter->Release();if(FAILED(open))hr=open;}VariantClear(&name);}properties->Release();}moniker->Release();}
    if(entries)entries->Release();if(devices)devices->Release();CoUninitialize();if(!found){std::wcerr<<L"Livefy Camera was not enumerated by DirectShow\n";return 2;}return FAILED(hr)?static_cast<int>(hr):0;}
