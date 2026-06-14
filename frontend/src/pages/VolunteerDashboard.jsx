import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { 
  User, Phone, MapPin, Calendar, Heart, 
  Save, AlertCircle, CheckCircle, Award, Star, MessageSquare, 
  Clock, Activity
} from 'lucide-react';

const SKILLS_LIST = [
  'Education & Teaching',
  'Food Drive & Distribution',
  'Graphic Design',
  'Content Writing',
  'Social Media Outreach',
  'Event Coordination',
  'Fundraising'
];

const VolunteerDashboard = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'profile'
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    city: '',
    availability: '',
    skills: ''
  });
  
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get('/volunteers/me');
        const data = response.data;
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age !== null ? String(data.age) : '',
          city: data.city || '',
          availability: data.availability || 'Weekends',
          skills: data.skills || ''
        });

        // Initialize skills array
        if (data.skills) {
          const list = data.skills.split(',').map(s => s.trim()).filter(Boolean);
          setSelectedSkills(list);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => {
      const updated = prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill];
      
      setProfile(p => ({ ...p, skills: updated.join(', ') }));
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        name: profile.name,
        phone: profile.phone,
        age: profile.age ? parseInt(profile.age) : null,
        city: profile.city,
        availability: profile.availability,
        skills: selectedSkills.join(', ')
      };

      const response = await axiosClient.put('/volunteers/me', payload);
      setSuccess(true);
      updateUserProfile({ name: profile.name });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate points dynamically based on profile completeness to make it interactive
  const calculatedPoints = 40 + (selectedSkills.length * 10) + (profile.phone ? 20 : 0) + (profile.city ? 20 : 0) + (profile.age ? 20 : 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-on-surface-variant font-medium">
        <p className="animate-pulse">Loading your profile details...</p>
      </div>
    );
  }

  if (error && !profile.name) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">Session Expired</h2>
        <p className="text-sm text-on-surface-variant max-w-sm">
          {error} Please log in again to continue.
        </p>
        <a
          href="/login"
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-all"
        >
          Go to Login
        </a>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Dashboard Local Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/30 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline-lg text-on-background">Volunteer Portal</h1>
          <p className="text-sm text-on-surface-variant mt-1">Empower the Future with NayePankh</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-surface-container border border-outline-variant/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Dashboard Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setError(null);
              setSuccess(false);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'profile' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        /* --- DASHBOARD VIEW (Stitch Bento-Grid Layout) --- */
        <div className="space-y-8 animate-fade-in">
          
          {/* Hero Section */}
          <section className="flex flex-col md:flex-row items-center justify-between bg-surface-container-low rounded-xl p-8 gap-8 border border-outline-variant/50 shadow-sm relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="flex-1 z-10">
              <h2 className="font-display-lg text-4xl text-primary font-bold mb-4">
                Good morning, {profile.name.split(' ')[0]}!
              </h2>
              <p className="font-body-lg text-base text-on-surface-variant leading-relaxed max-w-xl">
                Welcome to your volunteer portal. Complete your profile to unlock more opportunities and get matched with the right drives.
              </p>
              <button 
                onClick={() => setActiveTab('profile')}
                className="mt-6 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Heart size={16} fill="white" />
                Update Profile & Skills
              </button>
            </div>

            {/* Circular Profile Completeness Tracker */}
            <div className="relative w-48 h-48 flex items-center justify-center bg-white rounded-full shadow-inner z-10 flex-shrink-0 border-4 border-surface-container-high">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle className="text-surface-variant" cx="96" cy="96" fill="none" r="88" stroke="currentColor" strokeWidth="10"></circle>
                <circle 
                  className="text-primary" 
                  cx="96" 
                  cy="96" 
                  fill="none" 
                  r="88" 
                  stroke="currentColor" 
                  strokeDasharray="552" 
                  strokeDashoffset={552 - (552 * Math.min(calculatedPoints, 150)) / 150} 
                  strokeLinecap="round" 
                  strokeWidth="10"
                ></circle>
              </svg>
              <div className="text-center flex flex-col items-center">
                <Star size={36} className="text-yellow-500 fill-yellow-500 mb-1" />
                <span className="font-headline-lg text-3xl font-bold text-primary">{Math.round((calculatedPoints / 150) * 100)}%</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">Profile Complete</span>
              </div>
            </div>
          </section>

          {/* Bento Grid Section */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Profile Completeness (Col Span 8) */}
            <div className="md:col-span-8 bg-white rounded-xl p-6 border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-headline-md text-lg font-bold text-on-surface">Profile Completeness</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Fill in all your details to get matched with the right opportunities</p>
                </div>
                <span className={`font-label-caps text-[10px] px-3 py-1 rounded-full font-bold ${
                  calculatedPoints >= 130 ? 'bg-green-100 text-green-800' : calculatedPoints >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {calculatedPoints >= 130 ? 'Complete' : calculatedPoints >= 80 ? 'Almost There' : 'Needs Work'}
                </span>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-headline-lg text-2xl font-bold text-primary">
                    {Math.round((calculatedPoints / 150) * 100)}%
                  </span>
                  <span className="font-label-caps text-xs font-semibold text-on-surface-variant">
                    {calculatedPoints >= 130 ? 'All fields filled' : 'Add missing details to reach 100%'}
                  </span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-3 overflow-hidden">
                  <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min((calculatedPoints / 150) * 100, 100)}%` }}></div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${profile.name ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                    ✓ Name
                  </span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${profile.phone ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                    {profile.phone ? '✓' : '○'} Phone
                  </span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${profile.age ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                    {profile.age ? '✓' : '○'} Age
                  </span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${profile.city ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                    {profile.city ? '✓' : '○'} City
                  </span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${selectedSkills.length > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                    {selectedSkills.length > 0 ? '✓' : '○'} Skills ({selectedSkills.length})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats (Col Span 4) */}
            <div className="md:col-span-4 bg-emerald-50/50 rounded-xl p-6 border-l-4 border-primary shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full text-primary shadow-sm">
                  <User size={20} className="fill-primary/20" />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface">{profile.city || 'Not set'}</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">Branch / City</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full text-primary shadow-sm">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface">{selectedSkills.length}</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">Skills Registered</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full text-primary shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface">{profile.availability || 'Flexible'}</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">Availability</p>
                </div>
              </div>
            </div>

            {/* Your Registered Skills (Col Span 6) */}
            <div className="md:col-span-6 bg-white rounded-xl p-6 border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <h3 className="font-headline-md text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-yellow-600" />
                Your Skills & Interests
              </h3>
              
              {selectedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <span key={skill} className="px-3 py-2 rounded-lg text-xs font-semibold border border-primary/30 bg-primary/5 text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-on-surface-variant">No skills added yet.</p>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="mt-3 text-primary text-xs font-semibold underline cursor-pointer"
                  >
                    Add skills from your profile →
                  </button>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-outline-variant/20">
                <p className="text-xs text-on-surface-variant">
                  <strong className="text-on-surface">Tip:</strong> Adding more skills helps us match you with the right volunteering drives in your area.
                </p>
              </div>
            </div>

            {/* Volunteer Info Card (Col Span 6) */}
            <div className="md:col-span-6 bg-white rounded-xl p-6 border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  Your Volunteer Details
                </h3>
              </div>

              <div className="flex flex-col gap-3 flex-grow justify-center">
                <div className="bg-surface rounded-lg p-4 border border-outline-variant flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Email</h4>
                    <p className="text-xs text-on-surface-variant">{profile.email}</p>
                  </div>
                </div>

                <div className="bg-surface rounded-lg p-4 border border-outline-variant flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Phone</h4>
                    <p className="text-xs text-on-surface-variant">{profile.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="bg-surface rounded-lg p-4 border border-outline-variant flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Age</h4>
                    <p className="text-xs text-on-surface-variant">{profile.age ? `${profile.age} years old` : 'Not provided'}</p>
                  </div>
                </div>

                <div className="bg-surface rounded-lg p-4 border border-outline-variant flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Member Since</h4>
                    <p className="text-xs text-on-surface-variant">Registered Volunteer</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
                </div>
              </div>
            </div>

          </section>

          {/* Philosophy Footer Banner */}
          <div className="rounded-xl overflow-hidden relative h-32 flex items-center justify-center border border-outline-variant shadow-sm mt-8">
            <div className="absolute inset-0 bg-surface-container-high mix-blend-multiply opacity-50"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-surface z-10"></div>
            <img 
              alt="Community engagement" 
              className="w-full h-full object-cover opacity-20 grayscale" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLukxSxkjFXI82LaS9j-1jqcVY5HRV0X_gG_rcvLxmEN6usgpxXYYgWnadd_hunueQTaq9tHR3uKHIQYF2JVnHqNxC3-keraqXJ0VNc2XoAwKhH19AAzb9dctrgEIUE45Cu0CLYW7eiAriSWWBMuhB9IqOPxRtYdNkzYUfd3G0VGfu9Ox1KVp0GO0-aA8JQaYTwq1RIFSrgY6vhnFZsEyLdRglwQy4DalDEX7MWQaisklSUKsW3Isgjq8Lc"
            />
            <div className="relative z-20 flex flex-col items-center text-center px-4">
              <p className="font-headline-md text-xl md:text-2xl text-on-surface font-bold">"Every data point is a life uplifted."</p>
              <p className="font-label-caps text-xs text-on-surface-variant mt-2 tracking-wide uppercase">Naye Pankh Foundation Philosophy</p>
            </div>
          </div>

        </div>
      ) : (
        /* --- PROFILE VIEW (Original details updating form) --- */
        <div className="max-w-3xl mx-auto w-full animate-fade-in">
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
            
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-6 mb-8">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-on-surface font-headline-lg">Volunteer Profile Details</h2>
                <p className="text-sm text-on-surface-variant">Update your account settings and matching skills</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-6">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg text-sm mb-6">
                <CheckCircle size={16} />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Read Only Email */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                  Registered Email (cannot be changed)
                </label>
                <input
                  type="text"
                  value={profile.email}
                  disabled
                  className="block w-full px-4 py-3 border border-outline rounded-lg bg-gray-100 text-on-surface-variant cursor-not-allowed outline-none"
                />
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Age, City & Availability */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={profile.age}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                    City
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                      <MapPin size={16} />
                    </div>
                    <select
                      name="city"
                      value={profile.city}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-8 py-3 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Select City</option>
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
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2">
                    Availability
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                      <Calendar size={16} />
                    </div>
                    <select
                      name="availability"
                      value={profile.availability}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-8 py-3 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all cursor-pointer appearance-none"
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

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-3">
                  Skills &amp; Interests
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-outline rounded-lg bg-surface">
                  {SKILLS_LIST.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer active:scale-95"
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

              {/* Action Button */}
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-headline-md text-sm font-semibold text-on-primary bg-primary hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 hover:shadow-md cursor-pointer"
                disabled={submitting}
              >
                <Save size={18} className="mr-2" />
                {submitting ? 'Saving changes...' : 'Save Profile Changes'}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
