import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '75px',
      background: 'rgba(243, 252, 239, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-glass)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)' }}>
        <div style={{
          background: 'var(--gradient-primary)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)'
        }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <span style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 800,
          fontSize: '1.3rem',
          background: 'linear-gradient(135deg, #006e2f 40%, #22c55e 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.04em'
        }}>
          NayePankh
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user ? (
          <>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} className="label-mono">
              USER // <strong style={{ color: 'var(--text-main)' }}>{user.name.toUpperCase()}</strong>
            </span>
            
            {/* Volunteer Link requested by User */}
            <Link 
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: 'Sora',
                padding: '6px 12px',
                border: '1.5px solid var(--primary)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--primary)',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              className="hover:bg-primary/5"
            >
              VOLUNTEER
            </Link>

            {user.role === 'admin' ? (
              <Link
                to="/admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'Sora',
                  color: isActive('/admin') ? 'var(--secondary)' : 'var(--text-main)'
                }}
              >
                <Shield size={16} />
                ADMIN PANEL
              </Link>
            ) : (
              <>
                <Link
                  to="/events"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    fontFamily: 'Sora',
                    color: isActive('/events') ? 'var(--secondary)' : 'var(--text-main)'
                  }}
                >
                  EVENTS
                </Link>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    fontFamily: 'Sora',
                    color: isActive('/dashboard') ? 'var(--secondary)' : 'var(--text-main)'
                  }}
                >
                  <User size={16} />
                  PROFILE
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                gap: '4px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1.5px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <LogOut size={13} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'Sora',
                color: isActive('/') ? 'var(--primary)' : 'var(--text-muted)'
              }}
            >
              HOME
            </Link>
            <Link
              to="/login"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'Sora',
                color: isActive('/login') ? 'var(--primary)' : 'var(--text-muted)'
              }}
            >
              LOGIN
            </Link>
            <Link to="/signup" className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}>
              JOIN NOW
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
