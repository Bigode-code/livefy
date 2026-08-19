# Livefy Audio

Native Windows virtual capture endpoint for Livefy. The endpoint is a WaveRT/WDM
microphone derived from Microsoft's SysVAD sample and is isolated from the
Agent's PCM decoder and mixer.

## Format and transport

- PCM signed 16-bit little-endian
- 48 kHz
- stereo
- 10 ms mixer blocks
- local IPC only (no Supabase, Native Messaging, HTTP, or per-frame files)

The Agent writes framed PCM to `livefy-audio-pcm-v1`. The user-mode bridge
validates each frame and sends it through a private buffered IOCTL. The driver
keeps PCM in nonpaged memory for the WaveRT capture stream and emits silence on
underrun, so closing or pausing media does not end the microphone track.

The native base comes from Microsoft Windows Driver Samples commit
`717778a20ba4dd2440fe609f69153a1f8a64f597` and retains the Microsoft Public
License in `native/MS-PL.txt`. Only the capture endpoint is enabled; render,
Bluetooth, USB, HDMI, SPDIF, and microphone-array endpoints are disabled.

Run `build.ps1` for an unsigned development build. Visual Studio 2022 C++, the
matching SDK/WDK 10.0.26100, and Spectre libraries are required. Windows x64
requires a trusted signature before installation. Production distribution needs
Microsoft attestation/HLK signing. No Livefy script enables Windows test mode.
