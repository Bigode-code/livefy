#include <windows.h>
#include <dshow.h>
#include <oleauto.h>
#include <iomanip>
#include <iostream>
#include <string>

#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")
#pragma comment(lib, "strmiids.lib")

static void PrintHr(const wchar_t* label, HRESULT hr) {
  std::wcout << label << L"=0x" << std::hex << std::setw(8) << std::setfill(L'0')
             << static_cast<unsigned long>(hr) << std::dec << std::setfill(L' ') << L"\n";
}

static std::wstring GuidText(const GUID& guid) {
  wchar_t value[64]{};
  return StringFromGUID2(guid, value, ARRAYSIZE(value)) ? value : L"<invalid>";
}

static std::wstring ReadString(IPropertyBag* bag, const wchar_t* key, HRESULT& hr) {
  VARIANT value;
  VariantInit(&value);
  hr = bag->Read(key, &value, nullptr);
  std::wstring result;
  if (SUCCEEDED(hr)) {
    if (value.vt == VT_BSTR && value.bstrVal) result = value.bstrVal;
    else result = L"<variant type " + std::to_wstring(value.vt) + L">";
  }
  VariantClear(&value);
  return result;
}

static void PrintPins(IBaseFilter* filter) {
  IEnumPins* pins = nullptr;
  HRESULT hr = filter->EnumPins(&pins);
  PrintHr(L"pins.enum.hr", hr);
  if (FAILED(hr)) return;
  IPin* pin = nullptr;
  ULONG fetched = 0;
  unsigned index = 0;
  while (pins->Next(1, &pin, &fetched) == S_OK) {
    PIN_DIRECTION direction{};
    PIN_INFO info{};
    HRESULT directionHr = pin->QueryDirection(&direction);
    HRESULT infoHr = pin->QueryPinInfo(&info);
    std::wcout << L"pin[" << index << L"].name="
               << (SUCCEEDED(infoHr) ? info.achName : L"<unavailable>") << L"\n";
    PrintHr(L"pin.direction.hr", directionHr);
    if (SUCCEEDED(directionHr)) std::wcout << L"pin.direction=" << (direction == PINDIR_OUTPUT ? L"output" : L"input") << L"\n";
    if (info.pFilter) info.pFilter->Release();

    IEnumMediaTypes* types = nullptr;
    HRESULT typesHr = pin->EnumMediaTypes(&types);
    PrintHr(L"pin.mediaTypes.hr", typesHr);
    if (SUCCEEDED(typesHr)) {
      AM_MEDIA_TYPE* type = nullptr;
      ULONG typeFetched = 0;
      unsigned typeIndex = 0;
      while (types->Next(1, &type, &typeFetched) == S_OK) {
        std::wcout << L"mediaType[" << typeIndex++ << L"].major=" << GuidText(type->majortype)
                   << L" subtype=" << GuidText(type->subtype)
                   << L" format=" << GuidText(type->formattype) << L"\n";
        if (type->cbFormat) CoTaskMemFree(type->pbFormat);
        if (type->pUnk) type->pUnk->Release();
        CoTaskMemFree(type);
      }
      types->Release();
    }
    pin->Release();
    ++index;
  }
  std::wcout << L"pins.count=" << index << L"\n";
  pins->Release();
}

int wmain() {
  std::wcout << L"process.architecture=" << (sizeof(void*) == 8 ? L"x64" : L"x86") << L"\n";
  std::wcout << L"process.pid=" << GetCurrentProcessId() << L"\n";
  HRESULT init = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
  PrintHr(L"CoInitializeEx.hr", init);

  ICreateDevEnum* systemDevices = nullptr;
  HRESULT hr = CoCreateInstance(CLSID_SystemDeviceEnum, nullptr, CLSCTX_INPROC_SERVER,
                                IID_PPV_ARGS(&systemDevices));
  PrintHr(L"CoCreateInstance.SystemDeviceEnum.hr", hr);
  if (FAILED(hr)) return 1;

  IEnumMoniker* entries = nullptr;
  hr = systemDevices->CreateClassEnumerator(CLSID_VideoInputDeviceCategory, &entries, 0);
  PrintHr(L"CreateClassEnumerator.VideoInputDeviceCategory.hr", hr);
  if (hr == S_FALSE) {
    systemDevices->Release();
    CoUninitialize();
    return 2;
  }
  if (FAILED(hr)) return 3;

  IMoniker* moniker = nullptr;
  ULONG fetched = 0;
  unsigned index = 0;
  while (entries->Next(1, &moniker, &fetched) == S_OK) {
    std::wcout << L"\n=== device[" << index++ << L"] ===\n";
    IBindCtx* bindContext = nullptr;
    HRESULT bindContextHr = CreateBindCtx(0, &bindContext);
    PrintHr(L"CreateBindCtx.hr", bindContextHr);
    LPOLESTR displayName = nullptr;
    HRESULT displayHr = SUCCEEDED(bindContextHr) ? moniker->GetDisplayName(bindContext, nullptr, &displayName) : bindContextHr;
    PrintHr(L"moniker.GetDisplayName.hr", displayHr);
    std::wcout << L"moniker.displayName=" << (displayName ? displayName : L"<unavailable>") << L"\n";
    if (displayName) CoTaskMemFree(displayName);
    if (bindContext) bindContext->Release();

    IPropertyBag* bag = nullptr;
    HRESULT storageHr = moniker->BindToStorage(nullptr, nullptr, IID_PPV_ARGS(&bag));
    PrintHr(L"moniker.BindToStorage.hr", storageHr);
    std::wstring friendlyName, description, devicePath, clsid;
    if (SUCCEEDED(storageHr)) {
      HRESULT propertyHr;
      description = ReadString(bag, L"Description", propertyHr); PrintHr(L"property.Description.hr", propertyHr);
      std::wcout << L"property.Description=" << (description.empty() ? L"<empty>" : description) << L"\n";
      friendlyName = ReadString(bag, L"FriendlyName", propertyHr); PrintHr(L"property.FriendlyName.hr", propertyHr);
      std::wcout << L"property.FriendlyName=" << (friendlyName.empty() ? L"<empty>" : friendlyName) << L"\n";
      devicePath = ReadString(bag, L"DevicePath", propertyHr); PrintHr(L"property.DevicePath.hr", propertyHr);
      std::wcout << L"property.DevicePath=" << (devicePath.empty() ? L"<empty>" : devicePath) << L"\n";
      clsid = ReadString(bag, L"CLSID", propertyHr); PrintHr(L"property.CLSID.hr", propertyHr);
      std::wcout << L"property.CLSID=" << (clsid.empty() ? L"<empty>" : clsid) << L"\n";
      bag->Release();
    }

    const bool target = friendlyName == L"Livefy Camera" || friendlyName == L"OBS Virtual Camera" || friendlyName == L"LSVCam" || friendlyName == L"HD WebCam";
    IBaseFilter* filter = nullptr;
    HRESULT objectHr = moniker->BindToObject(nullptr, nullptr, IID_PPV_ARGS(&filter));
    PrintHr(L"moniker.BindToObject.hr", objectHr);
    std::wcout << L"filter.instantiated=" << (filter ? L"true" : L"false") << L"\n";
    if (target && filter) PrintPins(filter);
    if (filter) filter->Release();
    moniker->Release();
  }
  std::wcout << L"\ndevices.count=" << index << L"\n";
  entries->Release();
  systemDevices->Release();
  if (init == S_OK || init == S_FALSE) CoUninitialize();
  return 0;
}
