@ECHO OFF
ECHO Adding Windows Firewall rule for Rapor Yazma...
ECHO.

REM mobil-sunucu-baslat.bat sunucuyu 5174 portunda acar; Claude_Preview/diger
REM akislar 5173'u kullanabilir. Telefon/tablet baglantisinin engellenmemesi
REM icin HER IKI port da acilir (2026-07-09: "sayfa acilmiyor" hatasi -
REM sunucu 5174'te dinliyordu ama guvenlik duvari yalnizca 5173'e izin
REM veriyordu).
NETSH ADVFIREWALL FIREWALL DELETE RULE NAME="Rapor Yazma 5173" >NUL 2>NUL
NETSH ADVFIREWALL FIREWALL ADD RULE NAME="Rapor Yazma 5173" DIR=IN ACTION=ALLOW PROTOCOL=TCP LOCALPORT=5173 PROFILE=ANY

NETSH ADVFIREWALL FIREWALL DELETE RULE NAME="Rapor Yazma 5174" >NUL 2>NUL
NETSH ADVFIREWALL FIREWALL ADD RULE NAME="Rapor Yazma 5174" DIR=IN ACTION=ALLOW PROTOCOL=TCP LOCALPORT=5174 PROFILE=ANY

FOR /F "tokens=2 delims=:" %%A IN ('ipconfig ^| findstr /C:"IPv4"') DO (
  SET "LOCAL_IP=%%A"
  GOTO :FOUND_IP
)

:FOUND_IP
SET "LOCAL_IP=%LOCAL_IP: =%"

ECHO.
ECHO Done.
ECHO Open one of these addresses on the tablet/phone (use whichever the
ECHO server window shows as listening):
ECHO   http://%LOCAL_IP%:5173   (Claude_Preview / autoPort)
ECHO   http://%LOCAL_IP%:5174   (mobil-sunucu-baslat.bat)
ECHO.
PAUSE
