@echo off
echo 正在启动TestCoin DApp服务器...
echo 服务器地址: http://localhost:8080
echo 按 Ctrl+C 停止服务器
echo.
cd /d "%~dp0"
python -m http.server 8080
pause
