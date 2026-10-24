$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $projectRoot 'smarttube'
$toolRoot = Join-Path $projectRoot 'data\android-build'
$jdkFolder = Get-ChildItem -LiteralPath (Join-Path $toolRoot 'jdk') -Directory | Select-Object -First 1
if (-not $jdkFolder) { throw 'Chưa tìm thấy JDK cục bộ trong data/android-build/jdk.' }
$javaPath = Join-Path $jdkFolder.FullName 'bin\java.exe'
$wrapperPath = Join-Path $sourceRoot 'gradle\wrapper\gradle-wrapper.jar'
if (-not (Test-Path -LiteralPath $javaPath) -or -not (Test-Path -LiteralPath $wrapperPath)) {
    throw 'Thiếu Java hoặc Gradle wrapper. Chưa thể build SmartTube.'
}

$previousEnvironment = @{}
foreach ($variableName in @('JAVA_HOME', 'ANDROID_HOME', 'ANDROID_SDK_ROOT', 'ANDROID_USER_HOME', 'GRADLE_USER_HOME')) {
    $previousEnvironment[$variableName] = [Environment]::GetEnvironmentVariable($variableName, 'Process')
}
Push-Location -LiteralPath $sourceRoot
try {
    $env:JAVA_HOME = $jdkFolder.FullName
    $env:ANDROID_HOME = Join-Path $toolRoot 'sdk'
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
    $env:ANDROID_USER_HOME = Join-Path $toolRoot 'android-user'
    $env:GRADLE_USER_HOME = Join-Path $toolRoot 'gradle'
    # Invoke the wrapper directly; the upstream batch file deletes its project cache.
    & $javaPath -classpath $wrapperPath org.gradle.wrapper.GradleWrapperMain --no-daemon --max-workers=2 -PlocalTvUi=true :smarttubetv:assembleStfdroidDebug
    if ($LASTEXITCODE -ne 0) { throw 'Build SmartTube thất bại. Xem đầu ra Gradle phía trên.' }
} finally {
    Pop-Location
    foreach ($variableName in $previousEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($variableName, $previousEnvironment[$variableName], 'Process')
    }
}
