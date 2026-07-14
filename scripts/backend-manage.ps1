. "$PSScriptRoot\Use-ProjectToolingEnv.ps1"
. "$PSScriptRoot\Load-BackendEnv.ps1"
Set-Location (Join-Path $env:PROJECT_ROOT 'Backend')
& "$env:PROJECT_ROOT\Backend\venv\Scripts\python.exe" manage.py @args
exit $LASTEXITCODE
