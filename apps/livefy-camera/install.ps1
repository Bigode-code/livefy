param([string]$Artifacts=(Join-Path $PSScriptRoot 'artifacts\x64\Release'))
$ErrorActionPreference='Stop'
$windowsBuild=[Environment]::OSVersion.Version.Build
if($windowsBuild-lt 22000){throw "Livefy Camera requires Windows 11 build 22000 or newer. Detected Windows build $windowsBuild. No files or registry entries were changed."}
$principal=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if(!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){
  $arguments=@('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`"",'-Artifacts',"`"$Artifacts`"")
  $elevated=Start-Process powershell.exe -Verb RunAs -ArgumentList $arguments -Wait -PassThru
  exit $elevated.ExitCode
}
$manager=Join-Path $Artifacts 'livefy-camera-manager.exe';$dll=Join-Path $Artifacts 'LivefyCameraMediaSource.dll'
if(!(Test-Path $manager)-or!(Test-Path $dll)){throw 'Build artifacts were not found. Run build.ps1 first.'}
$installRoot=Join-Path $env:ProgramFiles 'Livefy\Camera';New-Item -ItemType Directory -Force -Path $installRoot|Out-Null
Copy-Item -Force $manager,$dll $installRoot
& (Join-Path $installRoot 'livefy-camera-manager.exe') install (Join-Path $installRoot 'LivefyCameraMediaSource.dll')
if($LASTEXITCODE-ne 0){throw 'Livefy Camera registration failed.'}
Write-Output 'Livefy Camera installed and registered. Close and reopen camera applications before testing.'
