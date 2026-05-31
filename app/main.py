"""
Cloud POS System — FastAPI backend.

Cloud-ready version: the same code runs locally and on AWS EC2 + RDS.
Only the DATABASE_URL environment variable changes between environments.
"""

import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import get_db, engine, DATABASE_URL
from app import crud, schemas

app = FastAPI(
    title="Cloud POS System",
    version="1.0.0",
    description="On-premise POS transformed into a cloud-based platform (AWS EC2 + RDS).",
)

# Enable CORS for local cross-port development (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# "rds" appears in Amazon RDS endpoints; used only to label the dashboard.
DEPLOY_ENV = "AWS Cloud (RDS)" if "rds" in DATABASE_URL else "Local Development"


@app.get("/health")
def health(db: Session = Depends(get_db)):
    """Liveness + DB connectivity probe (used by load balancers / monitoring)."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "environment": DEPLOY_ENV}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=503, detail=f"database unavailable: {exc}")


# ---------------- Products: full CRUD ----------------

@app.get("/products", response_model=list[schemas.Product])
def get_products(db: Session = Depends(get_db)):
    return crud.list_products(db)


@app.get("/products/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/products", response_model=schemas.Product, status_code=201)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, payload)


@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, payload: schemas.ProductUpdate, db: Session = Depends(get_db)):
    if not crud.get_product(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.update_product(db, product_id, payload)


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    if not crud.delete_product(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    return {"deleted": product_id}


# ---------------- Customers: full CRUD ----------------

@app.get("/customers", response_model=list[schemas.Customer])
def get_customers(db: Session = Depends(get_db)):
    return crud.list_customers(db)


@app.get("/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.post("/customers", response_model=schemas.Customer, status_code=201)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, payload)


@app.put("/customers/{customer_id}", response_model=schemas.Customer)
def update_customer(customer_id: int, payload: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    if not crud.get_customer(db, customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    return crud.update_customer(db, customer_id, payload)


@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    if not crud.delete_customer(db, customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"deleted": customer_id}


# ---------------- Branches: full CRUD ----------------

@app.get("/branches", response_model=list[schemas.Branch])
def get_branches(db: Session = Depends(get_db)):
    return crud.list_branches(db)


@app.get("/branches/{branch_id}", response_model=schemas.Branch)
def get_branch(branch_id: str, db: Session = Depends(get_db)):
    branch = crud.get_branch(db, branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch


@app.post("/branches", response_model=schemas.Branch, status_code=201)
def create_branch(payload: schemas.BranchCreate, db: Session = Depends(get_db)):
    if crud.get_branch(db, payload.id):
        raise HTTPException(status_code=400, detail="Branch with this ID already exists")
    return crud.create_branch(db, payload)


@app.put("/branches/{branch_id}", response_model=schemas.Branch)
def update_branch(branch_id: str, payload: schemas.BranchUpdate, db: Session = Depends(get_db)):
    if not crud.get_branch(db, branch_id):
        raise HTTPException(status_code=404, detail="Branch not found")
    return crud.update_branch(db, branch_id, payload)


@app.delete("/branches/{branch_id}")
def delete_branch(branch_id: str, db: Session = Depends(get_db)):
    if not crud.delete_branch(db, branch_id):
        raise HTTPException(status_code=404, detail="Branch not found")
    return {"deleted": branch_id}


# ---------------- Inventory Logs: full CRUD ----------------

@app.get("/inventory", response_model=list[schemas.Inventory])
def get_inventory(db: Session = Depends(get_db)):
    return crud.list_inventory_logs(db)


@app.post("/inventory", response_model=schemas.Inventory, status_code=201)
def create_inventory_log(payload: schemas.InventoryCreate, db: Session = Depends(get_db)):
    if not crud.get_product(db, payload.product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.create_inventory_log(db, payload)


# ---------------- Sales Transactions: full CRUD ----------------

@app.get("/transactions", response_model=list[schemas.Transaction])
def get_transactions(db: Session = Depends(get_db)):
    return crud.list_transactions(db)


@app.get("/transactions/{transaction_id}", response_model=schemas.Transaction)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = crud.get_transaction(db, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@app.post("/transactions", response_model=schemas.Transaction, status_code=201)
def create_transaction(payload: schemas.TransactionCreate, db: Session = Depends(get_db)):
    for item in payload.items:
        product = crud.get_product(db, item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        if product["stock"] < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product['name']}. Available: {product['stock']}, Requested: {item.quantity}"
            )
    return crud.create_transaction(db, payload)


# ---------------- Dashboard & Analytics Stats ----------------

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.compute_dashboard_stats(db)


# ---------------- Static Files & React SPA Hosting ----------------

# Absolute path to the compiled React assets
frontend_dist = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend",
    "dist"
)

# Route to serve SPA index.html for page loads, falling back to a elegant fallback if not built yet
@app.get("/")
def home():
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return HTMLResponse(
        f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cloud POS Service</title>
            <style>
                body {{
                    margin: 0;
                    font-family: system-ui, -apple-system, sans-serif;
                    background: #0f172a;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                }}
                .card {{
                    background: #1e293b;
                    padding: 3rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
                    border: 1px solid #334155;
                    max-width: 500px;
                }}
                h1 {{ color: #38bdf8; margin-top: 0; font-size: 2.25rem; }}
                p {{ color: #94a3b8; font-size: 1.125rem; line-height: 1.6; }}
                .badge {{
                    background: #1e1b4b;
                    color: #818cf8;
                    border: 1px solid #3730a3;
                    padding: 0.375rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    display: inline-block;
                    margin-bottom: 1.5rem;
                }}
                .btn {{
                    background: #38bdf8;
                    color: #0f172a;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    text-decoration: none;
                    font-weight: 600;
                    display: inline-block;
                    margin-top: 1.5rem;
                    transition: all 0.2s;
                }}
                .btn:hover {{ background: #0ea5e9; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="badge">{DEPLOY_ENV}</div>
                <h1>Smart Retail API Gateway</h1>
                <p>FastAPI microservice endpoints are running securely. Connect your Chromis POS client, or click below to browse the Swagger interactive docs.</p>
                <a href="/docs" class="btn">Explore API Swagger</a>
            </div>
        </body>
        </html>
        """
    )

# Serve all static files from fronted/dist if built
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

