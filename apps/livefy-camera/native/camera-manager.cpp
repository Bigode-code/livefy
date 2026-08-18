#include <windows.h>
#include <mfapi.h>
#include <mfidl.h>
#include <mfvirtualcamera.h>
#include <iostream>
#include <string>
#pragma comment(lib,"mfplat.lib")
#pragma comment(lib,"mfuuid.lib")

static constexpr wchar_t FriendlyName[]=L"Livefy Camera";
static constexpr wchar_t SourceId[]=L"{A51F16A4-88C1-4D8D-9E39-3A2E8EE65F2B}";
static const GUID VcamKind={0xc7f7c57b,0xdf30,0x41d0,{0xaf,0xfc,0x15,0x20,0x1c,0xdf,0x92,0x0d}};

HRESULT OpenCamera(IMFVirtualCamera** camera){return MFCreateVirtualCamera(MFVirtualCameraType_SoftwareCameraSource,MFVirtualCameraLifetime_System,MFVirtualCameraAccess_CurrentUser,FriendlyName,SourceId,nullptr,0,camera);}
HRESULT RegisterComServer(const wchar_t* dllPath){HKEY key=nullptr;std::wstring path=L"Software\\Classes\\CLSID\\"+std::wstring(SourceId)+L"\\InProcServer32";LSTATUS status=RegCreateKeyExW(HKEY_LOCAL_MACHINE,path.c_str(),0,nullptr,0,KEY_SET_VALUE,nullptr,&key,nullptr);if(status!=ERROR_SUCCESS)return HRESULT_FROM_WIN32(status);status=RegSetValueExW(key,nullptr,0,REG_SZ,reinterpret_cast<const BYTE*>(dllPath),static_cast<DWORD>((wcslen(dllPath)+1)*sizeof(wchar_t)));RegCloseKey(key);return HRESULT_FROM_WIN32(status);}
HRESULT UnregisterComServer(){std::wstring path=L"Software\\Classes\\CLSID\\"+std::wstring(SourceId);LSTATUS status=RegDeleteTreeW(HKEY_LOCAL_MACHINE,path.c_str());return status==ERROR_FILE_NOT_FOUND?S_OK:HRESULT_FROM_WIN32(status);}

int wmain(int argc,wchar_t** argv){
    if(argc<2){std::wcerr<<L"usage: livefy-camera-manager install <dll> | uninstall\n";return 2;}CoInitializeEx(nullptr,COINIT_MULTITHREADED);HRESULT hr=MFStartup(MF_VERSION);if(FAILED(hr))return static_cast<int>(hr);
    IMFVirtualCamera* camera=nullptr;
    if(_wcsicmp(argv[1],L"install")==0){if(argc!=3)hr=E_INVALIDARG;else if(SUCCEEDED(hr=RegisterComServer(argv[2]))&&SUCCEEDED(hr=OpenCamera(&camera))){camera->SetUINT32(VcamKind,0);hr=camera->Start(nullptr);}}
    else if(_wcsicmp(argv[1],L"uninstall")==0){if(SUCCEEDED(hr=OpenCamera(&camera)))hr=camera->Remove();if(SUCCEEDED(hr))hr=UnregisterComServer();}
    else hr=E_INVALIDARG;
    if(camera){camera->Shutdown();camera->Release();}MFShutdown();CoUninitialize();if(FAILED(hr)){std::wcerr<<L"Livefy Camera operation failed: 0x"<<std::hex<<hr<<L"\n";return static_cast<int>(hr);}std::wcout<<FriendlyName<<(argc>1&&_wcsicmp(argv[1],L"install")==0?L" installed\n":L" removed\n");return 0;
}
