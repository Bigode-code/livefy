#include <sysvad.h>
#include "EndpointsCommon/livefypcm.h"

#define LIVEFY_PCM_POOL_TAG 'AfVL'
#define LIVEFY_PCM_CAPACITY (1024u * 1024u)

static PDEVICE_OBJECT g_ControlDevice = nullptr;
static UNICODE_STRING g_ControlName = RTL_CONSTANT_STRING(L"\\Device\\LivefyAudioControl");
static UNICODE_STRING g_ControlLink = RTL_CONSTANT_STRING(L"\\DosDevices\\LivefyAudioControl");
static PDRIVER_DISPATCH g_PreviousCreate = nullptr;
static PDRIVER_DISPATCH g_PreviousClose = nullptr;
static PDRIVER_DISPATCH g_PreviousDeviceControl = nullptr;
static PUCHAR g_Buffer = nullptr;
static ULONG g_ReadOffset = 0;
static ULONG g_WriteOffset = 0;
static ULONG g_Buffered = 0;
static KSPIN_LOCK g_BufferLock;
static LIVEFY_AUDIO_STATS g_Stats = {};

static VOID ResetBufferLocked()
{
    g_ReadOffset = g_WriteOffset = g_Buffered = 0;
    g_Stats.BufferedBytes = 0;
}

static NTSTATUS CompleteIrp(_Inout_ PIRP Irp, NTSTATUS Status, ULONG_PTR Information = 0)
{
    Irp->IoStatus.Status = Status;
    Irp->IoStatus.Information = Information;
    IoCompleteRequest(Irp, IO_NO_INCREMENT);
    return Status;
}

static NTSTATUS LivefyCreateClose(_In_ PDEVICE_OBJECT DeviceObject, _Inout_ PIRP Irp)
{
    if (DeviceObject == g_ControlDevice) return CompleteIrp(Irp, STATUS_SUCCESS);
    PIO_STACK_LOCATION stack = IoGetCurrentIrpStackLocation(Irp);
    PDRIVER_DISPATCH previous = stack->MajorFunction == IRP_MJ_CREATE ? g_PreviousCreate : g_PreviousClose;
    return previous != nullptr ? previous(DeviceObject, Irp) : CompleteIrp(Irp, STATUS_INVALID_DEVICE_REQUEST);
}

static NTSTATUS LivefyDeviceControl(_In_ PDEVICE_OBJECT DeviceObject, _Inout_ PIRP Irp)
{
    if (DeviceObject != g_ControlDevice) {
        return g_PreviousDeviceControl != nullptr ? g_PreviousDeviceControl(DeviceObject, Irp)
            : CompleteIrp(Irp, STATUS_INVALID_DEVICE_REQUEST);
    }
    PIO_STACK_LOCATION stack = IoGetCurrentIrpStackLocation(Irp);
    ULONG code = stack->Parameters.DeviceIoControl.IoControlCode;
    ULONG inputLength = stack->Parameters.DeviceIoControl.InputBufferLength;
    ULONG outputLength = stack->Parameters.DeviceIoControl.OutputBufferLength;
    PUCHAR systemBuffer = static_cast<PUCHAR>(Irp->AssociatedIrp.SystemBuffer);

    if (code == IOCTL_LIVEFY_AUDIO_PUSH_PCM) {
        if (systemBuffer == nullptr || inputLength == 0 || (inputLength % 4) != 0)
            return CompleteIrp(Irp, STATUS_INVALID_BUFFER_SIZE);
        KIRQL oldIrql;
        KeAcquireSpinLock(&g_BufferLock, &oldIrql);
        ULONG accepted = min(inputLength, LIVEFY_PCM_CAPACITY);
        PUCHAR source = systemBuffer + (inputLength - accepted);
        ULONG freeBytes = LIVEFY_PCM_CAPACITY - g_Buffered;
        ULONG discarded = accepted > freeBytes ? accepted - freeBytes : 0;
        if (discarded > 0) {
            g_ReadOffset = (g_ReadOffset + discarded) % LIVEFY_PCM_CAPACITY;
            g_Buffered -= discarded;
            g_Stats.Overruns++;
        }
        ULONG first = min(accepted, LIVEFY_PCM_CAPACITY - g_WriteOffset);
        RtlCopyMemory(g_Buffer + g_WriteOffset, source, first);
        if (accepted > first) RtlCopyMemory(g_Buffer, source + first, accepted - first);
        g_WriteOffset = (g_WriteOffset + accepted) % LIVEFY_PCM_CAPACITY;
        g_Buffered += accepted;
        g_Stats.BytesWritten += accepted;
        g_Stats.BufferedBytes = g_Buffered;
        KeReleaseSpinLock(&g_BufferLock, oldIrql);
        return CompleteIrp(Irp, STATUS_SUCCESS, accepted);
    }
    if (code == IOCTL_LIVEFY_AUDIO_GET_STATS) {
        if (systemBuffer == nullptr || outputLength < sizeof(LIVEFY_AUDIO_STATS))
            return CompleteIrp(Irp, STATUS_BUFFER_TOO_SMALL);
        KIRQL oldIrql;
        KeAcquireSpinLock(&g_BufferLock, &oldIrql);
        RtlCopyMemory(systemBuffer, &g_Stats, sizeof(g_Stats));
        KeReleaseSpinLock(&g_BufferLock, oldIrql);
        return CompleteIrp(Irp, STATUS_SUCCESS, sizeof(LIVEFY_AUDIO_STATS));
    }
    if (code == IOCTL_LIVEFY_AUDIO_RESET) {
        KIRQL oldIrql;
        KeAcquireSpinLock(&g_BufferLock, &oldIrql);
        ResetBufferLocked();
        KeReleaseSpinLock(&g_BufferLock, oldIrql);
        return CompleteIrp(Irp, STATUS_SUCCESS);
    }
    return CompleteIrp(Irp, STATUS_INVALID_DEVICE_REQUEST);
}

