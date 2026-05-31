import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Coffee, 
  Users, 
  Warehouse, 
  GitBranch, 
  TrendingUp,
  LogOut,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
  userName: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  role, 
  userName, 
  onLogout 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['role_admin', 'role_manager', 'role_cashier'] },
    { id: 'pos', label: 'POS Terminal', icon: ShoppingBag, roles: ['role_admin', 'role_manager', 'role_cashier'] },
    { id: 'products', label: 'Products', icon: Coffee, roles: ['role_admin', 'role_manager'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['role_admin', 'role_manager', 'role_cashier'] },
    { id: 'inventory', label: 'Inventory Logs', icon: Warehouse, roles: ['role_admin', 'role_manager'] },
    { id: 'branches', label: 'Branches', icon: GitBranch, roles: ['role_admin'] },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, roles: ['role_admin', 'role_manager'] },
  ];

  // Filter menu items matching the user's role
  const authorizedItems = menuItems.filter(item => item.roles.includes(role));

  const getRoleLabel = (r: string) => {
    if (r === 'role_admin') return 'System Admin';
    if (r === 'role_manager') return 'Store Manager';
    return 'Sales Cashier';
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--card-border)',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.5px',
        }}>
          SMART RETAIL POS
        </h2>
        <span style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}>
          Cloud Platform v1.0
        </span>
      </div>

      {/* Nav Menu Items */}
      <nav style={{
        flex: 1,
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        overflowY: 'auto',
      }}>
        {authorizedItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '0.925rem',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                position: 'relative',
                outline: 'none',
              }}
              className={isActive ? 'sidebar-active-glow' : ''}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  height: '70%',
                  width: '3px',
                  background: 'var(--primary)',
                  borderRadius: '0 4px 4px 0',
                  boxShadow: '0 0 10px var(--primary)',
                }} />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Staff Profile and Logout Button */}
      <div style={{
        padding: '15px',
        background: 'rgba(15, 23, 42, 0.4)',
        borderTop: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--primary-glow)',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UserCheck size={16} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {getRoleLabel(role)}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', gap: '6px', padding: '6px', fontSize: '0.8rem' }}
        >
          <LogOut size={12} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '12px 20px',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
        textAlign: 'center',
      }}>
        UGM Cloud Computing 2026
      </div>
    </aside>
  );
};
