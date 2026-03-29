@echo off
start cmd /k "cd backend && uvicorn main:app --host 0.0.0.0 --port 8000"
start cmd /k "C:\ngrok\ngrok.exe http 8000"

timeout /t 5 >nul

for /f "delims=" %%i in ('powershell -Command "(Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels[0].public_url"') do set NGROK_URL=%%i

echo EXPO_PUBLIC_API_URL=%NGROK_URL%> mobile\.env

start cmd /k "cd mobile && npx expo start -c"