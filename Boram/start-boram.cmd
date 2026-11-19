@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-boram.ps1"
set "BORAM_EXIT_CODE=%ERRORLEVEL%"
if not "%BORAM_EXIT_CODE%"=="0" (
    echo.
    echo Boram exited with code %BORAM_EXIT_CODE%. See the error above.
    pause
)
exit /b %BORAM_EXIT_CODE%
