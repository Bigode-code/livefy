param([string]$Artifacts=(Join-Path $PSScriptRoot 'artifacts\x64\Release'))
$ErrorActionPreference='Stop';$principal=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if(!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){$arguments=@('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`"",'-Artifacts',"`"$Artifacts`"");$elevated=Start-Process powershell.exe -Verb RunAs -ArgumentList $arguments -Wait -PassThru;exit $elevated.ExitCode}
& (Join-Path $PSScriptRoot 'uninstall.ps1');& (Join-Path $PSScriptRoot 'install.ps1') -Artifacts $Artifacts
Write-Output 'Livefy Camera repair completed.'
