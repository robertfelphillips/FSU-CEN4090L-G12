#!/bin/bash

echo "Starting mobile app..."

# Wake up Render backend
curl -s https://fsu-cen4090l-g12-1.onrender.com/ > /dev/null || true

# Start Expo
cd mobile
npx expo start -c