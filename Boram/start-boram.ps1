$ErrorActionPreference = 'Stop'

$python = Get-Command python -CommandType Application | Select-Object -First 1
& $python.Source -c "import importlib.util, sys; sys.exit(importlib.util.find_spec('flask') is None)"
if ($LASTEXITCODE -ne 0) {
    & $python.Source -m pip install Flask
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to install Flask.'
    }
}

if (-not $env:BORAM_ATTENDANCE_ADMIN_KEY) {
    $adminKey = & $python.Source -c "import secrets; print(secrets.token_urlsafe(32))"
    if ($LASTEXITCODE -ne 0 -or -not $adminKey) {
        throw 'Failed to generate the attendance admin key.'
    }
    $env:BORAM_ATTENDANCE_ADMIN_KEY = $adminKey
}

if (-not $env:BORAM_HOST) {
    $env:BORAM_HOST = '0.0.0.0'
}

Write-Host "Boram attendance admin key: $env:BORAM_ATTENDANCE_ADMIN_KEY"
& $python.Source (Join-Path $PSScriptRoot 'dist/app.py')
exit $LASTEXITCODE
