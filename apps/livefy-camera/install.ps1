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
$previousDirectShow=(Get-ItemProperty 'Registry::HKEY_CLASSES_ROOT\CLSID\{B8A1DA92-D00F-4EEA-85EC-91017B657A55}\InprocServer32' -ErrorAction SilentlyContinue).'(default)'
$version=(Get-FileHash -Algorithm SHA256 -LiteralPath $directShow).Hash.Substring(0,12).ToLowerInvariant();$installedDirectShow=Join-Path $installRoot "LivefyCameraDirectShow-$version.dll"
try{
  if($backend-eq'media-foundation'){Copy-Item -Force $manager,$dll $installRoot;$installedManager=Join-Path $installRoot 'livefy-camera-manager.exe';$installedDll=Join-Path $installRoot 'LivefyCameraMediaSource.dll';Write-Output "comando: `"$installedManager`" install `"$installedDll`"";& $installedManager install $installedDll;$exitCode=$LASTEXITCODE;Write-Output "ExitCode: $exitCode";if($exitCode-ne 0){throw "Registro Media Foundation falhou. ExitCode=$exitCode"}}
  else{Copy-Item -Force $directShow $installedDirectShow;Copy-Item -Force $registrar $installRoot;& (Join-Path $PSScriptRoot 'register-directshow.ps1') -Operation register -Artifacts $installRoot -DllPath $installedDirectShow;Set-Content -LiteralPath (Join-Path $installRoot 'directshow-dll.txt') -Value $installedDirectShow -Encoding ascii}
  Set-Content -LiteralPath (Join-Path $installRoot 'backend.txt') -Value $backend -Encoding ascii
}catch{
  Write-Error "Instalação falhou; executando rollback. $($_.Exception.Message)"
  if($backend-eq'directshow'-and$previousDirectShow-and(Test-Path -LiteralPath $previousDirectShow)){try{& (Join-Path $PSScriptRoot 'register-directshow.ps1') -Operation register -Artifacts $installRoot -DllPath $previousDirectShow}catch{Write-Warning "Restauração do registro anterior retornou: $($_.Exception.Message)"}}
  if($installedDirectShow-and(Test-Path -LiteralPath $installedDirectShow)){Remove-Item -LiteralPath $installedDirectShow -Force -ErrorAction SilentlyContinue}
  throw
}
if($backend-eq'directshow'){Get-ChildItem -LiteralPath $installRoot -Filter 'LivefyCameraDirectShow*.dll'|Where-Object FullName -ne $installedDirectShow|ForEach-Object{try{Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop}catch{Write-Warning "DLL anterior ainda em uso; será preservada: $($_.FullName)"}}}
Write-Output "Livefy Camera instalada e registrada com backend $backend. Feche e reabra aplicativos de câmera antes dos testes."
