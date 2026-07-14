$EnvFile = Join-Path $env:PROJECT_ROOT 'Backend/.env'
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if (-not $_ -or $_.Trim().StartsWith('#')) {
      return
    }

    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
      $name = $parts[0].Trim()
      $value = $parts[1].Trim()
      if ($name) {
        Set-Item -Path "Env:$name" -Value $value
      }
    }
  }
}
