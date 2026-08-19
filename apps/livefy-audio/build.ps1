param([ValidateSet('Debug','Release')][string]$Configuration='Release')
$ErrorActionPreference='Stop'
$project=Join-Path $PSScriptRoot 'native\TabletAudioSample\TabletAudioSample.vcxproj'
$endpoints=Join-Path $PSScriptRoot 'native\EndpointsCommon\EndpointsCommon.vcxproj'
$vswhere='C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe'
if(!(Test-Path -LiteralPath $vswhere)){throw 'Visual Studio Installer was not found.'}
$installation=& $vswhere -latest -products * -requires Component.Microsoft.Windows.DriverKit -property installationPath
if(!$installation){throw 'Visual Studio with the Windows Driver Kit component was not found.'}
$vcvars=Join-Path $installation 'VC\Auxiliary\Build\vcvars64.bat'
$options=' /m /nr:false /p:Configuration='+$Configuration+' /p:Platform=x64 /p:SignMode=Off /v:minimal'
$bridgeSource=Join-Path $PSScriptRoot 'native\bridge\livefy-audio-bridge.cpp'
$bridgeOutput=Join-Path $PSScriptRoot ('artifacts\x64\'+$Configuration+'\livefy-audio-bridge.exe')
$bridgeDirectory=Split-Path -Parent $bridgeOutput
New-Item -ItemType Directory -Force -Path $bridgeDirectory|Out-Null
$bridgeObject=Join-Path $bridgeDirectory 'livefy-audio-bridge.obj'
$managerSource=Join-Path $PSScriptRoot 'native\manager\livefy-audio-manager.cpp'
$managerOutput=Join-Path $bridgeDirectory 'livefy-audio-manager.exe'
$managerObject=Join-Path $bridgeDirectory 'livefy-audio-manager.obj'
$command='set PATH=& set Path=& set PATH=C:\Windows\System32;C:\Windows& call "'+$vcvars+'" && msbuild "'+$endpoints+'"'+$options+' && msbuild "'+$project+'"'+$options+' && cl /nologo /std:c++17 /EHsc /O2 /W4 /WX "'+$bridgeSource+'" /Fo:"'+$bridgeObject+'" /Fe:"'+$bridgeOutput+'" advapi32.lib && cl /nologo /std:c++17 /EHsc /O2 /W4 /WX "'+$managerSource+'" /Fo:"'+$managerObject+'" /Fe:"'+$managerOutput+'" setupapi.lib newdev.lib'
& $env:ComSpec /d /c $command
if($LASTEXITCODE-ne 0){throw "Livefy Audio build failed with exit code $LASTEXITCODE."}
$driverOutput=Join-Path $PSScriptRoot ('native\TabletAudioSample\x64\'+$Configuration)
Copy-Item -LiteralPath (Join-Path $driverOutput 'LivefyAudio.sys') -Destination $bridgeDirectory -Force
Copy-Item -LiteralPath (Join-Path $driverOutput 'ComponentizedAudioSample.inf') -Destination (Join-Path $bridgeDirectory 'LivefyAudio.inf') -Force
$inf2cat=Get-ChildItem 'C:\Program Files (x86)\Windows Kits\10\bin' -Filter Inf2Cat.exe -Recurse -ErrorAction SilentlyContinue|Where-Object FullName -Match '\\x86\\Inf2Cat\.exe$'|Sort-Object FullName -Descending|Select-Object -First 1 -ExpandProperty FullName
if(!$inf2cat){throw 'Inf2Cat.exe was not found in the Windows Driver Kit.'}
& $inf2cat "/driver:$bridgeDirectory" '/os:10_X64'
if($LASTEXITCODE-ne 0){throw "Livefy Audio catalog generation failed with exit code $LASTEXITCODE."}
