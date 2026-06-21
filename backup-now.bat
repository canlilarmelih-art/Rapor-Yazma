@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-daily.ps1"
pause
