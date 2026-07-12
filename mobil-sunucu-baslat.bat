@echo off
cd /d "%~dp0"
set "PORT=5174"
set "HOST=0.0.0.0"
set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%NODE_EXE%" (
  "%NODE_EXE%" server.js
) else (
  node server.js
)
pause
