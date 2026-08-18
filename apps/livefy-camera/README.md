# Livefy Camera POC

This project implements a Windows 11 Media Foundation virtual camera based on Microsoft's official `Windows-Camera/Samples/VirtualCamera` Media Source at pinned commit `790ac218eba8b6995393e9cc9537dfd7730fdb83`.

## Architecture

The existing Agent owns the only FFmpeg process and authoritative playback clock. FFmpeg outputs 1080×1920, 30 FPS, NV12 raw frames. The Agent retains the latest frame and sends a framed copy at camera cadence to `\\.\pipe\livefy-camera-frames-v1`. The Media Source owns the named-pipe endpoint with an explicit ACL for authenticated users, Local System and administrators. It retains the last complete frame and copies it into Media Foundation samples. No compressed video, network service, Supabase, Native Messaging or per-frame file is involved.

If the Agent is absent, the Media Source produces a stable black NV12 placeholder. Pause kills the decoder but does not stop the frame transport, so the last frame is repeated. Resume and seek restart the same authoritative decoder at the clock position while the camera device remains open.

## Native dependencies

- Windows 11 build 22000 or newer; build 22621+ recommended.
- Visual Studio 2022 Build Tools: Desktop development with C++.
- Windows 11 SDK 10.0.26100.
- NuGet CLI, MSBuild and Git.

Build from a Developer PowerShell:

```powershell
.\apps\livefy-camera\build.ps1
```

The script verifies a pinned Microsoft sample commit, restores C++/WinRT and WIL, overlays the Livefy NV12 frame source, builds the Media Source DLL, manager and camera test under `artifacts\x64\Release`.

## Install and remove

Run PowerShell as administrator:

```powershell
.\apps\livefy-camera\install.ps1
.\apps\livefy-camera\uninstall.ps1
```

The installer performs an OS-build preflight before elevation or file changes. Windows 10 is rejected because it does not export `MFCreateVirtualCamera`; the product does not fall back to OBS, RTMP or an empty legacy capture device.

Uninstall first calls `IMFVirtualCamera::Remove()`, then removes COM registration and the installed camera files. Camera consumers must be closed first.

## A–H test harness

1. Install the camera and build the Agent with `npm run agent:build`.
2. Set `LIVEFY_FFMPEG_PATH` and `LIVEFY_FFPROBE_PATH`, then run `node apps/livefy-camera/tools/run-camera-poc.mjs C:\path\video.mp4`.
3. Run `node apps/livefy-camera/tools/browser-test/serve.mjs` and open `http://127.0.0.1:4174` in Chrome.
4. Click the permission/open button. The page must enumerate and open exactly `Livefy Camera` and show its settings.
5. Run `apps\livefy-camera\artifacts\x64\Release\camera-test.exe 90` for an independent Media Foundation capture. It prints devices, measured FPS and saves `livefy-camera-frame.nv12` as evidence.
6. While Chrome remains open, exercise Agent pause, resume and seek through Native Messaging or the Agent protocol and record the visible behavior.

The milestone remains incomplete until Windows and Chrome evidence prove all A–H acceptance items.
