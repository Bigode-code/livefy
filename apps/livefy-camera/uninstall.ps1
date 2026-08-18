$ErrorActionPreference='Stop';$installRoot=Join-Path $env:ProgramFiles 'Livefy\Camera';$manager=Join-Path $installRoot 'livefy-camera-manager.exe'
if(Test-Path $manager){& $manager uninstall;if($LASTEXITCODE-ne 0){throw 'Livefy Camera removal failed.'}}
Write-Output 'Livefy Camera unregistered. Installed files can be removed after camera consumers close.'
