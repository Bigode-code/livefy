param([string]$Artifacts=(Join-Path $PSScriptRoot 'artifacts\x64\Release'))
$ErrorActionPreference='Stop'
$manager=Join-Path $Artifacts 'livefy-camera-manager.exe';$dll=Join-Path $Artifacts 'LivefyCameraMediaSource.dll'
if(!(Test-Path $manager)-or!(Test-Path $dll)){throw 'Build artifacts were not found. Run build.ps1 first.'}
$installRoot=Join-Path $env:ProgramFiles 'Livefy\Camera';New-Item -ItemType Directory -Force -Path $installRoot|Out-Null
Copy-Item -Force $manager,$dll $installRoot
& (Join-Path $installRoot 'livefy-camera-manager.exe') install (Join-Path $installRoot 'LivefyCameraMediaSource.dll')
if($LASTEXITCODE-ne 0){throw 'Livefy Camera registration failed.'}
