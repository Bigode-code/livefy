param([string]$Configuration='Release',[string]$Platform='x64')
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$generated=Join-Path $root 'generated\Windows-Camera'
$sample=Join-Path $generated 'Samples\VirtualCamera'
$commit='790ac218eba8b6995393e9cc9537dfd7730fdb83'
$classicGenerated=Join-Path $root 'generated\Windows-classic-samples'
$classicCommit='d59e5f1dc9c768615e4e1ab1f0f009e6a3ed747c'
if(!(Test-Path (Join-Path $generated '.git'))){New-Item -ItemType Directory -Force -Path (Split-Path -Parent $generated)|Out-Null;git clone https://github.com/microsoft/Windows-Camera.git $generated}
git -C $generated fetch --depth 1 origin $commit
git -C $generated checkout --force $commit
if((git -C $generated rev-parse HEAD).Trim()-ne $commit){throw 'Official sample commit verification failed.'}

$mediaSource=Join-Path $sample 'VirtualCameraMediaSource'
Copy-Item -Force (Join-Path $root 'native\SimpleFrameGenerator.h') (Join-Path $mediaSource 'SimpleFrameGenerator.h')
Copy-Item -Force (Join-Path $root 'native\SimpleFrameGenerator.cpp') (Join-Path $mediaSource 'SimpleFrameGenerator.cpp')
$streamPath=Join-Path $mediaSource 'SimpleMediaStream.cpp';$stream=Get-Content -Raw $streamPath
$stream=$stream.Replace('#define NUM_IMAGE_ROWS 480','#define NUM_IMAGE_ROWS 1920').Replace('#define NUM_IMAGE_COLS 640','#define NUM_IMAGE_COLS 1080').Replace('const uint32_t NUM_MEDIATYPES = 2;','const uint32_t NUM_MEDIATYPES = 1;')
$rgb='(?s)\s*RETURN_IF_FAILED\(MFCreateMediaType\(&spMediaType\)\);\s*spMediaType->SetGUID\(MF_MT_MAJOR_TYPE, MFMediaType_Video\);\s*spMediaType->SetGUID\(MF_MT_SUBTYPE, MFVideoFormat_RGB32\);.*?mediaTypeList\[1\] = spMediaType.detach\(\);'
$stream=[regex]::Replace($stream,$rgb,'');Set-Content -LiteralPath $streamPath -Value $stream -Encoding utf8
$headerPath=Join-Path $mediaSource 'VirtualCameraMediaSource.h';$header=Get-Content -Raw $headerPath
$header=$header.Replace('{7B89B92E-FE71-42D0-8A41-E137D06EA184}','{A51F16A4-88C1-4D8D-9E39-3A2E8EE65F2B}').Replace('0x7b89b92e, 0xfe71, 0x42d0, 0x8a, 0x41, 0xe1, 0x37, 0xd0, 0x6e, 0xa1, 0x84','0xa51f16a4, 0x88c1, 0x4d8d, 0x9e, 0x39, 0x3a, 0x2e, 0x8e, 0xe6, 0x5f, 0x2b').Replace('L"VirtualCameraMediaSource"','L"Livefy Camera"');Set-Content -LiteralPath $headerPath -Value $header -Encoding utf8

nuget restore (Join-Path $sample 'VirtualCameraSample.sln') -PackagesDirectory (Join-Path $sample 'packages')
$project=Join-Path $mediaSource 'VirtualCameraMediaSource.vcxproj'
msbuild $project /m "/p:Configuration=$Configuration" "/p:Platform=$Platform" "/p:SolutionDir=$sample\"
$artifacts=Join-Path $root "artifacts\$Platform\$Configuration";New-Item -ItemType Directory -Force -Path $artifacts|Out-Null
$dll=Get-ChildItem -Path $sample -Filter VirtualCameraMediaSource.dll -Recurse|Where-Object FullName -Match "\\$Platform\\$Configuration\\"|Select-Object -First 1
if(!$dll){throw 'VirtualCameraMediaSource.dll was not produced.'};Copy-Item -Force $dll.FullName (Join-Path $artifacts 'LivefyCameraMediaSource.dll')
$compiler=Get-Command cl.exe -ErrorAction SilentlyContinue
if(!$compiler){
  $vswhere=Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
  if(!(Test-Path -LiteralPath $vswhere)){throw 'vswhere.exe was not found.'}
  $installation=(& $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath|Select-Object -First 1)
  if(!$installation){throw 'Visual C++ build tools were not found.'}
  $devcmd=Join-Path $installation 'Common7\Tools\VsDevCmd.bat'
  & cmd.exe /s /c "`"$devcmd`" -arch=$Platform -host_arch=x64 >nul && set"|ForEach-Object{if($_-match '^([^=]+)=(.*)$'){Set-Item -Path "env:$($matches[1])" -Value $matches[2]}}
}
$native=Join-Path $root 'native';cl /nologo /std:c++17 /EHsc /O2 (Join-Path $native 'camera-manager.cpp') "/Fe:$(Join-Path $artifacts 'livefy-camera-manager.exe')" /link mfplat.lib mfsensorgroup.lib mfuuid.lib ole32.lib advapi32.lib
if($LASTEXITCODE-ne 0){throw 'camera-manager build failed.'}
cl /nologo /std:c++17 /EHsc /O2 (Join-Path $native 'camera-test.cpp') "/Fe:$(Join-Path $artifacts 'camera-test.exe')" /link mfplat.lib mf.lib mfreadwrite.lib mfuuid.lib ole32.lib
if($LASTEXITCODE-ne 0){throw 'camera-test build failed.'}
cl /nologo /std:c++17 /EHsc /O2 (Join-Path $native 'directshow-test.cpp') "/Fe:$(Join-Path $artifacts 'directshow-test.exe')" /link strmiids.lib ole32.lib oleaut32.lib
if($LASTEXITCODE-ne 0){throw 'directshow-test build failed.'}
if(!(Test-Path (Join-Path $classicGenerated '.git'))){git clone https://github.com/microsoft/Windows-classic-samples.git $classicGenerated}
git -C $classicGenerated fetch --depth 1 origin $classicCommit
git -C $classicGenerated checkout --force $classicCommit
if((git -C $classicGenerated rev-parse HEAD).Trim()-ne $classicCommit){throw 'DirectShow sample commit verification failed.'}
$baseClasses=Join-Path $classicGenerated 'Samples\Win7Samples\multimedia\directshow\baseclasses';$directShowBuild=Join-Path $root 'generated\directshow-build'
cmake -S (Join-Path $root 'directshow') -B $directShowBuild -A $Platform "-DDIRECTSHOW_BASECLASSES_DIR=$baseClasses"
if($LASTEXITCODE-ne 0){throw 'DirectShow CMake configure failed.'}
cmake --build $directShowBuild --config $Configuration --parallel
if($LASTEXITCODE-ne 0){throw 'DirectShow backend build failed.'}
$directShowDll=Get-ChildItem -Path $directShowBuild -Filter LivefyCameraDirectShow.dll -Recurse|Select-Object -First 1
if(!$directShowDll){throw 'LivefyCameraDirectShow.dll was not produced.'};Copy-Item -Force $directShowDll.FullName (Join-Path $artifacts 'LivefyCameraDirectShow.dll')
Write-Output $artifacts
