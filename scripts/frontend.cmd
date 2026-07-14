@echo off
setlocal
call "%~dp0set-project-env.cmd"
pushd "%PROJECT_ROOT%\Frontend"
call npm.cmd %*
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%
