@echo off
setlocal

set "APP_DIR=%~dp0"
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%BUNDLED_NODE%" (
  set "NODE_EXE=%BUNDLED_NODE%"
) else (
  set "NODE_EXE=node"
)

cd /d "%APP_DIR%"
"%NODE_EXE%" tools\check-basic.js
if errorlevel 1 goto fail
"%NODE_EXE%" tools\test-parsers.js
if errorlevel 1 goto fail

echo.
echo Tum kontroller basarili.
pause
exit /b 0

:fail
echo.
echo Kontrol basarisiz oldu. Yukaridaki hata mesajini kontrol edin.
pause
exit /b 1

