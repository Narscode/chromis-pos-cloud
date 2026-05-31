import React, { useState } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { Coffee, Plus, Search, Edit3, Trash2, GitBranch, X, Check, Loader } from 'lucide-react';

interface ProductsProps {
  products: Product[];
  refreshAll: () => Promise<void>;
}

export const Products: React.FC<ProductsProps> = ({ products, refreshAll }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [branchId, setBranchId] = useState('branch_1');
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setPrice(0);
    setStock(0);
    setBranchId('branch_1');
    setFormError(null);
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price);
    setStock(p.stock);
    setBranchId(p.branch_id);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0 || stock < 0) {
      setFormError('Please fill out all fields with valid numbers.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      name,
      price: Number(price),
      stock: Number(stock),
      branch_id: branchId,
      sync_status: 'SYNCED' as const, // For central uploads
    };

    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
      } else {
        await api.products.create(payload);
      }
      await refreshAll();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product to RDS.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you absolutely sure you want to delete this product? This action is irreversible.')) return;
    
    try {
      await api.products.delete(id);
      await refreshAll();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = branchFilter === 'ALL' || p.branch_id === branchFilter;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="glass-card fade-in-up" style={{ minHeight: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      {/* Table Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '15px', flex: 1, minWidth: '280px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search products..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%' }}
            />
          </div>

          {/* Branch filter */}
          <select
            className="form-control"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="ALL">All Branches</option>
            <option value="branch_1">Downtown HQ</option>
            <option value="branch_2">Uptown Premium</option>
            <option value="branch_3">East Coast Mall</option>
          </select>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          Register Product
        </button>
      </div>

      {/* Main Table view */}
      <div className="table-container" style={{ flex: 1 }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Branch</th>
              <th>Unit Price</th>
              <th>Stock level</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock < 10;
                return (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{p.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                        <GitBranch size={12} color="var(--primary)" />
                        {p.branch_id === 'branch_1' ? 'Downtown HQ' : p.branch_id === 'branch_2' ? 'Uptown Premium' : 'East Coast Mall'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>Rp {p.price.toLocaleString('id-ID')}</td>
                    <td>
                      <span style={{ 
                        fontWeight: 700,
                        color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--text-primary)' 
                      }}>
                        {p.stock} units
                      </span>
                    </td>
                    <td>
                      <span className="badge-status synced">Synced</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Details"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="btn btn-danger btn-sm"
                          title="Delete Product"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  <Coffee size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                  <p>No products registered.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Create/Edit Modal Dialogue */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="glass-card fade-in-up" style={{ width: '450px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingProduct ? 'Modify Product Details' : 'Register New Product'}
              </h3>
              <button 
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="glass-card" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'var(--danger)', color: '#f87171', padding: '12px', marginBottom: '20px', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Matcha Latte Shakerato"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Price (IDR)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    className="form-control"
                    value={price === 0 ? '' : price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input
                    type="number"
                    placeholder="50"
                    className="form-control"
                    value={stock === 0 ? '' : stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Target Branch Terminal</label>
                <select
                  className="form-control"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  <option value="branch_1">Downtown HQ</option>
                  <option value="branch_2">Uptown Premium Store</option>
                  <option value="branch_3">East Coast Mall Terminal</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {submitting ? (
                    <>
                      <Loader size={14} className="animate-spin-custom" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      {editingProduct ? 'Save Changes' : 'Register Item'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
