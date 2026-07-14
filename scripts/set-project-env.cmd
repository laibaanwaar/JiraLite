@echo off
setlocal

set "PROJECT_ROOT=%~dp0.."
for %%I in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fI"
set "PROJECT_CACHE_ROOT=%PROJECT_ROOT%\.cache"
set "TMP=%PROJECT_CACHE_ROOT%\tmp"
set "TEMP=%PROJECT_CACHE_ROOT%\tmp"
set "npm_config_cache=%PROJECT_CACHE_ROOT%\npm"
set "PIP_CACHE_DIR=%PROJECT_CACHE_ROOT%\pip"
set "PYTHONPYCACHEPREFIX=%PROJECT_CACHE_ROOT%\python"
set "VITE_CACHE_DIR=%PROJECT_CACHE_ROOT%\vite"
set "PIPENV_VENV_IN_PROJECT=1"

if not exist "%PROJECT_CACHE_ROOT%" mkdir "%PROJECT_CACHE_ROOT%"
if not exist "%TMP%" mkdir "%TMP%"
if not exist "%npm_config_cache%" mkdir "%npm_config_cache%"
if not exist "%PIP_CACHE_DIR%" mkdir "%PIP_CACHE_DIR%"
if not exist "%PYTHONPYCACHEPREFIX%" mkdir "%PYTHONPYCACHEPREFIX%"
if not exist "%VITE_CACHE_DIR%" mkdir "%VITE_CACHE_DIR%"

endlocal & (
  set "PROJECT_ROOT=%PROJECT_ROOT%"
  set "PROJECT_CACHE_ROOT=%PROJECT_CACHE_ROOT%"
  set "TMP=%TMP%"
  set "TEMP=%TEMP%"
  set "npm_config_cache=%npm_config_cache%"
  set "PIP_CACHE_DIR=%PIP_CACHE_DIR%"
  set "PYTHONPYCACHEPREFIX=%PYTHONPYCACHEPREFIX%"
  set "VITE_CACHE_DIR=%VITE_CACHE_DIR%"
  set "PIPENV_VENV_IN_PROJECT=%PIPENV_VENV_IN_PROJECT%"
)
