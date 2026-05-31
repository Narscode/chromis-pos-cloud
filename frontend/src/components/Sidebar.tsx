import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Coffee, 
  Users, 
  Warehouse, 
  GitBranch, 
  TrendingUp 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Terminal', icon: ShoppingBag },
    { id: 'products', label: 'Products', icon: Coffee },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory Logs', icon: Warehouse },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

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
      }}>
        {menuItems.map((item) => {
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

      {/* Footer Info */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          Cloud Course Project
        </div>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#e2e8f0',
        }}>
          Universitas Gadjah Mada
        </div>
      </div>
    </aside>
  );
};
