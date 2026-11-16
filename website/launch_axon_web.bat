@echo off
setlocal
cd /d "%~dp0"
set "PY_EXE=C:\Users\JayPark1004\AppData\Local\Programs\Python\Python313\python.exe"
if not exist "%PY_EXE%" set "PY_EXE=python"
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient('127.0.0.1', 8000); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  start "AXON Quantum Web Server" /MIN "%PY_EXE%" -m http.server 8000
  ping -n 3 127.0.0.1 >nul
)
start "" "http://localhost:8000"
endlocal