NTSTATUS LivefyPcmInitialize(_In_ PDRIVER_OBJECT DriverObject)
{
    KeInitializeSpinLock(&g_BufferLock);
    g_Buffer = static_cast<PUCHAR>(ExAllocatePool2(POOL_FLAG_NON_PAGED, LIVEFY_PCM_CAPACITY, LIVEFY_PCM_POOL_TAG));
    if (g_Buffer == nullptr) return STATUS_INSUFFICIENT_RESOURCES;
    RtlZeroMemory(&g_Stats, sizeof(g_Stats));
    g_Stats.CapacityBytes = LIVEFY_PCM_CAPACITY;
    NTSTATUS status = IoCreateDevice(DriverObject, 0, &g_ControlName, FILE_DEVICE_UNKNOWN,
        FILE_DEVICE_SECURE_OPEN, FALSE, &g_ControlDevice);
    if (!NT_SUCCESS(status)) goto Failed;
    g_ControlDevice->Flags |= DO_BUFFERED_IO;
    status = IoCreateSymbolicLink(&g_ControlLink, &g_ControlName);
    if (!NT_SUCCESS(status)) {
        IoDeleteDevice(g_ControlDevice);
        g_ControlDevice = nullptr;
        goto Failed;
    }
    g_PreviousCreate = DriverObject->MajorFunction[IRP_MJ_CREATE];
    g_PreviousClose = DriverObject->MajorFunction[IRP_MJ_CLOSE];
    g_PreviousDeviceControl = DriverObject->MajorFunction[IRP_MJ_DEVICE_CONTROL];
    DriverObject->MajorFunction[IRP_MJ_CREATE] = LivefyCreateClose;
    DriverObject->MajorFunction[IRP_MJ_CLOSE] = LivefyCreateClose;
    DriverObject->MajorFunction[IRP_MJ_DEVICE_CONTROL] = LivefyDeviceControl;
    g_ControlDevice->Flags &= ~DO_DEVICE_INITIALIZING;
    return STATUS_SUCCESS;
Failed:
    ExFreePoolWithTag(g_Buffer, LIVEFY_PCM_POOL_TAG);
    g_Buffer = nullptr;
    return status;
}

VOID LivefyPcmCleanup()
{
    IoDeleteSymbolicLink(&g_ControlLink);
    if (g_ControlDevice != nullptr) { IoDeleteDevice(g_ControlDevice); g_ControlDevice = nullptr; }
    if (g_Buffer != nullptr) { ExFreePoolWithTag(g_Buffer, LIVEFY_PCM_POOL_TAG); g_Buffer = nullptr; }
}

VOID LivefyPcmRead(_Out_writes_bytes_(ByteCount) PUCHAR Destination, _In_ ULONG ByteCount)
{
    if (Destination == nullptr || ByteCount == 0) return;
    if (g_Buffer == nullptr) { RtlZeroMemory(Destination, ByteCount); return; }
    KIRQL oldIrql;
    KeAcquireSpinLock(&g_BufferLock, &oldIrql);
    ULONG available = min(ByteCount, g_Buffered);
    ULONG first = min(available, LIVEFY_PCM_CAPACITY - g_ReadOffset);
    if (first > 0) RtlCopyMemory(Destination, g_Buffer + g_ReadOffset, first);
    if (available > first) RtlCopyMemory(Destination + first, g_Buffer, available - first);
    g_ReadOffset = (g_ReadOffset + available) % LIVEFY_PCM_CAPACITY;
    g_Buffered -= available;
    g_Stats.BytesRead += available;
    g_Stats.BufferedBytes = g_Buffered;
    if (available < ByteCount) { g_Stats.Underruns++; RtlZeroMemory(Destination + available, ByteCount - available); }
    KeReleaseSpinLock(&g_BufferLock, oldIrql);
}
