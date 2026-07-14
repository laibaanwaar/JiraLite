. "$PSScriptRoot\Use-ProjectToolingEnv.ps1"
Set-Location (Join-Path $env:PROJECT_ROOT 'Frontend')
& npm.cmd @args
exit $LASTEXITCODE
