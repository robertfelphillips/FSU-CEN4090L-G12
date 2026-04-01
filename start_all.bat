@echo off

echo Starting mobile app...
powershell -Command "try { Invoke-WebRequest https://fsu-cen4090l-g12-1.onrender.com/ -UseBasicParsing } catch {}"
start cmd /k "cd mobile && npx expo start -c"