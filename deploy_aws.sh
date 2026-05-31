#!/bin/bash
# ==============================================================================
# AWS EC2 One-Shot Deployment Script for Smart Retail Cloud POS
# ==============================================================================
# Run this script from your local machine to automatically push and deploy 
# the completed, cloud-connected codebase onto your AWS EC2 instance!
# ==============================================================================

# Configuration
KEY_PATH="/Users/nareswari/Downloads/cloud-pos-key.pem"
EC2_IP="16.176.27.244"
EC2_USER="ubuntu"
REMOTE_DIR="/opt/cloud-pos"

echo -e "\033[1;34m============================================================\033[0m"
echo -e "\033[1;36m  SMART RETAIL POS — ONE-SHOT AWS CLOUD DEPLOYER\033[0m"
echo -e "\033[1;34m============================================================\033[0m"

# 1. Check if the private key exists
if [ ! -f "$KEY_PATH" ]; then
    echo -e "\033[1;31m[ERROR] Private key file not found at: $KEY_PATH\033[0m"
    echo -e "Please make sure your 'cloud-pos-key.pem' is present in your Downloads folder."
    exit 1
fi

# 2. Correct SSH key permissions
echo -e "\033[1;30m[+] Securing private key permissions...\033[0m"
chmod 400 "$KEY_PATH"

# 3. Connect and execute deployment
echo -e "\033[1;30m[+] Connecting to AWS EC2 instance at $EC2_IP via SSH...\033[0m"
echo -e "\033[1;30m[+] Running remote repository pull and backend server reload...\033[0m"
echo -e "------------------------------------------------------------"

ssh -i "$KEY_PATH" -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new ${EC2_USER}@${EC2_IP} \
    "echo '[EC2] Navigating to project directory...' && cd $REMOTE_DIR && \
     echo '[EC2] Pulling latest pre-compiled React + FastAPI updates from GitHub...' && sudo git pull origin main && \
     echo '[EC2] Reloading systemd manager...' && sudo systemctl daemon-reload && \
     echo '[EC2] Restarting Cloud POS API service daemon...' && sudo systemctl restart cloud-pos && \
     echo '[EC2] Checking service status...' && sudo systemctl is-active cloud-pos"

if [ $? -eq 0 ]; then
    echo -e "------------------------------------------------------------"
    echo -e "\033[1;32m[SUCCESS] Smart Retail POS successfully deployed to AWS EC2!\033[0m"
    echo -e "Central cloud database tables and forecast aggregates are now live."
    echo -e "Open your browser to visit the Smart Retail Dashboard at:"
    echo -e "   \033[1;36mURL:\033[0m http://${EC2_IP}:8000"
    echo -e "============================================================"
else
    echo -e "------------------------------------------------------------"
    echo -e "\033[1;31m[ERROR] Deployment failed.\033[0m"
    echo -e "Please verify:"
    echo -e "  1. Your internet connection is active."
    echo -e "  2. You are connected to your university/admin network subnet ($182.253.183.7)."
    echo -e "  3. The EC2 instance at $EC2_IP is booted and running."
    echo -e "============================================================"
    exit 1
fi
