$artifact=Join-Path $PSScriptRoot 'artifacts\x64\Release'
$driver=Join-Path $artifact 'LivefyAudio.sys'
$inf=Join-Path $artifact 'LivefyAudio.inf'
$catalog=Join-Path $artifact 'sysvad.cat'
$bridge=Join-Path $artifact 'livefy-audio-bridge.exe'
$manager=Join-Path $artifact 'livefy-audio-manager.exe'
$signature=if(Test-Path $catalog){Get-AuthenticodeSignature -LiteralPath $catalog}else{$null}
$pnp=@(Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue|Where-Object InstanceId -eq 'ROOT\LIVEFYAUDIO\0000')
$endpoint=@(Get-PnpDevice -Class AudioEndpoint -PresentOnly -ErrorAction SilentlyContinue|Where-Object FriendlyName -Like '*Livefy Audio*')
$service=Get-Service LivefyAudioBridge -ErrorAction SilentlyContinue
[pscustomobject]@{
  os=[Environment]::OSVersion.VersionString
  architecture=$env:PROCESSOR_ARCHITECTURE
  artifactDirectory=$artifact
  driverExists=Test-Path -LiteralPath $driver
  infExists=Test-Path -LiteralPath $inf
  catalogExists=Test-Path -LiteralPath $catalog
  bridgeExists=Test-Path -LiteralPath $bridge
  managerExists=Test-Path -LiteralPath $manager
  catalogSignature=if($signature){$signature.Status}else{'Missing'}
  catalogSignatureMessage=if($signature){$signature.StatusMessage}else{'Catálogo ausente'}
  pnpDevice=$pnp.Count -gt 0
  bridgeService=if($service){$service.Status}else{'NotInstalled'}
  captureEndpoint=$endpoint.Count -gt 0
  nextStep=if($signature -and $signature.Status -eq 'Valid'){'Executar install.ps1 como Administrador.'}else{'Assinar o catálogo do driver antes da instalação. Nenhum script da Livefy altera o modo de segurança do Windows.'}
}|Format-List
