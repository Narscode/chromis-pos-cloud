"""
Database Initializer.
Dynamically detects SQLite vs MySQL/RDS and provisions schemas + seed data securely.
"""
import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to path to import app modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./cloud_pos.db",  # Fallback to local SQLite for validation
)

print(f"Initializing database: {DATABASE_URL}")

# Check engine dialect
is_sqlite = "sqlite" in DATABASE_URL

engine = create_engine(DATABASE_URL)

# Table creation queries
queries = []

if is_sqlite:
    # 1. Branches Table
    queries.append("""
    CREATE TABLE IF NOT EXISTS branches (
        id                  VARCHAR(50) PRIMARY KEY,
        name                VARCHAR(255) NOT NULL,
        location            VARCHAR(255) NOT NULL,
        sync_status         VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
        last_sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 2. Products Table
    queries.append("""
    CREATE TABLE IF NOT EXISTS products (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        VARCHAR(255)   NOT NULL,
        price       DECIMAL(12, 2) NOT NULL,
        stock       INT            NOT NULL DEFAULT 0,
        branch_id   VARCHAR(50)    NOT NULL DEFAULT 'branch_1',
        sync_status VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    )
    """)
    
    # 3. Customers Table
    queries.append("""
    CREATE TABLE IF NOT EXISTS customers (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        name  VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
    )
    """)
    
    # 4. Sales Transactions Table
    queries.append("""
    CREATE TABLE IF NOT EXISTS sales_transactions (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_number VARCHAR(100)   NOT NULL UNIQUE,
        customer_id        INT            NULL,
        branch_id          VARCHAR(50)    NOT NULL,
        total_amount       DECIMAL(12, 2) NOT NULL,
        sync_status        VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
        timestamp          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    )
    """)
    
    # 5. Transaction Items Table
    queries.append("""
    CREATE TABLE IF NOT EXISTS transaction_items (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INT            NOT NULL,
        product_id     INT            NOT NULL,
        quantity       INT            NOT NULL,
        price          DECIMAL(12, 2) NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES sales_transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
    """)
    
    # 6. Inventory Logs Table
    queries.append("""
    CREATE TABLE IF NOT EXISTS inventory (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id       INT          NOT NULL,
        branch_id        VARCHAR(50)  NOT NULL,
        quantity         INT          NOT NULL,
        transaction_type VARCHAR(20)  NOT NULL,
        timestamp        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    )
    """)

    # SQLite Seeding
    queries.append("INSERT OR IGNORE INTO branches (id, name, location, sync_status) VALUES ('branch_1', 'Downtown Headquarters', 'Malioboro St, Yogyakarta', 'SYNCED')")
    queries.append("INSERT OR IGNORE INTO branches (id, name, location, sync_status) VALUES ('branch_2', 'Uptown Premium Store', 'Sleman City Mall, Yogyakarta', 'SYNCED')")
    queries.append("INSERT OR IGNORE INTO branches (id, name, location, sync_status) VALUES ('branch_3', 'East Coast Mall Terminal', 'Gedongkuning, Yogyakarta', 'SYNCED')")

    # Insert products
    queries.append("INSERT OR IGNORE INTO products (id, name, price, stock, branch_id, sync_status) VALUES (1, 'Espresso Gold', 25000.00, 48, 'branch_1', 'SYNCED')")
    queries.append("INSERT OR IGNORE INTO products (id, name, price, stock, branch_id, sync_status) VALUES (2, 'Hokkaido Milk Tea', 22000.00, 34, 'branch_1', 'SYNCED')")
    queries.append("INSERT OR IGNORE INTO products (id, name, price, stock, branch_id, sync_status) VALUES (3, 'Caramel Macchiato', 32000.00, 5, 'branch_1', 'SYNCED')")
    queries.append("INSERT OR IGNORE INTO products (id, name, price, stock, branch_id, sync_status) VALUES (4, 'Matcha Ceremonial', 28000.00, 55, 'branch_2', 'SYNCED')")
    queries.append("INSERT OR IGNORE INTO products (id, name, price, stock, branch_id, sync_status) VALUES (5, 'Java Vanilla Shakerato', 30000.00, 8, 'branch_2', 'SYNCED')")

    # Insert customers
    queries.append("INSERT OR IGNORE INTO customers (id, name, email) VALUES (1, 'John Doe', 'john.doe@gmail.com')")
    queries.append("INSERT OR IGNORE INTO customers (id, name, email) VALUES (2, 'Jane Smith', 'jane.smith@outlook.com')")
    queries.append("INSERT OR IGNORE INTO customers (id, name, email) VALUES (3, 'Budi Santoso', 'budi.s@ugm.ac.id')")

    # Insert sales transactions
    queries.append("INSERT OR IGNORE INTO sales_transactions (id, transaction_number, customer_id, branch_id, total_amount, sync_status, timestamp) VALUES (1, 'TX-20260527-0941', 1, 'branch_1', 72000.00, 'SYNCED', '2026-05-27 10:14:00')")
    queries.append("INSERT OR IGNORE INTO sales_transactions (id, transaction_number, customer_id, branch_id, total_amount, sync_status, timestamp) VALUES (2, 'TX-20260528-1120', 2, 'branch_1', 47000.00, 'SYNCED', '2026-05-28 14:22:00')")
    queries.append("INSERT OR IGNORE INTO sales_transactions (id, transaction_number, customer_id, branch_id, total_amount, sync_status, timestamp) VALUES (3, 'TX-20260529-1502', 3, 'branch_2', 56000.00, 'SYNCED', '2026-05-29 16:05:00')")
    queries.append("INSERT OR IGNORE INTO sales_transactions (id, transaction_number, customer_id, branch_id, total_amount, sync_status, timestamp) VALUES (4, 'TX-20260530-0833', 1, 'branch_2', 116000.00, 'SYNCED', '2026-05-30 09:30:00')")
    queries.append("INSERT OR IGNORE INTO sales_transactions (id, transaction_number, customer_id, branch_id, total_amount, sync_status, timestamp) VALUES (5, 'TX-20260531-1901', 2, 'branch_1', 50000.00, 'SYNCED', '2026-05-31 20:01:00')")

    # Insert items
    queries.append("INSERT OR IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (1, 1, 1, 2, 25000.00)")
    queries.append("INSERT OR IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (2, 1, 2, 1, 22000.00)")
    queries.append("INSERT OR IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (3, 2, 1, 1, 25000.00)")
    queries.append("INSERT OR IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (4, 2, 2, 1, 22000.00)")
    queries.append("INSERT OR IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (5, 3, 4, 2, 28000.00)")
    queries.append("INSERT OR IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (6, 4, 4, 3, 28000.00)")
    queries.append("INSERT OR IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (7, 4, 5, 1, 32000.00)")
    queries.append("INSERT OR IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (8, 5, 1, 2, 25000.00)")

    # Insert inventory logs
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (1, 1, 'branch_1', 50, 'STOCK_IN', '2026-05-26 08:00:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (2, 2, 'branch_1', 35, 'STOCK_IN', '2026-05-26 08:00:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (3, 3, 'branch_1', 10, 'STOCK_IN', '2026-05-26 08:00:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (4, 4, 'branch_2', 60, 'STOCK_IN', '2026-05-26 08:00:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (5, 5, 'branch_2', 10, 'STOCK_IN', '2026-05-26 08:00:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (6, 1, 'branch_1', -2, 'SALE', '2026-05-27 10:14:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (7, 2, 'branch_1', -1, 'SALE', '2026-05-27 10:14:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (8, 1, 'branch_1', -1, 'SALE', '2026-05-28 14:22:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (9, 2, 'branch_1', -1, 'SALE', '2026-05-28 14:22:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (10, 4, 'branch_2', -2, 'SALE', '2026-05-29 16:05:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (11, 4, 'branch_2', -3, 'SALE', '2026-05-30 09:30:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (12, 5, 'branch_2', -1, 'SALE', '2026-05-30 09:30:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (13, 1, 'branch_1', -2, 'SALE', '2026-05-31 20:01:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (14, 3, 'branch_1', -5, 'ADJUSTMENT', '2026-05-31 21:00:00')")
    queries.append("INSERT OR IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (15, 5, 'branch_2', -1, 'ADJUSTMENT', '2026-05-31 21:00:00')")

else:
    # MySQL Seeding
    queries.append("CREATE TABLE IF NOT EXISTS branches (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, location VARCHAR(255) NOT NULL, sync_status VARCHAR(20) NOT NULL DEFAULT 'SYNCED', last_sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)")
    queries.append("CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, price DECIMAL(12, 2) NOT NULL, stock INT NOT NULL DEFAULT 0, branch_id VARCHAR(50) NOT NULL DEFAULT 'branch_1', sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE)")
    queries.append("CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL)")
    queries.append("CREATE TABLE IF NOT EXISTS sales_transactions (id INT AUTO_INCREMENT PRIMARY KEY, transaction_number VARCHAR(100) NOT NULL UNIQUE, customer_id INT NULL, branch_id VARCHAR(50) NOT NULL, total_amount DECIMAL(12, 2) NOT NULL, sync_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL, FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE)")
    queries.append("CREATE TABLE IF NOT EXISTS transaction_items (id INT AUTO_INCREMENT PRIMARY KEY, transaction_id INT NOT NULL, product_id INT NOT NULL, quantity INT NOT NULL, price DECIMAL(12, 2) NOT NULL, FOREIGN KEY (transaction_id) REFERENCES sales_transactions(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)")
    queries.append("CREATE TABLE IF NOT EXISTS inventory (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, branch_id VARCHAR(50) NOT NULL, quantity INT NOT NULL, transaction_type VARCHAR(20) NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE)")

    # Seeding MySQL
    queries.append("INSERT IGNORE INTO branches (id, name, location, sync_status) VALUES ('branch_1', 'Downtown Headquarters', 'Malioboro St, Yogyakarta', 'SYNCED'), ('branch_2', 'Uptown Premium Store', 'Sleman City Mall, Yogyakarta', 'SYNCED'), ('branch_3', 'East Coast Mall Terminal', 'Gedongkuning, Yogyakarta', 'SYNCED')")
    queries.append("INSERT IGNORE INTO products (id, name, price, stock, branch_id, sync_status) VALUES (1, 'Espresso Gold', 25000.00, 48, 'branch_1', 'SYNCED'), (2, 'Hokkaido Milk Tea', 22000.00, 34, 'branch_1', 'SYNCED'), (3, 'Caramel Macchiato', 32000.00, 5, 'branch_1', 'SYNCED'), (4, 'Matcha Ceremonial', 28000.00, 55, 'branch_2', 'SYNCED'), (5, 'Java Vanilla Shakerato', 30000.00, 8, 'branch_2', 'SYNCED')")
    queries.append("INSERT IGNORE INTO customers (id, name, email) VALUES (1, 'John Doe', 'john.doe@gmail.com'), (2, 'Jane Smith', 'jane.smith@outlook.com'), (3, 'Budi Santoso', 'budi.s@ugm.ac.id')")
    queries.append("INSERT IGNORE INTO sales_transactions (id, transaction_number, customer_id, branch_id, total_amount, sync_status, timestamp) VALUES (1, 'TX-20260527-0941', 1, 'branch_1', 72000.00, 'SYNCED', '2026-05-27 10:14:00'), (2, 'TX-20260528-1120', 2, 'branch_1', 47000.00, 'SYNCED', '2026-05-28 14:22:00'), (3, 'TX-20260529-1502', 3, 'branch_2', 56000.00, 'SYNCED', '2026-05-29 16:05:00'), (4, 'TX-20260530-0833', 1, 'branch_2', 116000.00, 'SYNCED', '2026-05-30 09:30:00'), (5, 'TX-20260531-1901', 2, 'branch_1', 50000.00, 'SYNCED', '2026-05-31 20:01:00')")
    queries.append("INSERT IGNORE INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (1, 1, 1, 2, 25000.00), (2, 1, 2, 1, 22000.00), (3, 2, 1, 1, 25000.00), (4, 2, 2, 1, 22000.00), (5, 3, 4, 2, 28000.00), (6, 4, 4, 3, 28000.00), (7, 4, 5, 1, 32000.00), (8, 5, 1, 2, 25000.00)")
    queries.append("INSERT IGNORE INTO inventory (id, product_id, branch_id, quantity, transaction_type, timestamp) VALUES (1, 1, 'branch_1', 50, 'STOCK_IN', '2026-05-26 08:00:00'), (2, 2, 'branch_1', 35, 'STOCK_IN', '2026-05-26 08:00:00'), (3, 3, 'branch_1', 10, 'STOCK_IN', '2026-05-26 08:00:00'), (4, 4, 'branch_2', 60, 'STOCK_IN', '2026-05-26 08:00:00'), (5, 5, 'branch_2', 10, 'STOCK_IN', '2026-05-26 08:00:00'), (6, 1, 'branch_1', -2, 'SALE', '2026-05-27 10:14:00'), (7, 2, 'branch_1', -1, 'SALE', '2026-05-27 10:14:00'), (8, 1, 'branch_1', -1, 'SALE', '2026-05-28 14:22:00'), (9, 2, 'branch_1', -1, 'SALE', '2026-05-28 14:22:00'), (10, 4, 'branch_2', -2, 'SALE', '2026-05-29 16:05:00'), (11, 4, 'branch_2', -3, 'SALE', '2026-05-30 09:30:00'), (12, 5, 'branch_2', -1, 'SALE', '2026-05-30 09:30:00'), (13, 1, 'branch_1', -2, 'SALE', '2026-05-31 20:01:00'), (14, 3, 'branch_1', -5, 'ADJUSTMENT', '2026-05-31 21:00:00'), (15, 5, 'branch_2', -1, 'ADJUSTMENT', '2026-05-31 21:00:00')")

# Execute queries
with engine.connect() as conn:
    for q in queries:
        try:
            conn.execute(text(q))
            print(f"[SUCCESS] Executed query: {q[:50]}...")
        except Exception as e:
            print(f"[ERROR] Query failed: {q[:50]}... Detail: {e}")
    conn.commit()

print("Database initialized successfully!")
