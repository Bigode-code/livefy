$ErrorActionPreference='Stop';$principal=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if(!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){$elevated=Start-Process powershell.exe -Verb RunAs -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`"") -Wait -PassThru;exit $elevated.ExitCode}
$installRoot=Join-Path $env:ProgramFiles 'Livefy\Camera';$manager=Join-Path $installRoot 'livefy-camera-manager.exe'
if(Test-Path $manager){& $manager uninstall;if($LASTEXITCODE-ne 0){throw 'Livefy Camera removal failed.'}}
Write-Output 'Livefy Camera unregistered. Installed files can be removed after camera consumers close.'
