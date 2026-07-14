$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$CacheRoot = Join-Path $ProjectRoot '.cache'

$env:PROJECT_ROOT = $ProjectRoot
$env:PROJECT_CACHE_ROOT = $CacheRoot
$env:TMP = Join-Path $CacheRoot 'tmp'
$env:TEMP = $env:TMP
$env:npm_config_cache = Join-Path $CacheRoot 'npm'
$env:PIP_CACHE_DIR = Join-Path $CacheRoot 'pip'
$env:PYTHONPYCACHEPREFIX = Join-Path $CacheRoot 'python'
$env:VITE_CACHE_DIR = Join-Path $CacheRoot 'vite'
$env:PIPENV_VENV_IN_PROJECT = '1'

@(
  $CacheRoot,
  $env:TMP,
  $env:npm_config_cache,
  $env:PIP_CACHE_DIR,
  $env:PYTHONPYCACHEPREFIX,
  $env:VITE_CACHE_DIR
) | ForEach-Object {
  if (-not (Test-Path $_)) {
    New-Item -ItemType Directory -Force -Path $_ | Out-Null
  }
}
