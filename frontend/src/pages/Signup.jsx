import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { User, Mail, Lock, Phone, MapPin, Calendar, Shield, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Home } from 'lucide-react';

const SKILLS_LIST = [
  'Education & Teaching',
  'Food Drive & Distribution',
  'Graphic Design',
  'Content Writing',
  'Social Media Outreach',
  'Event Coordination',
  'Fundraising'
];

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    city: '',
    availability: 'Weekends',
    role: 'volunteer'
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const submissionData = {
      ...formData,
      skills: selectedSkills.join(', '),
      age: formData.age ? parseInt(formData.age) : null
    };

    try {
      await axiosClient.post('/auth/signup', submissionData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message);
      } else {
        setError('Signup failed. Connection issue.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased bg-background text-on-background">
      {/* Left Column (Hidden on Mobile) */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden bg-surface-container-highest">
        <div className="absolute inset-0 bg-gradient-to-t from-foundation-dark/80 via-foundation-dark/20 to-transparent z-10 mix-blend-multiply"></div>
        <img 
          alt="Students at NGO school" 
          className="absolute inset-0 w-full h-full object-cover z-0" 
          src="https://lh3.googleusercontent.com/aida/AP1WRLtxIAEnbTdzg5C5EArxjvoshV8mrd2RdS3-Jo8dMbH-sN2PEFNWMGSUm5UyyILqIul5tzexn3sF5388BnQFxniqB-LspZbfAud2MXXAPu57gqMBtsSdH0KnU4ul_67fJg9-qLXdSM0wkKQgIJOQxEJf7T0DlVpflPI5mGbJdpvURQbLv8Ufi2V3XHYEbVpeLiVcBEPy0qjtMawTA9qAb2NtLaUvObQ4tKLhFe5AF4Bq1tj0BWkcXHKcXNE"
        />
        <div className="absolute bottom-20 left-12 right-12 z-20 text-on-primary">
          <h2 className="font-display-lg text-4xl lg:text-5xl mb-4 text-white font-bold leading-tight drop-shadow-sm">
            Empower the Future.
          </h2>
          <p className="font-body-lg text-lg text-white opacity-90 mb-8 max-w-lg drop-shadow-sm leading-relaxed">
            Join a passionate community of student volunteers. Together, we can provide education, resources, and a new set of wings to those who need it most.
          </p>
          {/* Trust Badges */}
          <div className="flex gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full border border-outline-variant shadow-sm backdrop-blur-sm">
              <span className="material-symbols-outlined text-primary text-sm font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span className="font-label-caps text-xs text-on-surface font-bold">Registered NGO</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full border border-outline-variant shadow-sm backdrop-blur-sm">
              <span className="material-symbols-outlined text-primary text-sm font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <span className="font-label-caps text-xs text-on-surface font-bold">80G/12A Certified</span>
            </div>
          </div>
        </div>

        {/* Wing Pattern Overlay */}
        <svg className="absolute inset-0 w-full h-full z-0 opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wing-pattern" width="40" height="40" patternUnits="userSpaceOnUse" x="0" y="0">
              <path d="M0 40c10-10 20-10 30-20C20 10 10 20 0 40z" fill="currentColor"></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wing-pattern)" className="text-surface" x="0" y="0"></rect>
        </svg>
      </div>

      {/* Form Column */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center min-h-screen px-6 py-12 relative bg-surface">
        {/* Mobile Header */}
        <div className="md:hidden w-full max-w-md mb-8 flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-on-surface transition-colors"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
          <span className="font-headline-md text-xl font-bold text-primary">NayePankh</span>
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-xs font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="font-label-caps text-[10px] text-on-surface font-bold">80G/12A</span>
          </div>
        </div>

        {/* Card Panel */}
        <div className="w-full max-w-md bg-white rounded-xl shadow-[0_8px_30px_rgb(15,23,42,0.03)] p-8 border border-outline-variant/30">
          {/* Back to Home — Desktop */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors group"
            >
              <div className="w-7 h-7 rounded-full border border-outline-variant flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                <Home size={13} />
              </div>
              Back to Home
            </Link>
            <span className="font-label-caps text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-full border border-outline-variant">Step 1 of 1</span>
          </div>

          <div className="mb-6">
            <h1 className="font-headline-lg text-2xl md:text-3xl text-on-background font-bold mb-2">Become a Volunteer</h1>
            <p className="font-body-md text-sm text-on-surface-variant">Fill in your details below to join the movement.</p>
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
              <span>Account created! Redirecting to login page...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block font-label-caps text-xs text-on-surface-variant font-semibold mb-1.5" htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-outline" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Aarav Sharma"
                  className="block w-full pl-10 pr-3 py-2.5 border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container text-on-surface text-sm outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-label-caps text-xs text-on-surface-variant font-semibold mb-1.5" htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-outline" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="aarav@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container text-on-surface text-sm outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Phone & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant font-semibold mb-1.5" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-outline" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className="block w-full pl-10 pr-3 py-2.5 border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container text-on-surface text-sm outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant font-semibold mb-1.5" htmlFor="age">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="25"
                  min="5"
                  max="120"
                  className="block w-full px-3 py-2.5 border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container text-on-surface text-sm outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* City & Availability */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant font-semibold mb-1.5" htmlFor="city">
                  City
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-outline" />
                  </div>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-8 py-2.5 border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container text-on-surface text-sm outline-none transition-all duration-200 cursor-pointer appearance-none"
                  >
                    <option value="">Select city</option>
                    <option value="Kanpur">Kanpur</option>
                    <option value="Ghaziabad">Ghaziabad</option>
                    <option value="Noida">Noida</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-xs text-on-surface-variant font-semibold mb-1.5" htmlFor="availability">
                  Availability
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-outline" />
                  </div>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-8 py-2.5 border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container text-on-surface text-sm outline-none transition-all duration-200 cursor-pointer appearance-none"
                  >
                    <option value="Weekends">Weekends</option>
                    <option value="Weekdays">Weekdays</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-label-caps text-xs text-on-surface-variant font-semibold mb-1.5" htmlFor="password">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-outline" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container text-on-surface text-sm outline-none transition-all duration-200"
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
              <p className="mt-1 text-[11px] text-on-surface-variant">Must be at least 8 characters long.</p>
            </div>

            {/* Skills Button Selection */}
            <div>
              <label className="block font-label-caps text-xs text-on-surface-variant font-semibold mb-2">
                Skills / Interests
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto p-2 border border-outline rounded-lg bg-surface">
                {SKILLS_LIST.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 border cursor-pointer active:scale-95"
                      style={{
                        borderColor: isSelected ? 'var(--primary)' : 'var(--outline-variant)',
                        background: isSelected ? 'rgba(0, 110, 47, 0.08)' : '#ffffff',
                        color: isSelected ? 'var(--primary)' : 'var(--text-muted)'
                      }}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Developer options */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-primary/30 bg-primary/2">
              <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <Shield size={16} className="text-primary" />
                Register as Admin? (Developer)
              </span>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="bg-white border border-outline rounded p-1 text-xs cursor-pointer focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="volunteer">No (Volunteer)</option>
                <option value="admin">Yes (Admin)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || success}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-headline-md text-sm font-semibold text-on-primary bg-primary hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 hover:shadow-md group"
            >
              {submitting ? 'Joining...' : 'Join the Movement'}
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Already have account */}
          <div className="mt-6 text-center border-t border-outline-variant/30 pt-4">
            <p className="font-body-md text-sm text-on-surface-variant">
              Already a volunteer?{' '}
              <Link to="/login" className="font-headline-md text-sm font-bold text-primary hover:text-secondary underline underline-offset-4 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer mark */}
        <div className="mt-8 flex items-center gap-2 text-on-surface-variant opacity-70 text-xs">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span className="font-body-md">Secure Registration</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
