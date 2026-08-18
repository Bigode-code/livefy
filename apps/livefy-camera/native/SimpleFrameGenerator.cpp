#include "pch.h"
#include <array>
#include <sddl.h>
#include "SimpleFrameGenerator.h"

namespace {
constexpr wchar_t PipeName[]=L"\\\\.\\pipe\\livefy-camera-frames-v1";
constexpr DWORD HeaderBytes=40;
uint32_t ReadU32(const BYTE* value){return value[0]|(value[1]<<8)|(value[2]<<16)|(value[3]<<24);}
}

SimpleFrameGenerator::SimpleFrameGenerator()=default;
SimpleFrameGenerator::~SimpleFrameGenerator(){m_stopping=true;if(m_reader.joinable())m_reader.join();}

HRESULT SimpleFrameGenerator::Initialize(IMFMediaType* mediaType){
    RETURN_HR_IF_NULL(E_INVALIDARG,mediaType);GUID subtype=GUID_NULL;RETURN_IF_FAILED(mediaType->GetGUID(MF_MT_SUBTYPE,&subtype));
    RETURN_HR_IF(MF_E_UNSUPPORTED_FORMAT,subtype!=MFVideoFormat_NV12);RETURN_IF_FAILED(MFGetAttributeSize(mediaType,MF_MT_FRAME_SIZE,&m_width,&m_height));
    FillPlaceholder();m_reader=std::thread(&SimpleFrameGenerator::ReaderLoop,this);return S_OK;
}

HRESULT SimpleFrameGenerator::CreateFrame(BYTE* destination,DWORD length,LONG pitch,ULONG){
    RETURN_HR_IF_NULL(E_INVALIDARG,destination);const DWORD required=m_width*m_height*3/2;RETURN_HR_IF(HRESULT_FROM_WIN32(ERROR_INSUFFICIENT_BUFFER),length<required);
    std::lock_guard<std::mutex> guard(m_mutex);if(pitch==static_cast<LONG>(m_width)){memcpy(destination,m_latest.data(),required);return S_OK;}
    for(UINT32 row=0;row<m_height;row++)memcpy(destination+row*pitch,m_latest.data()+row*m_width,m_width);
    BYTE* uvDestination=destination+m_height*pitch;const BYTE* uvSource=m_latest.data()+m_width*m_height;
    for(UINT32 row=0;row<m_height/2;row++)memcpy(uvDestination+row*pitch,uvSource+row*m_width,m_width);return S_OK;
}

void SimpleFrameGenerator::ReaderLoop(){
    while(!m_stopping){
        PSECURITY_DESCRIPTOR descriptor=nullptr;SECURITY_ATTRIBUTES security{sizeof(SECURITY_ATTRIBUTES),nullptr,FALSE};
        if(ConvertStringSecurityDescriptorToSecurityDescriptorW(L"D:(A;;GRGW;;;AU)(A;;GA;;;SY)(A;;GA;;;BA)",SDDL_REVISION_1,&descriptor,nullptr))security.lpSecurityDescriptor=descriptor;
        HANDLE pipe=CreateNamedPipeW(PipeName,PIPE_ACCESS_INBOUND,PIPE_TYPE_BYTE|PIPE_READMODE_BYTE|PIPE_NOWAIT,1,0,4*1024*1024,0,security.lpSecurityDescriptor?&security:nullptr);
        if(descriptor)LocalFree(descriptor);if(pipe==INVALID_HANDLE_VALUE){Sleep(500);continue;}
        while(!m_stopping){if(ConnectNamedPipe(pipe,nullptr)||GetLastError()==ERROR_PIPE_CONNECTED)break;if(GetLastError()!=ERROR_PIPE_LISTENING){break;}Sleep(50);}
        while(!m_stopping){
            std::array<BYTE,HeaderBytes> header{};if(!ReadExact(pipe,header.data(),HeaderBytes))break;
            if(memcmp(header.data(),"LFNV",4)!=0||header[4]!=1)break;
            const uint32_t width=ReadU32(header.data()+8),height=ReadU32(header.data()+12),length=ReadU32(header.data()+20);
            if(width!=m_width||height!=m_height||length!=m_width*m_height*3/2)break;
            std::vector<BYTE> next(length);if(!ReadExact(pipe,next.data(),length))break;std::lock_guard<std::mutex> guard(m_mutex);m_latest.swap(next);
        }
        DisconnectNamedPipe(pipe);CloseHandle(pipe);
    }
}

bool SimpleFrameGenerator::ReadExact(HANDLE pipe,void* destination,DWORD length){BYTE* cursor=static_cast<BYTE*>(destination);DWORD total=0;while(total<length&&!m_stopping){DWORD read=0;if(ReadFile(pipe,cursor+total,length-total,&read,nullptr)&&read>0){total+=read;continue;}DWORD error=GetLastError();if(error==ERROR_NO_DATA){Sleep(2);continue;}return false;}return total==length;}
void SimpleFrameGenerator::FillPlaceholder(){const size_t ySize=static_cast<size_t>(m_width)*m_height;m_latest.assign(ySize*3/2,128);std::fill(m_latest.begin(),m_latest.begin()+ySize,16);}
