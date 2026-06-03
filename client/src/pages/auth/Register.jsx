import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register } from '../../api/auth';
import toast from 'react-hot-toast';

export default function Register() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', company:'', phone:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const { data } = await register(form);
      loginUser(data.token, data.user);
      toast.success('Account created! Welcome to AasaMedChem.');
      navigate('/seller/catalog', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card animate-up" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">⚗️</div>
          <div className="auth-logo-name">AasaMedChem</div>
          <div className="auth-logo-tagline">Create a Seller Account</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input id="reg-name" className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input id="reg-email" className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input id="reg-password" className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company</label>
              <input id="reg-company" className="form-input" placeholder="Your Company Ltd." value={form.company} onChange={set('company')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input id="reg-phone" className="form-input" placeholder="+91-9000000000" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          <button id="reg-submit" className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Seller Account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
