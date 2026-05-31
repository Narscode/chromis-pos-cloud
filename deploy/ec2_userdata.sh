#!/bin/bash
# Manual EC2 bootstrap (Amazon Linux 2023) — alternative to CloudFormation.
# Use this if you provision EC2 + RDS by hand in the AWS console.
#
# 1. Launch a t3.micro EC2 instance (Amazon Linux 2023), open ports 22 and 8000.
# 2. Create an RDS MySQL db.t3.micro, note its endpoint.
# 3. SSH into the instance and run:
#       export RDS_HOST=your-db.xxxx.rds.amazonaws.com
#       export RDS_PASS=your-db-password
#       curl -s https://raw.githubusercontent.com/taibaik/cloud-pos-system/main/deploy/ec2_userdata.sh | bash
set -euxo pipefail

: "${RDS_HOST:?set RDS_HOST}"
: "${RDS_PASS:?set RDS_PASS}"

sudo dnf update -y
sudo dnf install -y python3.12 python3.12-pip git mariadb105

cd /opt
sudo git clone https://github.com/taibaik/cloud-pos-system.git cloud-pos
cd cloud-pos
sudo python3.12 -m pip install -r requirements.txt

# Schema + seed data
mysql -h "$RDS_HOST" -u admin -p"$RDS_PASS" < scripts/schema.sql || true

DB_URL="mysql+pymysql://admin:${RDS_PASS}@${RDS_HOST}:3306/cloud_pos"

sudo tee /etc/systemd/system/cloud-pos.service >/dev/null <<UNIT
[Unit]
Description=Cloud POS API
After=network.target

[Service]
WorkingDirectory=/opt/cloud-pos
Environment=DATABASE_URL=${DB_URL}
ExecStart=/usr/bin/python3.12 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now cloud-pos
echo "Deployed. API on http://<this-instance-public-dns>:8000"
