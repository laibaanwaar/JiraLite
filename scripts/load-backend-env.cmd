@echo off
setlocal
set "BACKEND_ENV_FILE=%PROJECT_ROOT%\Backend\.env"
if not exist "%BACKEND_ENV_FILE%" (
  endlocal
  exit /b 0
)
for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%BACKEND_ENV_FILE%") do (
  if not "%%A"=="" set "%%A=%%B"
)
endlocal & (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%BACKEND_ENV_FILE%") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)
