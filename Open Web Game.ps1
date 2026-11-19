$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$url = 'http://localhost:3011'
function Get-LocalGameInfo {
    $client = New-Object System.Net.WebClient
    $client.Proxy = $null
    try {
        $client.DownloadString('http://127.0.0.1:3011/api/client-info') | ConvertFrom-Json
    } finally {
        $client.Dispose()
    }
}
$ready = $false
try {
    $info = Get-LocalGameInfo
    $ready = $info.app -eq 'an-thanh'
} catch {}

if (-not $ready) {
    $logs = Join-Path $root 'logs'
    New-Item -ItemType Directory -Force $logs | Out-Null
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $process = Start-Process -FilePath $node -ArgumentList 'server.mjs' -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logs "$stamp-out.log") -RedirectStandardError (Join-Path $logs "$stamp-error.log") -PassThru
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 400
        try {
            $info = Get-LocalGameInfo
            $ready = $info.app -eq 'an-thanh'
        } catch {}
        if ($ready) { break }
        if ($process.HasExited) { throw "Web server stopped. See $logs" }
    }
    if (-not $ready) { throw "Web server is still starting. See $logs" }
}
Start-Process ($url + '/defense.html')
