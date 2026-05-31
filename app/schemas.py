"""Pydantic schemas — request validation and response shaping."""

from typing import Optional
from pydantic import BaseModel, EmailStr


# ---------- Products ----------

class ProductBase(BaseModel):
    name: str
    price: float
    stock: int
    branch_id: str = "branch_1"
    sync_status: str = "PENDING"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    branch_id: Optional[str] = None
    sync_status: Optional[str] = None


class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Customers ----------

class CustomerBase(BaseModel):
    name: str
    email: EmailStr


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class Customer(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Branches ----------

class BranchBase(BaseModel):
    name: str
    location: str
    sync_status: str = "SYNCED"
    last_sync_timestamp: Optional[str] = None


class BranchCreate(BranchBase):
    id: str  # e.g., 'branch_1', 'branch_2'


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    sync_status: Optional[str] = None
    last_sync_timestamp: Optional[str] = None


class Branch(BranchBase):
    id: str

    class Config:
        from_attributes = True


# ---------- Transaction Items ----------

class TransactionItemBase(BaseModel):
    product_id: int
    quantity: int
    price: float


class TransactionItemCreate(TransactionItemBase):
    pass


class TransactionItem(TransactionItemBase):
    id: int
    transaction_id: int

    class Config:
        from_attributes = True


# ---------- Sales Transactions ----------

class TransactionBase(BaseModel):
    customer_id: Optional[int] = None
    branch_id: str = "branch_1"
    total_amount: float
    sync_status: str = "PENDING"
    timestamp: Optional[str] = None


class TransactionCreate(TransactionBase):
    items: list[TransactionItemCreate]


class Transaction(TransactionBase):
    id: int
    transaction_number: str
    items: list[TransactionItem] = []

    class Config:
        from_attributes = True


# ---------- Inventory Logs ----------

class InventoryBase(BaseModel):
    product_id: int
    branch_id: str
    quantity: int
    transaction_type: str  # 'STOCK_IN', 'SALE', 'ADJUSTMENT'
    timestamp: Optional[str] = None


class InventoryCreate(InventoryBase):
    pass


class Inventory(InventoryBase):
    id: int
    product_name: Optional[str] = None  # Helper for listing

    class Config:
        from_attributes = True


# ---------- Dashboard & Analytics Stats ----------

class KPICards(BaseModel):
    total_revenue: float
    total_transactions: int
    active_branches: int
    low_stock_alerts: int
    total_customers: int


class RevenueTrendPoint(BaseModel):
    date: str
    revenue: float


class ProductPerformancePoint(BaseModel):
    name: str
    units_sold: int
    revenue: float


class BranchComparisonPoint(BaseModel):
    name: str
    revenue: float
    transactions: int


class ForecastPoint(BaseModel):
    date: str
    actual: Optional[float] = None
    forecast: float


class DashboardStats(BaseModel):
    kpis: KPICards
    revenue_trends: list[RevenueTrendPoint]
    product_performance: list[ProductPerformancePoint]
    branch_comparison: list[BranchComparisonPoint]
    forecast: list[ForecastPoint]
    recent_transactions: list[Transaction]


# ---------- User Authentication ----------

class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    role: str
    branch_id: str
    token: str


