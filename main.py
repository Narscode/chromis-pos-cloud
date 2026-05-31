from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from sqlalchemy import create_engine, text

app = FastAPI()

DATABASE_URL = "mysql+pymysql://root@localhost/cloud_pos"

engine = create_engine(DATABASE_URL)

@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cloud POS Dashboard</title>

        <style>

            body{
                margin:0;
                font-family: Arial, Helvetica, sans-serif;
                background:#0f172a;
                color:white;
            }

            .navbar{
                background:#111827;
                padding:20px 40px;
                display:flex;
                justify-content:space-between;
                align-items:center;
                border-bottom:1px solid #1f2937;
            }

            .navbar h1{
                margin:0;
                font-size:24px;
                color:#38bdf8;
            }

            .status{
                background:#16a34a;
                padding:8px 14px;
                border-radius:20px;
                font-size:14px;
            }

            .container{
                max-width:1200px;
                margin:auto;
                padding:40px;
            }

            .hero{
                margin-bottom:40px;
            }

            .hero h2{
                font-size:42px;
                margin-bottom:10px;
            }

            .hero p{
                color:#94a3b8;
                font-size:18px;
            }

            .grid{
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
                gap:20px;
            }

            .card{
                background:#1e293b;
                padding:25px;
                border-radius:16px;
                box-shadow:0px 4px 12px rgba(0,0,0,0.3);
            }

            .card h3{
                margin-top:0;
                color:#38bdf8;
            }

            .endpoint{
                margin-top:10px;
                background:#0f172a;
                padding:10px;
                border-radius:10px;
                font-family:monospace;
                color:#4ade80;
            }

            .footer{
                margin-top:50px;
                text-align:center;
                color:#64748b;
                font-size:14px;
            }

            a{
                color:#38bdf8;
                text-decoration:none;
            }

        </style>
    </head>

    <body>

        <div class="navbar">
            <h1>Cloud POS System</h1>
            <div class="status">API ONLINE</div>
        </div>

        <div class="container">

            <div class="hero">
                <h2>Smart Retail Cloud Dashboard</h2>
                <p>
                    Cloud Computing Final Project — Universitas Gadjah Mada
                </p>
            </div>

            <div class="grid">

                <div class="card">
                    <h3>Backend Status</h3>
                    <p>
                        FastAPI backend server currently running locally.
                    </p>
                </div>

                <div class="card">
                    <h3>Database</h3>
                    <p>
                        MySQL integration currently in development.
                    </p>
                </div>

                <div class="card">
                    <h3>Implemented Features</h3>
                    <ul>
                        <li>REST API</li>
                        <li>Swagger Docs</li>
                        <li>Products Endpoint</li>
                        <li>Customers Endpoint</li>
                    </ul>
                </div>

                <div class="card">
                    <h3>Available Endpoints</h3>

                    <div class="endpoint">
                        GET /products
                    </div>

                    <div class="endpoint">
                        GET /customers
                    </div>

                    <div class="endpoint">
                        <a href="/docs">Swagger Documentation</a>
                    </div>

                </div>

            </div>

            <div class="footer">
                Developed for Cloud Computing Course Project 2026
            </div>

        </div>

    </body>
    </html>
    """


@app.get("/customers")
def get_customers():
    return [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
        }
    ]

@app.get("/products")
def get_products():

    with engine.connect() as conn:

        result = conn.execute(
            text("SELECT * FROM products")
        )

        products = []

        for row in result:
            products.append(dict(row._mapping))

        return products