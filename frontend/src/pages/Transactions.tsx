import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Product, Customer, TransactionItem } from '../types';
import { ShoppingCart, User, Plus, Minus, Trash2, Check, CreditCard, ShoppingBag, Loader } from 'lucide-react';

interface TransactionsProps {
  products: Product[];
  customers: Customer[];
  isOnline: boolean;
  currentBranchId: string;
  refreshAll: () => Promise<void>;
}

export const Transactions: React.FC<TransactionsProps> = ({
  products,
  customers,
  isOnline,
  currentBranchId,
  refreshAll,
}) => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(currentBranchId);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset checkout status after some time
  useEffect(() => {
    if (checkoutSuccess) {
      const timer = setTimeout(() => setCheckoutSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [checkoutSuccess]);

  // Filter products matching search and branch selection
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    p.branch_id === selectedBranchId
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Limit to available stock
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      const item = prev.find(item => item.product.id === productId);
      if (!item) return prev;
      
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter(item => item.product.id !== productId);
      }
      if (newQty > item.product.stock) return prev; // Stock limit
      
      return prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQty }
          : item
      );
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.11; // Standard 11% PPN tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0 || submitting) return;

    setSubmitting(true);
    setCheckoutError(null);
    setCheckoutSuccess(null);

    const txPayload = {
      customer_id: selectedCustomerId === '' ? undefined : Number(selectedCustomerId),
      branch_id: selectedBranchId,
      total_amount: total,
      sync_status: 'PENDING' as const,
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
    };

    try {
      const result = await api.transactions.create(txPayload);
      setCheckoutSuccess(result.transaction_number);
      setCart([]);
      setSelectedCustomerId('');
      await refreshAll();
    } catch (err: any) {
      setCheckoutError(err.message || 'Failed to process retail transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px', height: 'calc(100vh - 150px)' }}>
      {/* Menu / Catalog view */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '10px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Search bar */}
          <input
            type="text"
            placeholder="Search menu products..."
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />

          {/* Branch filter */}
          <select
            className="form-control"
            value={selectedBranchId}
            onChange={(e) => {
              setSelectedBranchId(e.target.value);
              setCart([]); // Clear cart when switching branches
            }}
            style={{ width: '220px' }}
          >
            <option value="branch_1">Downtown HQ</option>
            <option value="branch_2">Uptown Premium Store</option>
            <option value="branch_3">East Coast Mall Terminal</option>
          </select>
        </div>

        {/* Notifications and Alerts */}
        {checkoutSuccess && (
          <div className="glass-card" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--secondary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color="#fff" />
            </div>
            <div>
              <strong style={{ color: 'var(--secondary)' }}>Sale Completed Successfully!</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Invoice No: {checkoutSuccess}. Central stock updated.</p>
            </div>
          </div>
        )}

        {checkoutError && (
          <div className="glass-card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'var(--danger)', color: '#f87171' }}>
            <strong>Checkout Failed</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>{checkoutError}</p>
          </div>
        )}

        {/* Catalog grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '20px',
        }}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => {
              const inCart = cart.find(item => item.product.id === p.id);
              const qtyInCart = inCart?.quantity || 0;
              const isLowStock = p.stock < 10;
              const isOutOfStock = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="glass-card"
                  style={{
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    opacity: isOutOfStock ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '15px',
                    borderColor: qtyInCart > 0 ? 'var(--primary)' : 'var(--card-border)',
                    boxShadow: qtyInCart > 0 ? '0 0 10px var(--primary-glow)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      background: isOutOfStock ? 'rgba(239,68,68,0.15)' : isLowStock ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--secondary)',
                      fontWeight: 600,
                    }}>
                      {isOutOfStock ? 'OUT OF STOCK' : `${p.stock} AVAILABLE`}
                    </span>
                    {qtyInCart > 0 && (
                      <span style={{
                        background: 'var(--primary)',
                        color: 'var(--bg-primary)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        {qtyInCart}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#f1f5f9' }}>{p.name}</h4>
                    <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                      Rp {p.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
              <p>No products available for this branch terminal.</p>
            </div>
          )}
        </div>
      </div>

      {/* Shopping Basket Sidebar */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
          <ShoppingCart size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Shopping Basket</h3>
        </div>

        {/* Customer Selector */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} />
            Assign Customer (Loyalty points)
          </label>
          <select
            className="form-control"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Walk-in Customer (General)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>

        {/* Selected Items feed */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.product.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--card-border)',
                }}
              >
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>{item.product.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Rp {item.product.price.toLocaleString('id-ID')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, width: '24px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '6px', padding: '2px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <ShoppingCart size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>Cart is empty.</p>
            </div>
          )}
        </div>

        {/* Pricing Subtotal details */}
        <div style={{
          borderTop: '1px solid var(--card-border)',
          paddingTop: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal:</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>PPN Tax (11%):</span>
            <span>Rp {tax.toLocaleString('id-ID')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
            <span>Total amount:</span>
            <span style={{ color: 'var(--primary)' }}>Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || submitting}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          {submitting ? (
            <>
              <Loader size={16} className="animate-spin-custom" />
              Processing central DB transaction...
            </>
          ) : (
            <>
              <CreditCard size={16} />
              Complete Sale & Checkout
            </>
          )}
        </button>
      </div>
    </div>
  );
};
