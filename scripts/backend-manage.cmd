@echo off
setlocal
call "%~dp0set-project-env.cmd"
call "%~dp0load-backend-env.cmd"
pushd "%PROJECT_ROOT%\Backend"
call "%PROJECT_ROOT%\Backend\venv\Scripts\python.exe" manage.py %*
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%
