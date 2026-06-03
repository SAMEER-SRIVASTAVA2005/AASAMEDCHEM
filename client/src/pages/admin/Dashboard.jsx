import { useEffect, useState } from 'react';
import { getOrderStats } from '../../api/orders';
import { getProducts } from '../../api/products';
import { getOrders } from '../../api/orders';
import { formatINR } from '../../utils/currency';
import { StatusBadge } from '../../components/Badges';
import { Package, ShoppingBag, Users, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`stats-card ${color}`}>
      <div className="stats-icon" style={{ background: `rgba(var(--clr), 0.15)` }}>
        <Icon size={20} color={`var(--color-${color === 'indigo' ? 'primary' : color === 'violet' ? 'secondary' : color === 'cyan' ? 'accent' : color === 'emerald' ? 'success' : 'warning'})`} />
      </div>
      <div className="stats-label">{label}</div>
      <div className="stats-value">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getOrderStats(),
      getProducts({ limit: 100 }),
      getOrders({ limit: 5 }),
    ]).then(([statsRes, prodsRes, ordersRes]) => {
      setStats(statsRes.data.stats);
      const prods = prodsRes.data.products;
      setLowStock(prods.filter((p) => parseFloat(p.stockQty) <= parseFloat(p.lowStockThreshold) && p.isActive));
      setRecentOrders(ordersRes.data.orders);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const totalOrders    = stats?.totalOrders ?? 0;
  const totalRevenue   = stats?.totalRevenueInr ?? 0;
  const productCount   = stats?.productCount ?? 0;
  const activeUsers    = stats?.activeUsers ?? 0;
  const pendingOrders  = stats?.ordersByStatus?.quotation?.count ?? 0;

  return (
    <div className="page-body animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Overview of your inventory and orders</p>
        </div>
        <div className="flex gap-sm items-center">
          <span className="badge badge-success">● Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 mb-lg">
        <StatsCard icon={Package}    label="Active Products"  value={productCount}             color="indigo"  />
        <StatsCard icon={ShoppingBag} label="Total Orders"    value={totalOrders}              color="violet"  />
        <StatsCard icon={TrendingUp}  label="Total Revenue"   value={formatINR(totalRevenue)}  color="emerald" />
        <StatsCard icon={Users}       label="Active Sellers"  value={activeUsers}              color="cyan"    />
      </div>

      <div className="grid-2">
        {/* Low Stock Alert */}
        <div className="card">
          <div className="flex items-center gap-sm mb-md">
            <AlertTriangle size={18} color="var(--color-warning)" />
            <span className="font-semibold">Low Stock Alerts</span>
            {lowStock.length > 0 && (
              <span className="badge badge-warning">{lowStock.length}</span>
            )}
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state">
              <p className="text-sm text-muted">All products are sufficiently stocked ✓</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {lowStock.slice(0, 6).map((p) => (
                <div key={p._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--color-border)' }}>
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted mono">{p.sku}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div className="text-sm" style={{ color:'var(--color-warning)' }}>
                      {parseFloat(p.stockQty).toLocaleString('en-IN')} {p.baseUnit}
                    </div>
                    <div className="text-xs text-muted">
                      threshold: {parseFloat(p.lowStockThreshold).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center gap-sm mb-md">
            <Clock size={18} color="var(--color-primary-h)" />
            <span className="font-semibold">Recent Orders</span>
            {pendingOrders > 0 && (
              <span className="badge badge-warning">{pendingOrders} pending</span>
            )}
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <p className="text-sm text-muted">No orders yet</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {recentOrders.map((o) => (
                <div key={o._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--color-border)' }}>
                  <div>
                    <div className="text-sm font-semibold">{o.orderNumber}</div>
                    <div className="text-xs text-muted">{o.sellerName}</div>
                  </div>
                  <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <StatusBadge status={o.status} />
                    <div className="text-xs text-muted">{formatINR(parseFloat(o.totalAmount) / 100)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders by Status */}
      {stats?.ordersByStatus && (
        <div className="card mt-lg">
          <div className="font-semibold mb-md">Orders by Status</div>
          <div style={{ display:'flex', gap: 12, flexWrap:'wrap' }}>
            {Object.entries(stats.ordersByStatus).map(([status, { count, totalPaise }]) => (
              <div key={status} className="card" style={{ flex:'1 0 160px', padding:'var(--spacing-md)' }}>
                <StatusBadge status={status} />
                <div style={{ fontSize:'1.5rem', fontWeight:800, marginTop:8 }}>{count}</div>
                <div className="text-xs text-muted">{formatINR(totalPaise / 100)} total</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
