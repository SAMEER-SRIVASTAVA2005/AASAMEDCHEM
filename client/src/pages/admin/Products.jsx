import { useEffect, useState, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../../api/products';
import { formatINR } from '../../utils/currency';
import { ALL_UNITS, getCompatibleUnits } from '../../utils/units';
import { UnitBadge } from '../../components/Badges';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Package, ToggleLeft, ToggleRight } from 'lucide-react';

const EMPTY_FORM = {
  name:'', sku:'', description:'', category:'',
  baseUnit:'g', basePricePerUnit:'', stockQty:'0', lowStockThreshold:'0', isActive: true,
};

export default function AdminProducts() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [modal,      setModal]      = useState({ open: false, mode: 'create', product: null });
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search)    params.search = search;
      if (catFilter) params.category = catFilter;
      const { data } = await getProducts(params);
      setProducts(data.products);
      setTotal(data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { getCategories().then(({ data }) => setCategories(data.categories)); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'create', product: null }); };
  const openEdit   = (p) => {
    setForm({
      name: p.name, sku: p.sku, description: p.description || '',
      category: p.category || '', baseUnit: p.baseUnit,
      basePricePerUnit: (parseFloat(p.basePricePerUnit) / 100).toString(),
      stockQty: parseFloat(p.stockQty).toString(),
      lowStockThreshold: parseFloat(p.lowStockThreshold).toString(),
      isActive: p.isActive,
    });
    setModal({ open: true, mode: 'edit', product: p });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await createProduct(form);
        toast.success('Product created');
      } else {
        await updateProduct(modal.product._id, form);
        toast.success('Product updated');
      }
      setModal({ open: false });
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deactivated');
      fetchProducts();
    } catch { toast.error('Failed to deactivate'); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const priceInINR = parseFloat(form.basePricePerUnit) || 0;

  return (
    <div className="page-body animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-description">{total} products in inventory</p>
        </div>
        <button id="create-product-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="filter-row mb-lg">
        <div className="search-bar" style={{ flex:1, maxWidth:360 }}>
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search by name, SKU, category…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="form-select" style={{ width:180 }} value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Base Unit</th>
              <th>Price / Base Unit</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No products found</td></tr>
            ) : products.map((p) => {
              const pricePaise = parseFloat(p.basePricePerUnit);
              const priceInr   = pricePaise / 100;
              const stock      = parseFloat(p.stockQty);
              const threshold  = parseFloat(p.lowStockThreshold);
              const stockStatus = stock <= threshold ? (stock === 0 ? 'critical' : 'low') : 'good';
              return (
                <tr key={p._id}>
                  <td>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted">{p.description?.slice(0, 60)}{p.description?.length > 60 ? '…' : ''}</div>
                  </td>
                  <td><span className="mono text-xs">{p.sku}</span></td>
                  <td><span className="text-sm text-muted">{p.category || '—'}</span></td>
                  <td><UnitBadge unit={p.baseUnit} /></td>
                  <td>
                    <div className="font-semibold" style={{ color:'var(--color-primary-h)' }}>
                      {formatINR(priceInr)}
                    </div>
                    <div className="text-xs text-muted">per {p.baseUnit}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`stock-dot ${stockStatus}`} />
                      <span className="text-sm">
                        {stock.toLocaleString('en-IN')} {p.baseUnit}
                      </span>
                    </div>
                  </td>
                  <td>
                    {p.isActive
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-muted">Inactive</span>
                    }
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button id={`edit-${p._id}`} className="btn btn-ghost btn-icon" onClick={() => openEdit(p)} title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button id={`delete-${p._id}`} className="btn btn-ghost btn-icon" onClick={() => handleDelete(p._id)} title="Deactivate"
                        style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-end gap-sm mt-md">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-sm text-muted" style={{ alignSelf:'center' }}>Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Product Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })}
        title={modal.mode === 'create' ? 'Add New Product' : 'Edit Product'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-input" required value={form.name} onChange={set('name')} placeholder="e.g. Sodium Chloride" />
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input className="form-input" required value={form.sku} onChange={set('sku')}
                  placeholder="e.g. NaCl-001"
                  disabled={modal.mode === 'edit'} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" list="categories-list" value={form.category} onChange={set('category')} placeholder="e.g. Inorganic Salts" />
                <datalist id="categories-list">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label className="form-label">Base Unit *</label>
                <select className="form-select" value={form.baseUnit} onChange={set('baseUnit')} disabled={modal.mode === 'edit'} required>
                  {ALL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price per {form.baseUnit} (₹ INR) *</label>
                <div className="input-group">
                  <span className="input-addon">₹</span>
                  <input className="form-input" type="number" step="0.000001" min="0" required
                    value={form.basePricePerUnit} onChange={set('basePricePerUnit')}
                    placeholder="0.00" />
                </div>
                {priceInINR > 0 && (
                  <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                    {getCompatibleUnits(form.baseUnit).map((u) => {
                      const factor = u === 'kg' || u === 'L' ? 1000 : 1;
                      return (
                        <span key={u} style={{ marginRight: 12 }}>
                          ₹{(priceInINR * factor).toLocaleString('en-IN', { maximumFractionDigits: 4 })}/{u}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Stock ({form.baseUnit})</label>
                <input className="form-input" type="number" step="0.000001" min="0"
                  value={form.stockQty} onChange={set('stockQty')} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Low Stock Threshold ({form.baseUnit})</label>
                <input className="form-input" type="number" step="0.000001" min="0"
                  value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
              </div>
              <div className="form-group" style={{ justifyContent:'flex-end' }}>
                <label className="form-label">Active</label>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', paddingTop:8 }}>
                  <input type="checkbox" checked={form.isActive} onChange={set('isActive')} style={{ width:16, height:16 }} />
                  <span className="text-sm">{form.isActive ? 'Active — visible to sellers' : 'Inactive — hidden from sellers'}</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')}
                placeholder="Product details, purity, grade, etc." />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button>
            <button id="save-product-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal.mode === 'create' ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
