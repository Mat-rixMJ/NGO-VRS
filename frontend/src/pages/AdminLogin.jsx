import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { AlertCircle, Lock, User, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (user.role !== 'admin') {
        setError('Access Denied: Admin privileges required for this portal.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      login(token, user);
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message);
      } else {
        setError('Authentication failed. Check if server is running.');
      }
    } finally {
      if (!success) {
        setSubmitting(false);
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{
        backgroundColor: '#f3fcef',
        backgroundImage: 'radial-gradient(#dce5d9 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Decorative Background Blur Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-primary-container opacity-10 blur-3xl mix-blend-multiply"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-secondary opacity-5 blur-3xl mix-blend-multiply"></div>
      </div>

      {/* Main Content Container */}
      <main className="w-full max-w-[480px] relative z-10 flex flex-col items-center">
        {/* Logo / Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 shadow-sm border border-outline-variant">
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_person
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl md:text-3xl text-primary font-bold text-center">NayePankh Foundation</h1>
          <p className="font-label-caps text-xs text-on-surface-variant mt-2 tracking-widest uppercase">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="w-full glass-card admin-shadow rounded-xl p-8 border-t-[4px] border-t-primary" style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 10px 40px -10px rgba(15, 23, 42, 0.1)'
        }}>
          <div className="mb-8">
            <h2 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface mb-2">Secure Access</h2>
            <p className="font-body-md text-sm text-on-surface-variant">Please authenticate to continue to the administration dashboard.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-6">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg text-sm mb-6">
              <CheckCircle size={16} className="shrink-0" />
              <span>Authentication approved! Loading dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block font-label-caps text-xs text-on-surface font-semibold mb-2" htmlFor="email">
                Admin ID or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-outline" />
                </div>
                <input 
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nayepankh.org"
                  className="block w-full pl-10 pr-3 py-3 border border-outline rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-label-caps text-xs text-on-surface font-semibold" htmlFor="password">
                  Password
                </label>
                <Link to="#" className="font-body-md text-xs text-primary hover:text-surface-tint underline underline-offset-2 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-outline" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-outline rounded-lg bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-body-md text-sm outline-none"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* 2FA Placeholder Card */}
            <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <div>
                <p className="font-label-caps text-xs font-semibold text-on-surface">Two-Factor Authentication</p>
                <p className="font-body-md text-xs text-on-surface-variant mt-1">An authentication code will be required on the next step if enabled.</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={submitting || success}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-headline-md text-sm font-semibold text-on-primary bg-primary hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 hover:shadow-md group"
              >
                {submitting ? 'Authenticating...' : 'Enter Admin Portal'}
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>

        {/* Trust Indicator Footer */}
        <div className="mt-8 flex flex-col items-center space-y-4">
          <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-full border border-outline-variant shadow-sm text-xs">
            <span className="font-label-caps text-on-surface-variant flex items-center">
              <span className="material-symbols-outlined text-[16px] mr-1 text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> 
              Govt. Registered
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="font-label-caps text-on-surface-variant">80G/12A Compliant</span>
          </div>
          <p className="font-body-md text-xs text-on-surface-variant text-center">
            Authorized personnel only. Activities are logged.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
