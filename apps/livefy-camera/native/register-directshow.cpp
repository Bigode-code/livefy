#include <windows.h>
#include <iostream>
#include <iomanip>
#include <string>

using RegisterFunction=HRESULT(STDAPICALLTYPE*)();

static std::wstring Message(DWORD code){
  wchar_t* buffer=nullptr;
  DWORD size=FormatMessageW(FORMAT_MESSAGE_ALLOCATE_BUFFER|FORMAT_MESSAGE_FROM_SYSTEM|FORMAT_MESSAGE_IGNORE_INSERTS,nullptr,code,0,reinterpret_cast<wchar_t*>(&buffer),0,nullptr);
  std::wstring result=size?std::wstring(buffer,size):L"No system message available";
  if(buffer)LocalFree(buffer);
  return result;
}

int wmain(int argc,wchar_t** argv){
  if(argc!=3||(wcscmp(argv[1],L"register")&&wcscmp(argv[1],L"unregister"))){std::wcerr<<L"Usage: register-directshow.exe register|unregister <absolute-dll-path>\n";return 64;}
  std::wstring dll=argv[2];
  std::wcout<<L"operation="<<argv[1]<<L"\narchitecture=x64\ndll="<<dll<<L"\n";
  DWORD attributes=GetFileAttributesW(dll.c_str());
  std::wcout<<L"exists="<<(attributes!=INVALID_FILE_ATTRIBUTES?L"true":L"false")<<L"\n";
  if(attributes==INVALID_FILE_ATTRIBUTES){DWORD error=GetLastError();std::wcerr<<L"GetFileAttributesW failed. Win32="<<error<<L" message="<<Message(error)<<L"\n";return 2;}
  SetLastError(ERROR_SUCCESS);HMODULE module=LoadLibraryExW(dll.c_str(),nullptr,LOAD_WITH_ALTERED_SEARCH_PATH);
  if(!module){DWORD error=GetLastError();std::wcerr<<L"LoadLibraryExW failed. Win32="<<error<<L" (0x"<<std::hex<<error<<L") message="<<Message(error)<<L"\n";return 3;}
  const char* exports[]={"DllRegisterServer","DllUnregisterServer","DllGetClassObject","DllCanUnloadNow"};
  for(auto name:exports){bool present=GetProcAddress(module,name)!=nullptr;std::wcout<<L"export."<<name<<L"="<<(present?L"present":L"missing")<<L"\n";if(!present){FreeLibrary(module);return 4;}}
  const char* selected=wcscmp(argv[1],L"register")?"DllUnregisterServer":"DllRegisterServer";
  auto function=reinterpret_cast<RegisterFunction>(GetProcAddress(module,selected));
  HRESULT hr=function();
  std::wcout<<L"HRESULT=0x"<<std::hex<<std::uppercase<<static_cast<unsigned long>(hr)<<std::dec<<L" ("<<static_cast<long>(hr)<<L")\n";
  if(FAILED(hr))std::wcerr<<selected<<L" failed. HRESULT=0x"<<std::hex<<std::uppercase<<static_cast<unsigned long>(hr)<<std::dec<<L" message="<<Message(static_cast<DWORD>(hr))<<L"\n";
  FreeLibrary(module);
  return SUCCEEDED(hr)?0:5;
}
