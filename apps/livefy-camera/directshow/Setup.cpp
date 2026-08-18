#include <streams.h>
#include <initguid.h>
#include "LivefyDirectShow.h"

const AMOVIESETUP_MEDIATYPE PinType={&MEDIATYPE_Video,&MEDIASUBTYPE_YUY2};
const AMOVIESETUP_PIN Pin={L"Capture",FALSE,TRUE,FALSE,FALSE,&CLSID_NULL,nullptr,1,&PinType};
const AMOVIESETUP_FILTER Filter={&CLSID_LivefyCameraDirectShow,L"Livefy Camera",MERIT_DO_NOT_USE,1,&Pin};
const REGPINTYPES RegisteredPinType={&MEDIATYPE_Video,&MEDIASUBTYPE_YUY2};
const REGFILTERPINS RegisteredPin={L"Capture",FALSE,TRUE,FALSE,FALSE,&CLSID_NULL,nullptr,1,&RegisteredPinType};
CFactoryTemplate g_Templates[]={{L"Livefy Camera",&CLSID_LivefyCameraDirectShow,LivefyCameraFilter::CreateInstance,nullptr,&Filter}};int g_cTemplates=1;

namespace { struct ComScope { HRESULT result=CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED);~ComScope(){if(result==S_OK||result==S_FALSE)CoUninitialize();}bool ready()const{return SUCCEEDED(result)||result==RPC_E_CHANGED_MODE;} }; }
STDAPI DllRegisterServer(){ComScope com;if(!com.ready())return com.result;HRESULT hr=AMovieDllRegisterServer2(TRUE);if(FAILED(hr))return hr;IFilterMapper2* mapper=nullptr;hr=CoCreateInstance(CLSID_FilterMapper2,nullptr,CLSCTX_INPROC_SERVER,IID_IFilterMapper2,reinterpret_cast<void**>(&mapper));if(SUCCEEDED(hr)){REGFILTER2 registration{};registration.dwVersion=1;registration.dwMerit=MERIT_DO_NOT_USE;registration.cPins=1;registration.rgPins=&RegisteredPin;hr=mapper->RegisterFilter(CLSID_LivefyCameraDirectShow,L"Livefy Camera",nullptr,&CLSID_VideoInputDeviceCategory,L"Livefy Camera",&registration);mapper->Release();}if(FAILED(hr))AMovieDllRegisterServer2(FALSE);return hr;}
STDAPI DllUnregisterServer(){ComScope com;if(!com.ready())return com.result;IFilterMapper2* mapper=nullptr;HRESULT categoryResult=CoCreateInstance(CLSID_FilterMapper2,nullptr,CLSCTX_INPROC_SERVER,IID_IFilterMapper2,reinterpret_cast<void**>(&mapper));if(SUCCEEDED(categoryResult)){categoryResult=mapper->UnregisterFilter(&CLSID_VideoInputDeviceCategory,L"Livefy Camera",CLSID_LivefyCameraDirectShow);mapper->Release();}HRESULT classResult=AMovieDllRegisterServer2(FALSE);return FAILED(categoryResult)?categoryResult:classResult;}
extern "C" BOOL WINAPI DllEntryPoint(HINSTANCE,ULONG,LPVOID);BOOL APIENTRY DllMain(HANDLE module,DWORD reason,LPVOID reserved){return DllEntryPoint(static_cast<HINSTANCE>(module),reason,reserved);}
