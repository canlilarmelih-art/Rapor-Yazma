@echo off
setlocal
set "SCRIPT=%~dp0backup-run-silent.bat"
schtasks /Create /TN "RaporYazmaGunlukYedek" /SC DAILY /ST 20:00 /TR "%SCRIPT%" /F
echo Daily backup task installed for 20:00.
pause
