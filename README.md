# Cloud POS System

On-premise POS transformed into a cloud-based platform. FastAPI backend +
MySQL, deployable to AWS (EC2 + Amazon RDS) with infrastructure-as-code.

## Structure

```
app/                 FastAPI application
  database.py        env-driven DB config (localhost OR RDS — one variable)
  main.py            dashboard, /health, full CRUD for products & customers
  crud.py            data-access layer (safe parameterized SQL)
  schemas.py         request/response models
scripts/schema.sql   database schema + seed data
infra/cloudformation.yaml   one-shot AWS stack (EC2 + RDS)
deploy/ec2_userdata.sh      manual EC2 bootstrap
Dockerfile, docker-compose.yml   containerised local run
DEPLOY_AWS.md        step-by-step AWS deployment runbook
```

## Run locally

Original style (local MySQL on `cloud_pos`):

```bash
pip install -r requirements.txt
mysql -u root < scripts/schema.sql
uvicorn app.main:app --reload
# http://127.0.0.1:8000   and   /docs
```

Or with Docker (API + MySQL, mirrors the cloud shape):

```bash
docker compose up --build
```

## Deploy to AWS

See **DEPLOY_AWS.md**. Summary: the same code runs in the cloud — set
`DATABASE_URL` to the RDS endpoint and deploy. CloudFormation does it in one
command.

## Endpoints

| Method | Path | |
|--------|------|--|
| GET | `/` | Dashboard |
| GET | `/health` | Liveness + DB check |
| GET POST | `/products`, `/customers` | List / create |
| GET PUT DELETE | `/products/{id}`, `/customers/{id}` | Read / update / delete |
| GET | `/docs` | Swagger UI |
```
