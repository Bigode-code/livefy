param([string]$Artifacts=(Join-Path $PSScriptRoot 'artifacts\x64\Release'))
$ErrorActionPreference='Stop'
$windowsBuild=[Environment]::OSVersion.Version.Build;$backend=if($windowsBuild-ge 22000){'media-foundation'}else{'directshow'}
$artifactsPath=[IO.Path]::GetFullPath($Artifacts);$principal=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if(!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){$arguments=@('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`"",'-Artifacts',"`"$artifactsPath`"");$elevated=Start-Process powershell.exe -Verb RunAs -ArgumentList $arguments -Wait -PassThru;exit $elevated.ExitCode}
$manager=Join-Path $artifactsPath 'livefy-camera-manager.exe';$dll=Join-Path $artifactsPath 'LivefyCameraMediaSource.dll';$directShow=Join-Path $artifactsPath 'LivefyCameraDirectShow.dll';$registrar=Join-Path $artifactsPath 'register-directshow.exe'
Write-Output "backend selecionado: $backend";Write-Output 'arquitetura: x64';Write-Output "artifacts absolutos: $artifactsPath"
if($backend-eq'media-foundation'-and(!(Test-Path -LiteralPath $manager)-or!(Test-Path -LiteralPath $dll))){throw 'Artifacts Media Foundation ausentes. Execute build.ps1 primeiro.'}
if($backend-eq'directshow'){Write-Output "DLL absoluta: $directShow";Write-Output "DLL existe: $(Test-Path -LiteralPath $directShow)";Write-Output "registrador absoluto: $registrar";Write-Output "registrador existe: $(Test-Path -LiteralPath $registrar)";if(!(Test-Path -LiteralPath $directShow)-or!(Test-Path -LiteralPath $registrar)){throw 'Artifacts DirectShow ausentes. A DLL e register-directshow.exe são obrigatórios.'}}
$installRoot=Join-Path $env:ProgramFiles 'Livefy\Camera';New-Item -ItemType Directory -Force -Path $installRoot|Out-Null
try{
  if($backend-eq'media-foundation'){Copy-Item -Force $manager,$dll $installRoot;$installedManager=Join-Path $installRoot 'livefy-camera-manager.exe';$installedDll=Join-Path $installRoot 'LivefyCameraMediaSource.dll';Write-Output "comando: `"$installedManager`" install `"$installedDll`"";& $installedManager install $installedDll;$exitCode=$LASTEXITCODE;Write-Output "ExitCode: $exitCode";if($exitCode-ne 0){throw "Registro Media Foundation falhou. ExitCode=$exitCode"}}
  else{Copy-Item -Force $directShow,$registrar $installRoot;& (Join-Path $PSScriptRoot 'register-directshow.ps1') -Operation register -Artifacts $installRoot}
  Set-Content -LiteralPath (Join-Path $installRoot 'backend.txt') -Value $backend -Encoding ascii
}catch{
  Write-Error "Instalação falhou; executando rollback. $($_.Exception.Message)"
  if($backend-eq'directshow'-and(Test-Path -LiteralPath (Join-Path $installRoot 'register-directshow.exe'))){try{& (Join-Path $PSScriptRoot 'register-directshow.ps1') -Operation unregister -Artifacts $installRoot}catch{Write-Warning "Rollback do registro retornou: $($_.Exception.Message)"}}
  foreach($name in @('LivefyCameraDirectShow.dll','register-directshow.exe','backend.txt')){$path=Join-Path $installRoot $name;if(Test-Path -LiteralPath $path){Remove-Item -LiteralPath $path -Force}}
  throw
}
Write-Output "Livefy Camera instalada e registrada com backend $backend. Feche e reabra aplicativos de câmera antes dos testes."
