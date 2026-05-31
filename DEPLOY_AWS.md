# Deploying Cloud POS to AWS

Two ways to deploy. **Path A** (CloudFormation) provisions everything with one
command. **Path B** is the manual console version if you want to show each AWS
service being created during a demo.

Estimated time: ~15 minutes (most of it is RDS taking a few minutes to come up).

> Prerequisites you must do yourself (require your AWS account login):
> - An AWS account with the AWS CLI configured (`aws configure`), **or** console access.
> - An EC2 key pair in your target region (EC2 → Key Pairs → Create).
> - Note: RDS + EC2 are billable. `db.t3.micro` / `t3.micro` are Free-Tier eligible
>   for the first 12 months; delete the stack afterwards to avoid charges.

---

## Path A — One command (CloudFormation)

```bash
aws cloudformation create-stack \
  --stack-name cloud-pos \
  --template-body file://infra/cloudformation.yaml \
  --parameters \
      ParameterKey=KeyPairName,ParameterValue=YOUR_KEYPAIR \
      ParameterKey=DBPassword,ParameterValue=YOUR_STRONG_PASSWORD \
  --capabilities CAPABILITY_NAMED_IAM
```

Wait for it to finish, then read the outputs (the public URL):

```bash
aws cloudformation wait stack-create-complete --stack-name cloud-pos
aws cloudformation describe-stacks --stack-name cloud-pos \
  --query "Stacks[0].Outputs" --output table
```

Open the `ApiUrl` value in a browser. `/docs` gives you Swagger.

Tear down when done (stops billing):

```bash
aws cloudformation delete-stack --stack-name cloud-pos
```

---

## Path B — Manual (good for a live demo of the AWS console)

1. **RDS** → Create database → MySQL → Free tier → `db.t3.micro`
   - DB name `cloud_pos`, master user `admin`, set a password.
   - When it's available, copy the **endpoint**.
2. **EC2** → Launch instance → Amazon Linux 2023 → `t3.micro`
   - Security group: allow inbound TCP **22** (SSH) and **8000** (API).
3. Make the RDS security group allow inbound **3306** from the EC2 instance.
4. SSH into EC2 and run:
   ```bash
   export RDS_HOST=<your-rds-endpoint>
   export RDS_PASS=<your-db-password>
   curl -s https://raw.githubusercontent.com/taibaik/cloud-pos-system/main/deploy/ec2_userdata.sh | bash
   ```
5. Browse to `http://<ec2-public-dns>:8000` and `/docs`.

---

## Why this is low-risk

The application code is identical locally and on AWS — only `DATABASE_URL`
changes (`localhost` → the RDS endpoint). There is no rewrite. `app/database.py`
reads that one environment variable; everything else is unchanged.

## Verify the deployment

```bash
curl http://<host>:8000/health
# {"status":"ok","database":"connected","environment":"AWS Cloud (RDS)"}
```
