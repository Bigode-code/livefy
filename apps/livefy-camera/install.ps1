param([string]$Artifacts=(Join-Path $PSScriptRoot 'artifacts\x64\Release'))
$ErrorActionPreference='Stop'
$windowsBuild=[Environment]::OSVersion.Version.Build
$principal=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if(!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){
  $arguments=@('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`"",'-Artifacts',"`"$Artifacts`"")
  $elevated=Start-Process powershell.exe -Verb RunAs -ArgumentList $arguments -Wait -PassThru
  exit $elevated.ExitCode
}
$manager=Join-Path $Artifacts 'livefy-camera-manager.exe';$dll=Join-Path $Artifacts 'LivefyCameraMediaSource.dll';$directShow=Join-Path $Artifacts 'LivefyCameraDirectShow.dll'
if($windowsBuild-ge 22000-and(!(Test-Path $manager)-or!(Test-Path $dll))){throw 'Media Foundation build artifacts were not found. Run build.ps1 first.'}
if($windowsBuild-lt 22000-and!(Test-Path $directShow)){throw 'DirectShow build artifact was not found. Run build.ps1 first.'}
$installRoot=Join-Path $env:ProgramFiles 'Livefy\Camera';New-Item -ItemType Directory -Force -Path $installRoot|Out-Null
if($windowsBuild-ge 22000){Copy-Item -Force $manager,$dll $installRoot;& (Join-Path $installRoot 'livefy-camera-manager.exe') install (Join-Path $installRoot 'LivefyCameraMediaSource.dll');$backend='media-foundation'}
else{Copy-Item -Force $directShow $installRoot;& "$env:WINDIR\System32\regsvr32.exe" /s (Join-Path $installRoot 'LivefyCameraDirectShow.dll');$backend='directshow'}
if($LASTEXITCODE-ne 0){throw "Livefy Camera $backend registration failed with exit code $LASTEXITCODE."}
Set-Content -LiteralPath (Join-Path $installRoot 'backend.txt') -Value $backend -Encoding ascii
Write-Output "Livefy Camera installed and registered with backend $backend. Close and reopen camera applications before testing."
