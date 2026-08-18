#include <streams.h>
#include <initguid.h>
#include "LivefyDirectShow.h"

const AMOVIESETUP_MEDIATYPE PinType={&MEDIATYPE_Video,&MEDIASUBTYPE_NULL};
const AMOVIESETUP_PIN Pin={L"Capture",FALSE,TRUE,FALSE,FALSE,&CLSID_NULL,nullptr,1,&PinType};
const AMOVIESETUP_FILTER Filter={&CLSID_LivefyCameraDirectShow,L"Livefy Camera",MERIT_DO_NOT_USE,1,&Pin};
const REGPINTYPES RegisteredPinType={&MEDIATYPE_Video,&MEDIASUBTYPE_NULL};
const REGFILTERPINS RegisteredPin={L"Capture",FALSE,TRUE,FALSE,FALSE,&CLSID_NULL,nullptr,1,&RegisteredPinType};
CFactoryTemplate g_Templates[]={{L"Livefy Camera",&CLSID_LivefyCameraDirectShow,LivefyCameraFilter::CreateInstance,nullptr,&Filter}};int g_cTemplates=1;

STDAPI DllRegisterServer(){HRESULT hr=AMovieDllRegisterServer2(TRUE);if(FAILED(hr))return hr;IFilterMapper2* mapper=nullptr;hr=CoCreateInstance(CLSID_FilterMapper2,nullptr,CLSCTX_INPROC_SERVER,IID_IFilterMapper2,reinterpret_cast<void**>(&mapper));if(SUCCEEDED(hr)){REGFILTER2 registration{};registration.dwVersion=1;registration.dwMerit=MERIT_DO_NOT_USE;registration.cPins=1;registration.rgPins=&RegisteredPin;hr=mapper->RegisterFilter(CLSID_LivefyCameraDirectShow,L"Livefy Camera",nullptr,&CLSID_VideoInputDeviceCategory,L"Livefy Camera",&registration);mapper->Release();}return hr;}
STDAPI DllUnregisterServer(){IFilterMapper2* mapper=nullptr;if(SUCCEEDED(CoCreateInstance(CLSID_FilterMapper2,nullptr,CLSCTX_INPROC_SERVER,IID_IFilterMapper2,reinterpret_cast<void**>(&mapper)))){mapper->UnregisterFilter(&CLSID_VideoInputDeviceCategory,L"Livefy Camera",CLSID_LivefyCameraDirectShow);mapper->Release();}return AMovieDllRegisterServer2(FALSE);}
extern "C" BOOL WINAPI DllEntryPoint(HINSTANCE,ULONG,LPVOID);BOOL APIENTRY DllMain(HANDLE module,DWORD reason,LPVOID reserved){return DllEntryPoint(static_cast<HINSTANCE>(module),reason,reserved);}
