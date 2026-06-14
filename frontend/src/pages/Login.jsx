import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      login(token, user);
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message);
      } else {
        setError('Connection failed. Please check if services are running.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased bg-surface text-on-surface">
      {/* Left Side: Brand Image (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 relative bg-surface-container-highest overflow-hidden">
        <img 
          alt="Kids holding notebooks" 
          className="absolute inset-0 w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida/AP1WRLvAIq2HWbyvAJIuj3Y3So4s9A7g0XJa2VE_oI9UIESrpRvkT5HOmn0wZMtWfugihLLxe84dnY7QH5_KCArZD6wrq7giHe6JG5sBfFIK5V0lB8BmUh_SyaLVTzpxfhNjwjVhiYS-tmcuAZacJQfZQKEGqsHrj1DLhuvaCIsZH1fm47k2zU51TrykXkHRpssoi48Yv_A4QHwz_MMBWjW0x6WmzAf_v_octjDX9yQYKsDI1GqPc_hCSsQS6g"
        />
        {/* Overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-foundation-dark/90 via-foundation-dark/40 to-transparent"></div>
        {/* Brand Message overlay */}
        <div className="absolute bottom-0 left-0 p-16 text-on-secondary z-10 w-full">
          <div className="flex items-center gap-2 mb-4 opacity-90">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              volunteer_activism
            </span>
            <span className="font-label-caps text-xs text-white tracking-widest uppercase">Student-Led Initiative</span>
          </div>
          <h2 className="font-display-lg text-4xl lg:text-5xl text-white font-bold mb-4 max-w-lg leading-tight">
            New Wings. Real Impact.
          </h2>
          <p className="font-body-lg text-base text-white/80 max-w-md leading-relaxed">
            Join our community of dedicated volunteers driving grassroots change and empowering marginalized communities across the nation.
          </p>
          {/* Trust Badge Element */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
            <span className="material-symbols-outlined text-primary-fixed text-sm font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span className="font-label-caps text-xs text-white font-bold">80G / 12A Registered NGO</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-16 relative bg-surface">
        {/* Subtle background pattern for depth */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Brand Header */}
          <div className="md:hidden mb-8 text-center">
            <h1 className="font-headline-lg-mobile text-xl font-bold text-primary">NayePankh Foundation</h1>
          </div>

          {/* Form Header */}
          <div className="mb-10">
            <h1 className="hidden md:block font-headline-md text-2xl font-bold text-primary mb-6">NayePankh Foundation</h1>
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2">Volunteer Login</h2>
            <p className="font-body-md text-sm text-on-surface-variant">Welcome back. Let's make an impact today.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-6">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block font-label-caps text-xs text-on-surface font-semibold mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-outline" />
                </div>
                <input 
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-outline rounded-lg bg-white text-on-surface font-body-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-label-caps text-xs text-on-surface font-semibold" htmlFor="password">
                  Password
                </label>
                <Link to="#" className="font-body-md text-xs text-primary font-semibold hover:text-surface-tint hover:underline underline-offset-4 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-outline" />
                </div>
                <input 
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-outline rounded-lg bg-white text-on-surface font-body-md text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 bg-primary text-white font-headline-md text-sm font-semibold py-3.5 px-4 rounded-lg hover:bg-surface-tint hover:shadow-md transition-all duration-200 active:scale-[0.98] outline-none"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Sign Up CTA */}
          <div className="mt-8 text-center border-t border-outline-variant/40 pt-6">
            <p className="font-body-md text-sm text-on-surface-variant">
              Ready to join the movement? 
              <Link to="/signup" className="text-primary font-semibold hover:underline underline-offset-4 ml-1">
                Create an account
              </Link>
            </p>
          </div>

          {/* Admin Link (Subtle) */}
          <div className="mt-12 text-center">
            <Link to="/admin/login" className="inline-flex items-center gap-1 font-label-caps text-xs font-semibold text-outline hover:text-on-surface-variant transition-colors">
              <ShieldCheck size={16} />
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
