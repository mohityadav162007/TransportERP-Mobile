import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await login(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="glass login-card">
        <div className="login-header">
          <div className="logo-box">
            <LogIn size={32} />
          </div>
          <h2>Transport ERP</h2>
          <p>Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="icon" />
              <input
                type="email"
                placeholder="Ex: admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: var(--bg-color);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
        }
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .logo-box {
          width: 64px;
          height: 64px;
          background: var(--accent-color);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: white;
        }
        .login-header h2 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }
        .login-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          padding-left: 4px;
        }
        .input-with-icon {
          position: relative;
        }
        .input-with-icon .icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }
        .input-with-icon input {
          padding-left: 40px;
        }
        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f85149;
          background: rgba(248, 81, 73, 0.1);
          padding: 10px;
          border-radius: 8px;
          font-size: 0.85rem;
        }
        .submit-btn {
          margin-top: 1rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Login;
