param([ValidateSet('Debug','Release')][string]$Configuration='Release')
$ErrorActionPreference='Stop'
function Assert-Administrator{
  $identity=[Security.Principal.WindowsIdentity]::GetCurrent()
  $principal=[Security.Principal.WindowsPrincipal]::new($identity)
  if(!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Execute este instalador em um PowerShell aberto como Administrador.'}
}
function Invoke-Native([string]$File,[string[]]$Arguments,[int[]]$SuccessCodes=@(0)){
  Write-Host ('comando: "'+$File+'" '+($Arguments|ForEach-Object{'"'+($_ -replace '"','\"')+'"'}) -join ' ')
  $start=[Diagnostics.ProcessStartInfo]::new()
  $start.FileName=$File
  foreach($argument in $Arguments){[void]$start.ArgumentList.Add($argument)}
  $start.RedirectStandardOutput=$true
  $start.RedirectStandardError=$true
  $start.UseShellExecute=$false
  $start.CreateNoWindow=$true
  try{
    $process=[Diagnostics.Process]::Start($start)
    $stdout=$process.StandardOutput.ReadToEnd()
    $stderr=$process.StandardError.ReadToEnd()
    $process.WaitForExit()
  }catch [ComponentModel.Win32Exception]{
    Write-Host 'stdout:'
    Write-Host ''
    Write-Host 'stderr:'
    Write-Host $_.Exception.Message
    throw "$File não pôde iniciar. Win32=$($_.Exception.NativeErrorCode) HRESULT=0x$('{0:X8}' -f $_.Exception.HResult)."
  }
  Write-Host 'stdout:'
  Write-Host $stdout
  Write-Host 'stderr:'
  Write-Host $stderr
  Write-Host "ExitCode: $($process.ExitCode)"
  if($process.ExitCode-notin $SuccessCodes){throw "$File falhou com ExitCode $($process.ExitCode)."}
  return $process.ExitCode
}
Assert-Administrator
$artifacts=Join-Path $PSScriptRoot "artifacts\x64\$Configuration"
$required=@('LivefyAudio.inf','LivefyAudio.sys','sysvad.cat','livefy-audio-manager.exe','livefy-audio-bridge.exe')
Write-Host 'backend: WaveRT/WDM capture'
Write-Host 'arquitetura: x64'
Write-Host "artifacts: $artifacts"
foreach($name in $required){$path=Join-Path $artifacts $name;Write-Host "$name existe: $(Test-Path -LiteralPath $path)";if(!(Test-Path -LiteralPath $path)){throw "Artifact ausente: $path"}}
$catalog=Join-Path $artifacts 'sysvad.cat'
$signature=Get-AuthenticodeSignature -LiteralPath $catalog
Write-Host "assinatura do catálogo: $($signature.Status) — $($signature.StatusMessage)"
if($signature.Status-ne 'Valid'){throw 'Livefy Audio não foi instalado: o driver está compilado, mas o catálogo ainda não possui uma assinatura confiável do Windows. Nenhuma configuração de segurança foi alterada.'}
$target=Join-Path $env:ProgramFiles 'Livefy\Audio'
New-Item -ItemType Directory -Path $target -Force|Out-Null
foreach($name in $required){Copy-Item -LiteralPath (Join-Path $artifacts $name) -Destination $target -Force}
$manager=Join-Path $target 'livefy-audio-manager.exe'
$inf=Join-Path $target 'LivefyAudio.inf'
$bridge=Join-Path $target 'livefy-audio-bridge.exe'
try{
  Invoke-Native $manager @('install',$inf) @(0,10)|Out-Null
  & sc.exe stop LivefyAudioBridge 2>$null|Out-Null
  & sc.exe delete LivefyAudioBridge 2>$null|Out-Null
  Invoke-Native "$env:SystemRoot\System32\sc.exe" @('create','LivefyAudioBridge','binPath=',"`"$bridge`" --service",'start=','auto','DisplayName=','Livefy Audio Bridge')|Out-Null
  Invoke-Native "$env:SystemRoot\System32\sc.exe" @('start','LivefyAudioBridge')|Out-Null
  Write-Host 'Livefy Audio instalado, registrado e com bridge iniciado.' -ForegroundColor Green
}catch{
  Write-Warning 'Instalação falhou; executando rollback.'
  & sc.exe stop LivefyAudioBridge 2>$null|Out-Null
  & sc.exe delete LivefyAudioBridge 2>$null|Out-Null
  & $manager uninstall 2>$null|Out-Null
  throw
}
