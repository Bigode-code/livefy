param(
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-p]{32}$')][string]$ExtensionId
)
$ErrorActionPreference='Stop'
$agentRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot=Split-Path -Parent (Split-Path -Parent $agentRoot)
$installRoot=Join-Path $env:LOCALAPPDATA 'Livefy\Agent'
$hostRoot=Join-Path $installRoot 'host'
$agentInstall=Join-Path $hostRoot 'agent'
$manifestPath=Join-Path $installRoot 'com.livefy.agent.json'

& npm.cmd --prefix $agentRoot run build
if($LASTEXITCODE-ne 0){throw 'Agent TypeScript build failed.'}
New-Item -ItemType Directory -Force -Path $hostRoot | Out-Null
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if(!(Test-Path -LiteralPath $compiler)){throw 'Windows C# compiler was not found.'}
$launcherPath=Join-Path $hostRoot 'livefy-agent-host.exe'
$launcherSource=Join-Path $agentRoot 'launcher\Program.cs'
& $compiler /nologo /target:exe "/out:$launcherPath" $launcherSource
if($LASTEXITCODE-ne 0){throw 'Native host launcher build failed.'}

New-Item -ItemType Directory -Force -Path $agentInstall | Out-Null
Copy-Item -Recurse -Force (Join-Path $agentRoot 'dist') $agentInstall
$manifest=@{
  name='com.livefy.agent'
  description='Livefy Windows Agent native messaging host'
  path=(Join-Path $hostRoot 'livefy-agent-host.exe')
  type='stdio'
  allowed_origins=@("chrome-extension://$ExtensionId/")
}|ConvertTo-Json -Depth 4
Set-Content -LiteralPath $manifestPath -Value $manifest -Encoding utf8
New-Item -Path 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.livefy.agent' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.livefy.agent' -Name '(default)' -Value $manifestPath
Write-Output "Livefy Agent registered for Chrome extension $ExtensionId"
