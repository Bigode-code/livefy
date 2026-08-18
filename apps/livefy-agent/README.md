# Livefy Windows Agent

The Agent is the local data plane for Livefy. It receives versioned commands over Chrome Native Messaging and owns media playback state. Video remains on the user's machine.

## Current verified scope

- Native Messaging framing and request correlation.
- Local FFprobe inspection and FFmpeg video/audio decoding.
- Infinite playback with an authoritative absolute clock across loops.
- Play, pause, stop, seek, volume and diagnostics commands.
- Chrome bridge with timeout, disconnect detection and reconnect attempts.

`Livefy Camera` is reported as `not_installed` until a Media Foundation virtual camera is built, registered, enumerated and opened by Chrome. `Livefy Audio` is likewise `not_configured`.

## Install the Chrome host

Build the extension in developer mode, copy its 32-character extension ID, then run:

```powershell
.\apps\livefy-agent\install-native-host.ps1 -ExtensionId '<extension-id>'
```

The installer builds the Agent and .NET launcher, copies them to `%LOCALAPPDATA%\Livefy\Agent`, writes the per-extension Native Messaging manifest and registers it under the current Windows user.
