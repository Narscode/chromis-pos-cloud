import React, { useState } from 'react';
import { api } from '../services/api';
import { Customer } from '../types';
import { Users, Plus, Search, Edit3, Trash2, X, Check, Loader } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  refreshAll: () => Promise<void>;
}

export const Customers: React.FC<CustomersProps> = ({ customers, refreshAll }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setEmail(c.email);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Please fill out all fields.');
      return;
    }

    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = { name, email };

    try {
      if (editingCustomer) {
        await api.customers.update(editingCustomer.id, payload);
      } else {
        await api.customers.create(payload);
      }
      await refreshAll();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer to RDS.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) return;
    
    try {
      await api.customers.delete(id);
      await refreshAll();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-card fade-in-up" style={{ minHeight: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      {/* Search and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Customer Table */}
      <div className="table-container" style={{ flex: 1 }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Email Address</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{c.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td>{c.email}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Info"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete Record"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  <Users size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                  <p>No customers registered.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal Dialogue */}
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
          <div className="glass-card fade-in-up" style={{ width: '400px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
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
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="john.doe@example.com"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
                      {editingCustomer ? 'Save Changes' : 'Add Account'}
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
