import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, ClipboardList,
  Users, LogOut, FlaskConical, BookOpen
} from 'lucide-react';

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products',  icon: Package,          label: 'Products' },
  { to: '/admin/orders',    icon: ClipboardList,    label: 'Orders' },
  { to: '/admin/users',     icon: Users,            label: 'Users' },
];

const sellerLinks = [
  { to: '/seller/catalog', icon: FlaskConical,  label: 'Catalog' },
  { to: '/seller/cart',    icon: ShoppingCart,  label: 'My Cart' },
  { to: '/seller/orders',  icon: BookOpen,      label: 'My Orders' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : sellerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚗️</div>
          <div>
            <div className="sidebar-logo-text">AasaMedChem</div>
            <div className="sidebar-logo-sub">Inventory System</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">
          {isAdmin ? 'Admin Panel' : 'Seller Panel'}
        </div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
