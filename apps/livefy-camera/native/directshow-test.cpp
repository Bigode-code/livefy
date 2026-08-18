#include <windows.h>
#include <dshow.h>
#include <ks.h>
#include <ksmedia.h>
#include <iostream>
#include <iomanip>
#include <vector>
#pragma comment(lib,"strmiids.lib")
#pragma comment(lib,"ole32.lib")

static void FreeType(AM_MEDIA_TYPE* type){if(type->cbFormat)CoTaskMemFree(type->pbFormat);if(type->pUnk)type->pUnk->Release();CoTaskMemFree(type);}
static bool DiagnoseFilter(IBaseFilter* filter){
  IEnumPins* pins=nullptr;HRESULT hr=filter->EnumPins(&pins);std::wcout<<L"livefy.enumPins=0x"<<std::hex<<hr<<std::dec<<L"\n";if(FAILED(hr))return false;
  bool compatible=false;IPin* pin=nullptr;ULONG fetched=0;
  while(pins->Next(1,&pin,&fetched)==S_OK){PIN_DIRECTION direction{};pin->QueryDirection(&direction);PIN_INFO info{};pin->QueryPinInfo(&info);std::wcout<<L"pin.name="<<info.achName<<L" direction="<<direction<<L"\n";if(info.pFilter)info.pFilter->Release();
    IKsPropertySet* properties=nullptr;HRESULT propertyHr=pin->QueryInterface(IID_PPV_ARGS(&properties));GUID category{};DWORD returned=0;if(SUCCEEDED(propertyHr))propertyHr=properties->Get(AMPROPSETID_Pin,AMPROPERTY_PIN_CATEGORY,nullptr,0,&category,sizeof(category),&returned);std::wcout<<L"pin.category.hr=0x"<<std::hex<<propertyHr<<L" capture="<<(category==PIN_CATEGORY_CAPTURE)<<std::dec<<L"\n";if(properties)properties->Release();
    IAMStreamConfig* config=nullptr;HRESULT configHr=pin->QueryInterface(IID_PPV_ARGS(&config));std::wcout<<L"pin.streamConfig=0x"<<std::hex<<configHr<<std::dec<<L"\n";if(SUCCEEDED(configHr)){int count=0,size=0;HRESULT countHr=config->GetNumberOfCapabilities(&count,&size);std::wcout<<L"caps.count.hr=0x"<<std::hex<<countHr<<std::dec<<L" count="<<count<<L" size="<<size<<L" expected="<<sizeof(VIDEO_STREAM_CONFIG_CAPS)<<L"\n";if(SUCCEEDED(countHr)&&size==sizeof(VIDEO_STREAM_CONFIG_CAPS)){std::vector<BYTE>caps(size);for(int index=0;index<count;index++){AM_MEDIA_TYPE* type=nullptr;HRESULT capsHr=config->GetStreamCaps(index,&type,caps.data());std::wcout<<L"caps["<<index<<L"].hr=0x"<<std::hex<<capsHr<<std::dec;if(SUCCEEDED(capsHr)&&type&&type->formattype==FORMAT_VideoInfo&&type->cbFormat>=sizeof(VIDEOINFOHEADER)){auto* video=reinterpret_cast<VIDEOINFOHEADER*>(type->pbFormat);std::wcout<<L" width="<<video->bmiHeader.biWidth<<L" height="<<video->bmiHeader.biHeight<<L" bitCount="<<video->bmiHeader.biBitCount<<L" compression=0x"<<std::hex<<video->bmiHeader.biCompression<<std::dec<<L" frameDuration="<<video->AvgTimePerFrame;if(video->bmiHeader.biWidth==1080&&abs(video->bmiHeader.biHeight)==1920&&video->AvgTimePerFrame>0)compatible=true;}std::wcout<<L"\n";if(type)FreeType(type);}}config->Release();}
    pin->Release();
  }
  pins->Release();return compatible;
}

int wmain(){HRESULT init=CoInitializeEx(nullptr,COINIT_MULTITHREADED);ICreateDevEnum* devices=nullptr;IEnumMoniker* entries=nullptr;HRESULT hr=CoCreateInstance(CLSID_SystemDeviceEnum,nullptr,CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&devices));if(SUCCEEDED(hr))hr=devices->CreateClassEnumerator(CLSID_VideoInputDeviceCategory,&entries,0);bool found=false,compatible=false;if(hr==S_FALSE)hr=S_OK;IMoniker* moniker=nullptr;ULONG fetched=0;while(entries&&entries->Next(1,&moniker,&fetched)==S_OK){IPropertyBag* properties=nullptr;if(SUCCEEDED(moniker->BindToStorage(nullptr,nullptr,IID_PPV_ARGS(&properties)))){VARIANT name;VariantInit(&name);if(SUCCEEDED(properties->Read(L"FriendlyName",&name,nullptr))){std::wcout<<L"device="<<name.bstrVal<<L"\n";if(_wcsicmp(name.bstrVal,L"Livefy Camera")==0){found=true;IBaseFilter* filter=nullptr;HRESULT open=moniker->BindToObject(nullptr,nullptr,IID_PPV_ARGS(&filter));std::wcout<<L"livefy.bind=0x"<<std::hex<<open<<std::dec<<L"\n";if(filter){compatible=DiagnoseFilter(filter);filter->Release();}if(FAILED(open))hr=open;}VariantClear(&name);}properties->Release();}moniker->Release();}if(entries)entries->Release();if(devices)devices->Release();if(init==S_OK||init==S_FALSE)CoUninitialize();if(!found){std::wcerr<<L"Livefy Camera was not enumerated by DirectShow\n";return 2;}if(!compatible){std::wcerr<<L"Livefy Camera has no Chrome-compatible capture capability\n";return 3;}return FAILED(hr)?static_cast<int>(hr):0;}
