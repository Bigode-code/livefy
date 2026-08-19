$ErrorActionPreference='Stop'
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
$principal=[Security.Principal.WindowsPrincipal]::new($identity)
if(!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Execute este desinstalador em um PowerShell aberto como Administrador.'}
$target=Join-Path $env:ProgramFiles 'Livefy\Audio'
$manager=Join-Path $target 'livefy-audio-manager.exe'
& sc.exe stop LivefyAudioBridge 2>$null|Out-Null
& sc.exe delete LivefyAudioBridge 2>$null|Out-Null
if(Test-Path -LiteralPath $manager){& $manager uninstall;if($LASTEXITCODE-ne 0){throw "Remoção do dispositivo falhou com ExitCode $LASTEXITCODE."}}
Write-Host 'Livefy Audio removido. Os arquivos instalados podem ser excluídos pelo instalador unificado.' -ForegroundColor Green
