"""
Data access layer.

Uses SQLAlchemy Core with bound parameters (no string formatting) so the
queries are safe against SQL injection. Kept close to the team's original
raw-SQL style so it stays easy to explain in a presentation.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session


# ---------------- Products ----------------

def list_products(db: Session):
    rows = db.execute(text("SELECT * FROM products ORDER BY id")).mappings().all()
    return [dict(r) for r in rows]


def get_product(db: Session, product_id: int):
    row = db.execute(
        text("SELECT * FROM products WHERE id = :id"),
        {"id": product_id},
    ).mappings().first()
    return dict(row) if row else None


def create_product(db: Session, p):
    result = db.execute(
        text(
            "INSERT INTO products (name, price, stock, branch_id, sync_status) "
            "VALUES (:name, :price, :stock, :branch_id, :sync_status)"
        ),
        p.dict(),
    )
    db.commit()
    return get_product(db, result.lastrowid)


def update_product(db: Session, product_id: int, p):
    fields = {k: v for k, v in p.dict().items() if v is not None}
    if not fields:
        return get_product(db, product_id)
    assignments = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = product_id
    db.execute(
        text(f"UPDATE products SET {assignments} WHERE id = :id"),
        fields,
    )
    db.commit()
    return get_product(db, product_id)


def delete_product(db: Session, product_id: int) -> bool:
    result = db.execute(
        text("DELETE FROM products WHERE id = :id"),
        {"id": product_id},
    )
    db.commit()
    return result.rowcount > 0


# ---------------- Customers ----------------

def list_customers(db: Session):
    rows = db.execute(text("SELECT * FROM customers ORDER BY id")).mappings().all()
    return [dict(r) for r in rows]


def get_customer(db: Session, customer_id: int):
    row = db.execute(
        text("SELECT * FROM customers WHERE id = :id"),
        {"id": customer_id},
    ).mappings().first()
    return dict(row) if row else None


def create_customer(db: Session, c):
    result = db.execute(
        text("INSERT INTO customers (name, email) VALUES (:name, :email)"),
        c.dict(),
    )
    db.commit()
    return get_customer(db, result.lastrowid)


def update_customer(db: Session, customer_id: int, c):
    fields = {k: v for k, v in c.dict().items() if v is not None}
    if not fields:
        return get_customer(db, customer_id)
    assignments = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = customer_id
    db.execute(
        text(f"UPDATE customers SET {assignments} WHERE id = :id"),
        fields,
    )
    db.commit()
    return get_customer(db, customer_id)


def delete_customer(db: Session, customer_id: int) -> bool:
    result = db.execute(
        text("DELETE FROM customers WHERE id = :id"),
        {"id": customer_id},
    )
    db.commit()
    return result.rowcount > 0


# ---------------- Branches ----------------

def list_branches(db: Session):
    rows = db.execute(text("SELECT * FROM branches ORDER BY id")).mappings().all()
    return [dict(r) for r in rows]


def get_branch(db: Session, branch_id: str):
    row = db.execute(
        text("SELECT * FROM branches WHERE id = :id"),
        {"id": branch_id},
    ).mappings().first()
    return dict(row) if row else None


def create_branch(db: Session, b):
    db.execute(
        text(
            "INSERT INTO branches (id, name, location, sync_status, last_sync_timestamp) "
            "VALUES (:id, :name, :location, :sync_status, :last_sync_timestamp)"
        ),
        b.dict(),
    )
    db.commit()
    return get_branch(db, b.id)


def update_branch(db: Session, branch_id: str, b):
    fields = {k: v for k, v in b.dict().items() if v is not None}
    if not fields:
        return get_branch(db, branch_id)
    assignments = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = branch_id
    db.execute(
        text(f"UPDATE branches SET {assignments} WHERE id = :id"),
        fields,
    )
    db.commit()
    return get_branch(db, branch_id)


def delete_branch(db: Session, branch_id: str) -> bool:
    result = db.execute(
        text("DELETE FROM branches WHERE id = :id"),
        {"id": branch_id},
    )
    db.commit()
    return result.rowcount > 0


# ---------------- Inventory Logs ----------------

def list_inventory_logs(db: Session):
    rows = db.execute(
        text(
            "SELECT i.*, p.name as product_name "
            "FROM inventory i "
            "LEFT JOIN products p ON i.product_id = p.id "
            "ORDER BY i.id DESC"
        )
    ).mappings().all()
    return [dict(r) for r in rows]


def create_inventory_log(db: Session, log):
    result = db.execute(
        text(
            "INSERT INTO inventory (product_id, branch_id, quantity, transaction_type, timestamp) "
            "VALUES (:product_id, :branch_id, :quantity, :transaction_type, CURRENT_TIMESTAMP)"
        ),
        log.dict(),
    )
    db.commit()
    
    # Also adjust the product's physical stock level!
    if log.transaction_type == "STOCK_IN":
        db.execute(
            text("UPDATE products SET stock = stock + :qty WHERE id = :pid"),
            {"qty": log.quantity, "pid": log.product_id},
        )
    elif log.transaction_type == "ADJUSTMENT":
        # Force set the product stock level
        db.execute(
            text("UPDATE products SET stock = :qty WHERE id = :pid"),
            {"qty": log.quantity, "pid": log.product_id},
        )
    db.commit()
    
    row = db.execute(
        text("SELECT * FROM inventory WHERE id = :id"),
        {"id": result.lastrowid},
    ).mappings().first()
    return dict(row) if row else None


# ---------------- Sales Transactions ----------------

def list_transactions(db: Session):
    rows = db.execute(text("SELECT * FROM sales_transactions ORDER BY id DESC")).mappings().all()
    txs = []
    for r in rows:
        tx = dict(r)
        # Fetch items
        items = db.execute(
            text("SELECT * FROM transaction_items WHERE transaction_id = :tx_id"),
            {"tx_id": tx["id"]},
        ).mappings().all()
        tx["items"] = [dict(i) for i in items]
        txs.append(tx)
    return txs


def get_transaction(db: Session, transaction_id: int):
    row = db.execute(
        text("SELECT * FROM sales_transactions WHERE id = :id"),
        {"id": transaction_id},
    ).mappings().first()
    if not row:
        return None
    tx = dict(row)
    items = db.execute(
        text("SELECT * FROM transaction_items WHERE transaction_id = :tx_id"),
        {"tx_id": tx["id"]},
    ).mappings().all()
    tx["items"] = [dict(i) for i in items]
    return tx


def create_transaction(db: Session, t):
    import datetime
    import random
    
    # 1. Generate unique transaction number: TX-YYYYMMDD-XXXX
    date_str = datetime.date.today().strftime("%Y%m%d")
    rand_suffix = random.randint(1000, 9999)
    tx_number = f"TX-{date_str}-{rand_suffix}"
    
    # 2. Insert into sales_transactions
    payload = t.dict()
    items_to_create = payload.pop("items", [])
    payload["transaction_number"] = tx_number
    
    result = db.execute(
        text(
            "INSERT INTO sales_transactions (transaction_number, customer_id, branch_id, total_amount, sync_status, timestamp) "
            "VALUES (:transaction_number, :customer_id, :branch_id, :total_amount, :sync_status, CURRENT_TIMESTAMP)"
        ),
        payload,
    )
    tx_id = result.lastrowid
    
    # 3. Insert items, deduct product stocks, log inventory
    for item in items_to_create:
        # Insert item record
        db.execute(
            text(
                "INSERT INTO transaction_items (transaction_id, product_id, quantity, price) "
                "VALUES (:tx_id, :product_id, :quantity, :price)"
            ),
            {
                "tx_id": tx_id,
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "price": item["price"],
            },
        )
        
        # Deduct product stock count
        db.execute(
            text("UPDATE products SET stock = stock - :qty WHERE id = :pid"),
            {"qty": item["quantity"], "pid": item["product_id"]},
        )
        
        # Create inventory audit row (SALE is negative flow)
        db.execute(
            text(
                "INSERT INTO inventory (product_id, branch_id, quantity, transaction_type, timestamp) "
                "VALUES (:pid, :bid, :qty, 'SALE', CURRENT_TIMESTAMP)"
            ),
            {
                "pid": item["product_id"],
                "bid": payload["branch_id"],
                "qty": -item["quantity"],
            },
        )
        
    db.commit()
    return get_transaction(db, tx_id)


# ---------------- Dashboard Analytics Calculation ----------------

def compute_dashboard_stats(db: Session):
    # Detect SQLite or MySQL
    is_sqlite = db.bind.dialect.name == "sqlite"
    
    # 1. KPI Cards
    total_rev_row = db.execute(text("SELECT SUM(total_amount) as total FROM sales_transactions")).mappings().first()
    total_revenue = float(total_rev_row["total"]) if total_rev_row and total_rev_row["total"] is not None else 0.0
    
    tx_count_row = db.execute(text("SELECT COUNT(*) as total FROM sales_transactions")).mappings().first()
    total_transactions = int(tx_count_row["total"]) if tx_count_row else 0
    
    branch_count_row = db.execute(text("SELECT COUNT(*) as total FROM branches")).mappings().first()
    active_branches = int(branch_count_row["total"]) if branch_count_row else 0
    
    low_stock_row = db.execute(text("SELECT COUNT(*) as total FROM products WHERE stock < 10")).mappings().first()
    low_stock_alerts = int(low_stock_row["total"]) if low_stock_row else 0
    
    customer_count_row = db.execute(text("SELECT COUNT(*) as total FROM customers")).mappings().first()
    total_customers = int(customer_count_row["total"]) if customer_count_row else 0
    
    kpis = {
        "total_revenue": total_revenue,
        "total_transactions": total_transactions,
        "active_branches": active_branches,
        "low_stock_alerts": low_stock_alerts,
        "total_customers": total_customers,
    }
    
    # 2. Revenue Trends
    if is_sqlite:
        date_expr = "strftime('%Y-%m-%d', timestamp)"
    else:
        date_expr = "DATE_FORMAT(timestamp, '%Y-%m-%d')"
        
    trend_rows = db.execute(
        text(
            f"SELECT {date_expr} as date, SUM(total_amount) as revenue "
            "FROM sales_transactions "
            "GROUP BY date "
            "ORDER BY date"
        )
    ).mappings().all()
    
    revenue_trends = [{"date": r["date"], "revenue": float(r["revenue"])} for r in trend_rows]
    
    # Provide default values if no sales recorded yet
    if not revenue_trends:
        import datetime
        today = datetime.date.today()
        revenue_trends = [
            {"date": (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d"), "revenue": 0.0}
            for i in reversed(range(5))
        ]
        
    # 3. Product Performance
    perf_rows = db.execute(
        text(
            "SELECT p.name, SUM(ti.quantity) as units_sold, SUM(ti.quantity * ti.price) as revenue "
            "FROM transaction_items ti "
            "JOIN products p ON ti.product_id = p.id "
            "GROUP BY ti.product_id, p.name "
            "ORDER BY units_sold DESC "
            "LIMIT 5"
        )
    ).mappings().all()
    product_performance = [
        {"name": r["name"], "units_sold": int(r["units_sold"]), "revenue": float(r["revenue"])}
        for r in perf_rows
    ]
    
    # 4. Branch Comparison
    comp_rows = db.execute(
        text(
            "SELECT b.name, SUM(st.total_amount) as revenue, COUNT(st.id) as transactions "
            "FROM sales_transactions st "
            "JOIN branches b ON st.branch_id = b.id "
            "GROUP BY st.branch_id, b.name"
        )
    ).mappings().all()
    branch_comparison = [
        {"name": r["name"], "revenue": float(r["revenue"]), "transactions": int(r["transactions"])}
        for r in comp_rows
    ]
    
    # 5. Predictive Forecast Visualizer (Linear Regression Extrapolation)
    forecast = []
    # Train regression on existing daily revenue trends
    points = [r["revenue"] for r in revenue_trends]
    n = len(points)
    
    # Calculate simple slope & intercept
    if n > 1:
        x_mean = sum(range(n)) / n
        y_mean = sum(points) / n
        num = sum((i - x_mean) * (points[i] - y_mean) for i in range(n))
        den = sum((i - x_mean) ** 2 for i in range(n))
        slope = num / den if den != 0 else 0
        intercept = y_mean - slope * x_mean
    else:
        slope = 0
        intercept = points[0] if n == 1 else 0
        
    # Add actuals
    for i, pt in enumerate(revenue_trends):
        forecast.append({
            "date": pt["date"],
            "actual": pt["revenue"],
            "forecast": float(pt["revenue"]),
        })
        
    # Predict next 3 days
    import datetime
    last_date = datetime.datetime.strptime(revenue_trends[-1]["date"], "%Y-%m-%d")
    for j in range(1, 4):
        next_date = (last_date + datetime.timedelta(days=j)).strftime("%Y-%m-%d")
        predicted_value = max(0.0, slope * (n + j - 1) + intercept)
        forecast.append({
            "date": next_date,
            "actual": None,
            "forecast": round(predicted_value, 2),
        })
        
    # 6. Recent Transactions
    recent_transactions = list_transactions(db)[:5]
    
    return {
        "kpis": kpis,
        "revenue_trends": revenue_trends,
        "product_performance": product_performance,
        "branch_comparison": branch_comparison,
        "forecast": forecast,
        "recent_transactions": recent_transactions,
    }


# ---------------- User Authentication ----------------

def authenticate_user(db: Session, username: str, pass_: str):
    row = db.execute(
        text("SELECT * FROM people WHERE id = :username AND pass = :pass AND visible = 1"),
        {"username": username, "pass": pass_},
    ).mappings().first()
    return dict(row) if row else None


