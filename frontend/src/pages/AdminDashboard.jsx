import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Users, BarChart3, HelpCircle, Search, MapPin,
  Trash2, ExternalLink, Calendar, Plus, RefreshCw, X, Award,
  Shield, Download, Heart, Activity, DollarSign, BookOpen, Clock, AlertCircle, CheckCircle, HelpCircle as HelpIcon,
  FileText, Printer, FileSpreadsheet, TrendingUp, MapPinned, Layers, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#006e2f', '#3755c3', '#795900', '#22c55e', '#708cfd', '#ef4444', '#10b981'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'volunteers' | 'analytics' | 'faqs' | 'reports'
  const [reportGenerating, setReportGenerating] = useState(false);
  
  // Volunteers State
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  // Analytics State
  const [summary, setSummary] = useState({ total: 0, newThisWeek: 0, newThisMonth: 0 });
  const [trends, setTrends] = useState({ signupsOverTime: [], byCity: [], bySkill: [], byAgeBand: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'General' });
  const [editingFaq, setEditingFaq] = useState(null); // { id, question, answer, category }
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [faqError, setFaqError] = useState(null);
  const [faqSuccess, setFaqSuccess] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const PAGE_SIZE = 20;

  // Common UI State
  const [error, setError] = useState(null);

  // Fetch Volunteers
  const fetchVolunteers = async () => {
    setLoadingVolunteers(true);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (cityFilter) params.city = cityFilter;
      if (skillFilter) params.skill = skillFilter;

      const res = await axiosClient.get('/volunteers', { params });
      
      // Handle both paginated and flat array responses
      if (res.data.results) {
        setVolunteers(res.data.results);
        setTotalVolunteers(res.data.total);
      } else {
        setVolunteers(res.data);
        setTotalVolunteers(res.data.length);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch volunteers.');
    } finally {
      setLoadingVolunteers(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const [sumRes, trendRes] = await Promise.all([
        axiosClient.get('/analytics/summary'),
        axiosClient.get('/analytics/trends')
      ]);
      setSummary(sumRes.data);
      setTrends(trendRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch FAQs
  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const res = await axiosClient.get('/faqs');
      setFaqs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  // Initial loading on mount and state changes
  useEffect(() => {
    fetchVolunteers();
    fetchAnalytics();
    fetchFaqs();
  }, [search, cityFilter, skillFilter, currentPage]);

  // Delete Volunteer
  const handleDeleteVolunteer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this volunteer?')) return;
    try {
      await axiosClient.delete(`/volunteers/${id}`);
      setVolunteers(prev => prev.filter(v => v.id !== id));
      if (selectedVolunteer && selectedVolunteer.id === id) {
        setSelectedVolunteer(null);
      }
      // Refresh analytics
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert('Failed to delete volunteer.');
    }
  };

  // Create FAQ
  const handleCreateFaq = async (e) => {
    e.preventDefault();
    if (!newFaq.question || !newFaq.answer) {
      setFaqError('Question and Answer are required.');
      return;
    }
    setFaqError(null);
    setFaqSuccess(false);

    try {
      const res = await axiosClient.post('/faqs', newFaq);
      setFaqs(prev => [...prev, res.data]);
      setNewFaq({ question: '', answer: '', category: 'General' });
      setFaqSuccess(true);
      setTimeout(() => setFaqSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setFaqError('Failed to create FAQ.');
    }
  };

  // Delete FAQ
  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await axiosClient.delete(`/faqs/${id}`);
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete FAQ.');
    }
  };

  // Update FAQ
  const handleUpdateFaq = async (e) => {
    e.preventDefault();
    if (!editingFaq || !editingFaq.question || !editingFaq.answer) {
      setFaqError('Question and Answer are required.');
      return;
    }
    setFaqError(null);
    setFaqSuccess(false);

    try {
      const res = await axiosClient.put(`/faqs/${editingFaq.id}`, {
        question: editingFaq.question,
        answer: editingFaq.answer,
        category: editingFaq.category
      });
      setFaqs(prev => prev.map(f => f.id === editingFaq.id ? res.data : f));
      setEditingFaq(null);
      setFaqSuccess(true);
      setTimeout(() => setFaqSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      setFaqError('Failed to update FAQ.');
    }
  };

  // Static mock resource allocation pie data from Stitch design
  const resourceAllocationData = [
    { name: 'Hunger Relief', value: 40 },
    { name: 'Education', value: 25 },
    { name: 'Health', value: 20 },
    { name: 'Sanitary', value: 15 }
  ];

  // ---- REPORT GENERATION HELPERS ----

  const downloadCSV = (filename, rows, headers) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const key = h.toLowerCase().replace(/ /g, '');
        const val = row[key] ?? row[h] ?? '';
        // Escape commas and quotes
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadVolunteersCSV = async () => {
    setReportGenerating(true);
    try {
      const res = await axiosClient.get('/volunteers');
      const vols = res.data;
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Age', 'City', 'Availability', 'Skills', 'Role', 'Registered'];
      const rows = vols.map(v => ({
        'ID': v.id,
        'Name': v.name,
        'Email': v.email,
        'Phone': v.phone || '',
        'Age': v.age || '',
        'City': v.city || '',
        'Availability': v.availability || '',
        'Skills': v.skills || '',
        'Role': v.role,
        'Registered': v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ''
      }));
      downloadCSV(`nayepankh_volunteers_${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
    } catch (e) {
      alert('Failed to fetch volunteers for export.');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleDownloadAnalyticsCSV = async () => {
    setReportGenerating(true);
    try {
      const [sumRes, trendRes] = await Promise.all([
        axiosClient.get('/analytics/summary'),
        axiosClient.get('/analytics/trends')
      ]);
      const s = sumRes.data;
      const t = trendRes.data;
      // Build a multi-section CSV
      const lines = [
        'NAYEPANKH FOUNDATION - ANALYTICS REPORT',
        `Generated: ${new Date().toLocaleString()}`,
        '',
        '=== SUMMARY ===',
        'Metric,Value',
        `Total Volunteers,${s.total}`,
        `New This Week,${s.newThisWeek}`,
        `New This Month,${s.newThisMonth}`,
        '',
        '=== VOLUNTEERS BY CITY ===',
        'City,Count',
        ...t.byCity.map(c => `${c.city},${c.count}`),
        '',
        '=== VOLUNTEERS BY SKILL ===',
        'Skill,Count',
        ...t.bySkill.map(s => `${s.skill},${s.count}`),
        '',
        '=== VOLUNTEERS BY AGE BAND ===',
        'Age Band,Count',
        ...t.byAgeBand.map(a => `${a.band},${a.count}`),
        '',
        '=== MONTHLY SIGNUPS ===',
        'Month,Signups',
        ...t.signupsOverTime.map(m => `${m.month},${m.count}`),
      ].join('\n');
      const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nayepankh_analytics_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to fetch analytics for export.');
    } finally {
      setReportGenerating(false);
    }
  };

  const handlePrintReport = async () => {
    setReportGenerating(true);
    try {
      const [volRes, sumRes, trendRes] = await Promise.all([
        axiosClient.get('/volunteers'),
        axiosClient.get('/analytics/summary'),
        axiosClient.get('/analytics/trends')
      ]);
      const vols = volRes.data;
      const s = sumRes.data;
      const t = trendRes.data;

      const html = `
        <!DOCTYPE html><html><head><title>NayePankh Report</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; padding: 32px; max-width: 900px; margin: 0 auto; }
          h1 { color: #006e2f; border-bottom: 3px solid #006e2f; padding-bottom: 8px; }
          h2 { color: #006e2f; margin-top: 32px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
          .meta { color: #555; font-size: 0.85rem; margin-bottom: 24px; }
          .kpi-row { display: flex; gap: 16px; margin: 16px 0; }
          .kpi { flex: 1; background: #f0faf4; border: 1px solid #c5e8d0; border-radius: 8px; padding: 12px 16px; }
          .kpi .num { font-size: 1.6rem; font-weight: 700; color: #006e2f; }
          .kpi .label { font-size: 0.75rem; color: #555; text-transform: uppercase; letter-spacing: 0.06em; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.85rem; }
          th { background: #006e2f; color: #fff; padding: 8px 12px; text-align: left; }
          td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background: #f9fafb; }
          .footer { margin-top: 48px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 0.75rem; color: #999; }
          @media print { body { padding: 16px; } }
        </style></head><body>
        <h1>🌱 NayePankh Foundation — Official Volunteer Report</h1>
        <p class="meta">Generated on: ${new Date().toLocaleString()} | Total Records: ${vols.length}</p>
        
        <h2>Summary Metrics</h2>
        <div class="kpi-row">
          <div class="kpi"><div class="num">${s.total}</div><div class="label">Total Volunteers</div></div>
          <div class="kpi"><div class="num">${s.newThisWeek}</div><div class="label">New This Week</div></div>
          <div class="kpi"><div class="num">${s.newThisMonth}</div><div class="label">New This Month</div></div>
          <div class="kpi"><div class="num">200,000+</div><div class="label">Lives Touched</div></div>
        </div>

        <h2>Volunteers by City</h2>
        <table><thead><tr><th>City</th><th>Count</th><th>% Share</th></tr></thead><tbody>
        ${t.byCity.map(c => `<tr><td>${c.city}</td><td>${c.count}</td><td>${((c.count/s.total)*100).toFixed(1)}%</td></tr>`).join('')}
        </tbody></table>

        <h2>Volunteers by Skill</h2>
        <table><thead><tr><th>Skill</th><th>Volunteers</th></tr></thead><tbody>
        ${t.bySkill.slice(0,10).map(sk => `<tr><td>${sk.skill}</td><td>${sk.count}</td></tr>`).join('')}
        </tbody></table>

        <h2>Volunteers by Age Group</h2>
        <table><thead><tr><th>Age Band</th><th>Count</th></tr></thead><tbody>
        ${t.byAgeBand.map(a => `<tr><td>${a.band}</td><td>${a.count}</td></tr>`).join('')}
        </tbody></table>

        <h2>Full Volunteer Registry (${vols.length} Records)</h2>
        <table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>City</th><th>Skills</th><th>Availability</th><th>Role</th><th>Registered</th></tr></thead><tbody>
        ${vols.map((v,i) => `<tr><td>${i+1}</td><td>${v.name}</td><td>${v.email}</td><td>${v.city||'-'}</td><td>${v.skills||'-'}</td><td>${v.availability||'-'}</td><td>${v.role}</td><td>${v.createdAt?new Date(v.createdAt).toLocaleDateString():'-'}</td></tr>`).join('')}
        </tbody></table>

        <div class="footer">NayePankh Foundation | contact@nayepankh.org | +91 83770 04040 | Noida, Uttar Pradesh — 80G & 12A Registered NGO</div>
        </body></html>`;

      const win = window.open('', '_blank', 'width=1000,height=800');
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 600);
    } catch (e) {
      alert('Failed to generate report.');
    } finally {
      setReportGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      
      {/* Page Title & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline-lg text-primary leading-tight">Admin Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">Student-Led Volunteer Management & platform trends</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-surface-container border border-outline-variant/50 p-1 rounded-lg flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'volunteers' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Volunteers List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Impact Analytics
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'faqs' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Chatbot FAQs
          </button>
          <button
            onClick={() => { setActiveTab('reports'); fetchAnalytics(); fetchVolunteers(); }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <FileText size={14} />
            Reports
          </button>
        </div>
      </div>

      {/* --- TAB CONTENT: OVERVIEW (Stitch Admin Dashboard Layout) --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Welcome Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-headline-md text-on-background">Welcome back, Admin</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">Here's what's happening across Naye Pankh branches today.</p>
            </div>
            <button className="self-start sm:self-center px-4 py-2 border border-outline text-primary font-semibold text-xs rounded-lg hover:bg-surface-container transition-all flex items-center gap-2 cursor-pointer active:scale-95">
              <Download size={14} />
              Export Report
            </button>
          </div>

          {/* Bento Grid - Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Users size={20} className="fill-primary/10" />
                </div>
                <span className="flex items-center text-primary text-xs font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                  +12%
                </span>
              </div>
              <h3 className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1">Total Volunteers</h3>
              <p className="font-headline-lg text-2xl font-bold text-on-background">{summary.total}</p>
            </div>

            {/* Card 2: Impact Card Style */}
            <div className="bg-emerald-50/50 p-6 rounded-xl border-l-4 border-primary shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-primary/15 text-primary rounded-lg">
                  <Heart size={20} className="fill-primary/20" />
                </div>
              </div>
              <h3 className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1">Total Lives Touched</h3>
              <p className="font-headline-lg text-2xl font-bold text-primary">200,000+</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-yellow-100 text-yellow-800 rounded-lg">
                  <Activity size={20} />
                </div>
              </div>
              <h3 className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1">Active Branches</h3>
              <p className="font-headline-lg text-2xl font-bold text-on-background">15</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                  <DollarSign size={20} />
                </div>
                <span className="flex items-center text-primary text-xs font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                  +8%
                </span>
              </div>
              <h3 className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase mb-1">Donations This Month</h3>
              <p className="font-headline-lg text-2xl font-bold text-on-background">₹4.2L</p>
            </div>
          </div>

          {/* Complex Layout Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section (Spans 2 columns) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-lg font-bold text-on-background">Volunteer Enrollment</h3>
                <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded">
                  Monthly Signups
                </span>
              </div>
              {/* Dynamic Enrollment Chart */}
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends.signupsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-main)' }} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Branch Performance (1 Column) */}
            <div className="bg-white p-6 rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-lg font-bold text-on-background">Top Branches</h3>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">more_horiz</span>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* Kanpur */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/25 flex items-center justify-center text-primary font-bold">K</div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-xs text-on-background">Kanpur (HQ)</h4>
                    <div className="w-full bg-surface-variant rounded-full h-1.5 mt-1">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="block font-bold text-on-background">450</span>
                    <span className="block text-[10px] text-on-surface-variant">Vols</span>
                  </div>
                </div>

                {/* Ghaziabad */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">G</div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-xs text-on-background">Ghaziabad</h4>
                    <div className="w-full bg-surface-variant rounded-full h-1.5 mt-1">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="block font-bold text-on-background">310</span>
                    <span className="block text-[10px] text-on-surface-variant">Vols</span>
                  </div>
                </div>

                {/* Noida */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-800 font-bold">N</div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-xs text-on-background">Noida</h4>
                    <div className="w-full bg-surface-variant rounded-full h-1.5 mt-1">
                      <div className="bg-yellow-600 h-1.5 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="block font-bold text-on-background">245</span>
                    <span className="block text-[10px] text-on-surface-variant">Vols</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setActiveTab('volunteers')}
                className="w-full mt-4 py-2 text-primary text-xs font-semibold hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                View All Volunteers <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Recent Activities Table (dynamically populated by registered volunteers) */}
          <div className="bg-white rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/40">
              <h3 className="font-headline-md text-lg font-bold text-on-background">Recent Registered Volunteers</h3>
              <button 
                onClick={fetchVolunteers}
                className="p-1.5 rounded bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-low/60 text-on-surface-variant font-label-caps text-[10px] tracking-wider uppercase border-b border-outline-variant/20">
                    <th className="py-3 px-6 font-semibold">Volunteer Name</th>
                    <th className="py-3 px-6 font-semibold">Action Type</th>
                    <th className="py-3 px-6 font-semibold">Branch / City</th>
                    <th className="py-3 px-6 font-semibold">Registered</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {volunteers.slice(0, 4).map((v) => (
                    <tr key={v.id} className="border-b border-outline-variant/20 hover:bg-surface/30 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold shadow-sm">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-on-surface">{v.name}</span>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">
                        {v.role === 'admin' ? 'Admin Access Registration' : 'New Volunteer Sign-up'}
                      </td>
                      <td className="py-4 px-6 font-medium">{v.city || 'Other'}</td>
                      <td className="py-4 px-6 text-on-surface-variant">
                        {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.role === 'admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {v.role === 'admin' ? 'Active Admin' : 'Pending Review'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {volunteers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-on-surface-variant">No recent registration activity found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB CONTENT: VOLUNTEERS (Existing list & CRUD) --- */}
      {activeTab === 'volunteers' && (
        <div className="animate-fade-in space-y-6">
          {/* Search and Filters */}
          <div className="bg-white grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="block w-full px-4 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
              />
            </div>
            <div>
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="block w-full px-4 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all cursor-pointer appearance-none"
                style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, gray 50%), linear-gradient(135deg, gray 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="">All Skills</option>
                <option value="Education">Education &amp; Teaching</option>
                <option value="Food">Food Drive &amp; Distribution</option>
                <option value="Design">Graphic Design</option>
                <option value="Writing">Content Writing</option>
                <option value="Social">Social Media Outreach</option>
                <option value="Coordination">Event Coordination</option>
                <option value="Fundraising">Fundraising</option>
              </select>
            </div>
          </div>

          {/* Volunteers Table */}
          <div className="bg-white rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            {loadingVolunteers ? (
              <div className="p-12 text-center text-on-surface-variant font-medium animate-pulse">Loading volunteers...</div>
            ) : volunteers.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-medium">No volunteers found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-surface-container-low/60 border-b border-outline-variant/20 text-on-surface-variant font-label-caps text-xs">
                      <th className="py-4 px-6 font-semibold">Name</th>
                      <th className="py-4 px-6 font-semibold">Email</th>
                      <th className="py-4 px-6 font-semibold">City</th>
                      <th className="py-4 px-6 font-semibold">Availability</th>
                      <th className="py-4 px-6 font-semibold">Role</th>
                      <th className="py-4 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {volunteers.map((v) => (
                      <tr key={v.id} className="border-b border-outline-variant/15 hover:bg-surface/30 transition-colors">
                        <td className="py-4 px-6 font-semibold text-on-surface">{v.name}</td>
                        <td className="py-4 px-6 text-on-surface-variant">{v.email}</td>
                        <td className="py-4 px-6 font-medium">{v.city || 'N/A'}</td>
                        <td className="py-4 px-6 text-primary font-medium">{v.availability || 'N/A'}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {v.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setSelectedVolunteer(v)}
                              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink size={12} />
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteVolunteer(v.id)}
                              className="btn-danger p-1.5 rounded cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalVolunteers > PAGE_SIZE && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-xs text-on-surface-variant">
                Showing <strong>{((currentPage - 1) * PAGE_SIZE) + 1}</strong>–<strong>{Math.min(currentPage * PAGE_SIZE, totalVolunteers)}</strong> of <strong>{totalVolunteers}</strong> volunteers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold border border-outline rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-on-surface px-2">
                  Page {currentPage} of {Math.ceil(totalVolunteers / PAGE_SIZE)}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalVolunteers / PAGE_SIZE), p + 1))}
                  disabled={currentPage >= Math.ceil(totalVolunteers / PAGE_SIZE)}
                  className="px-3 py-1.5 text-xs font-semibold border border-outline rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: IMPACT ANALYTICS (Stitch Impact Analysis Dashboard) --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-headline-md text-on-surface">Impact Deep Dive</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">Analyzing resource distribution and geographical reach across key regions.</p>
            </div>
            <div className="flex gap-3">
              <select className="bg-white border border-outline rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                <option>Last 12 Months</option>
                <option>Year to Date</option>
                <option>All Time</option>
              </select>
              <button className="bg-white border border-outline text-on-surface rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-surface-container transition-all cursor-pointer active:scale-95">
                <Download size={12} /> Export
              </button>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. Geographical Map - Large Span */}
            <div className="lg:col-span-8 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-outline-variant/35 p-6 flex flex-col relative overflow-hidden group">
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
              <div className="flex justify-between items-center mb-6 z-10">
                <h3 className="font-headline-md text-base font-bold text-on-surface">Geographical Impact</h3>
                <span className="material-symbols-outlined text-on-surface-variant">map</span>
              </div>
              <div className="flex-1 min-h-[300px] bg-slate-50 rounded-lg border border-outline-variant/20 relative overflow-hidden flex items-center justify-center">
                {/* Official India Map - Survey of India compliant */}
                <img 
                  alt="India Map - NayePankh Foundation Geographical Impact" 
                  className="h-full object-contain opacity-70 p-4" 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/India_states_and_union_territories_map_no_text.svg/800px-India_states_and_union_territories_map_no_text.svg.png"
                />
                
                {/* Simulated markers - positioned for UP region (right-center of India) */}
                <div className="absolute top-[32%] right-[28%] flex flex-col items-center group/marker cursor-pointer">
                  <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_0_4px_rgba(34,197,94,0.3)] animate-pulse"></div>
                  <div className="mt-2 bg-white px-2 py-1 rounded shadow-md text-[10px] font-bold text-primary opacity-0 group-hover/marker:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Kanpur: 12k Touched
                  </div>
                </div>

                <div className="absolute top-[26%] right-[25%] flex flex-col items-center group/marker cursor-pointer">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full shadow-[0_0_0_3px_rgba(218,163,0,0.3)]"></div>
                  <div className="mt-2 bg-white px-2 py-1 rounded shadow-md text-[10px] font-bold text-yellow-700 opacity-0 group-hover/marker:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Noida: 8k Touched
                  </div>
                </div>

                <div className="absolute top-[28%] right-[22%] flex flex-col items-center group/marker cursor-pointer">
                  <div className="w-5 h-5 bg-blue-600 rounded-full shadow-[0_0_0_5px_rgba(112,140,253,0.3)]"></div>
                  <div className="mt-2 bg-white px-2 py-1 rounded shadow-md text-[10px] font-bold text-blue-700 opacity-0 group-hover/marker:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Ghaziabad: 15k Touched
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Resource Doughnut Chart */}
            <div className="lg:col-span-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-outline-variant/35 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-base font-bold text-on-surface">Resource Allocation</h3>
                <span className="material-symbols-outlined text-on-surface-variant">pie_chart</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resourceAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {resourceAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center flex flex-col items-center">
                    <span className="text-xl font-bold text-on-surface">40%</span>
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Hunger Relief</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="mt-6 w-full flex flex-col gap-2.5">
                  {resourceAllocationData.map((entry, index) => (
                    <div key={entry.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="font-medium text-on-surface-variant">{entry.name}</span>
                      </div>
                      <span className="font-bold text-on-surface">{entry.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Lives Touched Bar Chart */}
            <div className="lg:col-span-8 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-outline-variant/35 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-base font-bold text-on-surface">Lives Touched Trend</h3>
                <span className="material-symbols-outlined text-on-surface-variant">trending_up</span>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends.signupsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                    {/* Simulated progressive values based on signups */}
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                      {trends.signupsOverTime.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metric Card & Leaderboard (1 Column Group) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Efficiency Metric */}
              <div className="bg-emerald-50/50 border-l-4 border-l-primary rounded-r-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border-y border-r border-outline-variant/30 p-6 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-primary opacity-10">
                  <span className="material-symbols-outlined text-9xl">savings</span>
                </div>
                <h3 className="font-label-caps text-[10px] text-on-surface-variant mb-2 uppercase tracking-wider font-bold">Efficiency Metric</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-on-surface">₹42</span>
                  <span className="text-xs text-on-surface-variant font-medium">/ life touched</span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-primary text-xs font-semibold">
                  <span className="material-symbols-outlined text-xs">arrow_downward</span>
                  <span>12% decrease from last quarter</span>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-outline-variant/35 p-6 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline-md text-base font-bold text-on-surface">Top Branches</h3>
                  <span className="material-symbols-outlined text-yellow-600">military_tech</span>
                </div>
                
                <ul className="flex flex-col gap-3">
                  <li className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-outline-variant/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center font-bold text-xs">1</div>
                      <div>
                        <div className="font-bold text-on-surface text-xs">Ghaziabad Central</div>
                        <div className="font-label-caps text-[9px] text-on-surface-variant font-medium tracking-wide uppercase">15,240 Impact Score</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-on-surface-variant" />
                  </li>
                  
                  <li className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-outline-variant/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-on-surface-variant flex items-center justify-center font-bold text-xs">2</div>
                      <div>
                        <div className="font-bold text-on-surface text-xs">Kanpur North</div>
                        <div className="font-label-caps text-[9px] text-on-surface-variant font-medium tracking-wide uppercase">12,100 Impact Score</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-on-surface-variant" />
                  </li>

                  <li className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-outline-variant/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs border border-outline-variant/20">3</div>
                      <div>
                        <div className="font-bold text-on-surface text-xs">Noida Sector 62</div>
                        <div className="font-label-caps text-[9px] text-on-surface-variant font-medium tracking-wide uppercase">8,450 Impact Score</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-on-surface-variant" />
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Philosophy Banner */}
          <div className="rounded-xl overflow-hidden relative h-32 flex items-center justify-center border border-outline-variant/30 shadow-sm mt-8">
            <div className="absolute inset-0 bg-surface-container-high mix-blend-multiply opacity-50"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-surface z-10"></div>
            <img 
              alt="Contextual Background of students" 
              className="w-full h-full object-cover opacity-20 grayscale" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLukxSxkjFXI82LaS9j-1jqcVY5HRV0X_gG_rcvLxmEN6usgpxXYYgWnadd_hunueQTaq9tHR3uKHIQYF2JVnHqNxC3-keraqXJ0VNc2XoAwKhH19AAzb9dctrgEIUE45Cu0CLYW7eiAriSWWBMuhB9IqOPxRtYdNkzYUfd3G0VGfu9Ox1KVp0GO0-aA8JQaYTwq1RIFSrgY6vhnFZsEyLdRglwQy4DalDEX7MWQaisklSUKsW3Isgjq8Lc"
            />
            <div className="relative z-20 flex flex-col items-center text-center px-4">
              <p className="font-headline-md text-xl md:text-2xl text-on-surface font-bold">"Every data point is a life uplifted."</p>
              <p className="font-label-caps text-xs text-on-surface-variant mt-2 tracking-wide uppercase">Naye Pankh Foundation Core Philosophy</p>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB CONTENT: FAQS (Existing chatbot configurations) --- */}
      {activeTab === 'faqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Add FAQ Form (Span 5) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-outline-variant/35 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-fit">
            <h3 className="text-lg font-bold font-headline-md text-on-surface mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-4">
              <Plus size={18} className="text-primary" />
              Add Chatbot FAQ
            </h3>

            {faqError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs mb-4">
                <AlertCircle size={14} className="shrink-0" />
                <span>{faqError}</span>
              </div>
            )}
            
            {faqSuccess && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg text-xs mb-4">
                <CheckCircle size={14} className="shrink-0" />
                <span>FAQ saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleCreateFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Question</label>
                <input
                  type="text"
                  placeholder="e.g., How do I contact support?"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="block w-full px-3.5 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary text-sm outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Answer</label>
                <textarea
                  placeholder="e.g., You can reach us at contact@nayepankh.org"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  className="block w-full px-3.5 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary text-sm outline-none transition-all"
                  rows={4}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Category</label>
                <select
                  value={newFaq.category}
                  onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary text-sm outline-none transition-all cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Registration">Registration</option>
                  <option value="Account">Account</option>
                  <option value="Events">Events</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary hover:bg-surface-tint text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm active:scale-95 duration-150 cursor-pointer"
              >
                Add FAQ Entry
              </button>
            </form>
          </div>

          {/* FAQs List (Span 7) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-outline-variant/35 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
            <h3 className="text-lg font-bold font-headline-md text-on-surface mb-6 border-b border-outline-variant/20 pb-4">
              Existing Chatbot FAQs ({faqs.length})
            </h3>
            
            {loadingFaqs ? (
              <div className="p-8 text-center text-on-surface-variant animate-pulse font-medium">Loading FAQs...</div>
            ) : faqs.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-medium">No FAQs configured yet.</div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border border-outline-variant/25 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors relative group">
                    <div className="absolute right-4 top-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingFaq({ ...faq })}
                        className="text-primary hover:text-primary/80 bg-white border border-outline-variant/20 p-1.5 rounded-md cursor-pointer shadow-sm"
                        title="Edit FAQ"
                      >
                        <FileText size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="text-red-500 hover:text-red-700 bg-white border border-outline-variant/20 p-1.5 rounded-md cursor-pointer shadow-sm"
                        title="Delete FAQ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <span className="text-[9px] font-bold text-primary tracking-wider uppercase bg-green-50 px-2 py-0.5 rounded-full">
                      {faq.category}
                    </span>
                    <h5 className="font-semibold text-sm text-on-surface mt-2 pr-10">
                      {faq.question}
                    </h5>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FAQ EDIT MODAL --- */}
      {editingFaq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full relative border border-outline-variant/40 animate-fade-in shadow-2xl">
            <button
              onClick={() => setEditingFaq(null)}
              className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold font-headline-md text-on-surface mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-4">
              <FileText size={22} className="text-primary" />
              Edit FAQ Entry
            </h3>

            <form onSubmit={handleUpdateFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Question</label>
                <input
                  type="text"
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="block w-full px-3.5 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary text-sm outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Answer</label>
                <textarea
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="block w-full px-3.5 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary text-sm outline-none transition-all"
                  rows={4}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Category</label>
                <select
                  value={editingFaq.category || 'General'}
                  onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-outline rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary text-sm outline-none transition-all cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Registration">Registration</option>
                  <option value="Account">Account</option>
                  <option value="Events">Events</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="flex-1 py-2.5 px-4 border border-outline rounded-lg text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-surface-tint text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm active:scale-95 duration-150 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VOLUNTEER DETAIL MODAL --- */}
      {selectedVolunteer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full relative border border-outline-variant/40 animate-fade-in shadow-2xl">
            <button
              onClick={() => setSelectedVolunteer(null)}
              className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold font-headline-md text-on-surface mb-6 flex items-center gap-2 border-b border-outline-variant/20 pb-4">
              <Users size={22} className="text-primary" />
              Volunteer Information
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-3">
                <span className="text-on-surface-variant font-medium">Full Name:</span>
                <span className="col-span-2 font-bold text-on-surface">{selectedVolunteer.name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-on-surface-variant font-medium">Email:</span>
                <span className="col-span-2 font-medium text-on-surface">{selectedVolunteer.email}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-on-surface-variant font-medium">Phone:</span>
                <span className="col-span-2 text-on-surface">{selectedVolunteer.phone || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-on-surface-variant font-medium">Age:</span>
                <span className="col-span-2 text-on-surface">{selectedVolunteer.age || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-on-surface-variant font-medium">City:</span>
                <span className="col-span-2 text-on-surface">{selectedVolunteer.city || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-on-surface-variant font-medium">Availability:</span>
                <span className="col-span-2 text-primary font-bold">{selectedVolunteer.availability || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-on-surface-variant font-medium">Registered:</span>
                <span className="col-span-2 text-on-surface">{new Date(selectedVolunteer.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="border-t border-outline-variant/30 pt-4 mt-4">
                <span className="block text-xs font-semibold text-on-surface-variant mb-2">
                  Skills &amp; Interests:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVolunteer.skills ? selectedVolunteer.skills.split(',').map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-green-50 border border-green-200 text-primary"
                    >
                      {skill.trim()}
                    </span>
                  )) : (
                    <span className="text-xs text-on-surface-variant italic">No skills listed.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 border-t border-outline-variant/20 pt-4">
              <button 
                onClick={() => setSelectedVolunteer(null)} 
                className="btn-secondary px-4 py-2 text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDeleteVolunteer(selectedVolunteer.id)}
                className="btn-danger px-4 py-2 text-sm font-semibold cursor-pointer"
              >
                Delete Volunteer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: REPORTS --- */}
      {activeTab === 'reports' && (
        <div className="space-y-8 animate-fade-in">

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-headline-md text-on-surface">Generate Reports</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">Export volunteer data and platform analytics as CSV or printable PDF.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/50 font-medium">
                Live data · {summary.total} volunteers
              </span>
            </div>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Report 1: Volunteers CSV */}
            <div className="bg-white rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6 flex flex-col group hover:shadow-md hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <FileSpreadsheet size={22} className="text-primary" />
              </div>
              <h3 className="font-headline-md text-base font-bold text-on-surface mb-2">Volunteer Registry</h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed flex-grow">
                Full list of all registered volunteers including name, email, city, skills, availability, role and registration date.
              </p>
              <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                <span>Format</span><span className="font-bold text-on-surface">.CSV</span>
              </div>
              <div className="flex items-center justify-between mb-4 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                <span>Records</span><span className="font-bold text-primary">{summary.total} volunteers</span>
              </div>
              <button
                onClick={handleDownloadVolunteersCSV}
                disabled={reportGenerating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-opacity-90 transition-all text-sm cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Download size={15} />
                {reportGenerating ? 'Generating...' : 'Download CSV'}
              </button>
            </div>

            {/* Report 2: Analytics CSV */}
            <div className="bg-white rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6 flex flex-col group hover:shadow-md hover:border-blue-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <TrendingUp size={22} className="text-blue-700" />
              </div>
              <h3 className="font-headline-md text-base font-bold text-on-surface mb-2">Analytics Summary</h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed flex-grow">
                Platform analytics: signups over time, volunteers by city, skills distribution, and age-band breakdown in a structured CSV.
              </p>
              <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                <span>Format</span><span className="font-bold text-on-surface">.CSV</span>
              </div>
              <div className="flex items-center justify-between mb-4 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                <span>Sections</span><span className="font-bold text-blue-700">Summary + Trends</span>
              </div>
              <button
                onClick={handleDownloadAnalyticsCSV}
                disabled={reportGenerating}
                className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-800 transition-all text-sm cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Download size={15} />
                {reportGenerating ? 'Generating...' : 'Download Analytics CSV'}
              </button>
            </div>

            {/* Report 3: Full Print Report */}
            <div className="bg-white rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-6 flex flex-col group hover:shadow-md hover:border-yellow-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center mb-4 group-hover:bg-yellow-100 transition-colors">
                <Printer size={22} className="text-yellow-700" />
              </div>
              <h3 className="font-headline-md text-base font-bold text-on-surface mb-2">Full NGO Report</h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed flex-grow">
                Opens a formatted, print-ready report with KPI summary, city breakdown, skill analysis, age groups, and the complete volunteer registry.
              </p>
              <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                <span>Format</span><span className="font-bold text-on-surface">Print / PDF</span>
              </div>
              <div className="flex items-center justify-between mb-4 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
                <span>Includes</span><span className="font-bold text-yellow-700">All Sections</span>
              </div>
              <button
                onClick={handlePrintReport}
                disabled={reportGenerating}
                className="w-full flex items-center justify-center gap-2 bg-yellow-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-yellow-700 transition-all text-sm cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Printer size={15} />
                {reportGenerating ? 'Generating...' : 'Open & Print Report'}
              </button>
            </div>
          </div>

          {/* Live Data Preview */}
          <div className="bg-white rounded-xl border border-outline-variant/35 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-5 border-b border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                  <Layers size={16} className="text-primary" />
                  Live Data Preview
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Real-time snapshot from the database — this is what gets exported.</p>
              </div>
              <button
                onClick={() => { fetchVolunteers(); fetchAnalytics(); }}
                className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-outline-variant/20">
              <div className="p-5 text-center">
                <p className="text-2xl font-bold text-primary">{summary.total}</p>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">Total Volunteers</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-2xl font-bold text-blue-700">{summary.newThisWeek}</p>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">New This Week</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-2xl font-bold text-yellow-700">{summary.newThisMonth}</p>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">New This Month</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-2xl font-bold text-emerald-600">{trends.byCity.length}</p>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">Cities Covered</p>
              </div>
            </div>

            {/* City + Skill breakdown side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-variant/20">
              {/* By City */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPinned size={13} className="text-primary" /> Volunteers by City
                </h4>
                <div className="space-y-2">
                  {trends.byCity.slice(0, 6).map((c) => (
                    <div key={c.city} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-on-surface w-24 truncate">{c.city}</span>
                      <div className="flex-1 bg-surface-container rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.round((c.count / summary.total) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary w-6 text-right">{c.count}</span>
                    </div>
                  ))}
                  {trends.byCity.length === 0 && <p className="text-xs text-on-surface-variant">No city data yet.</p>}
                </div>
              </div>

              {/* By Skill */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award size={13} className="text-blue-700" /> Volunteers by Skill
                </h4>
                <div className="space-y-2">
                  {trends.bySkill.slice(0, 6).map((sk) => (
                    <div key={sk.skill} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-on-surface w-32 truncate">{sk.skill}</span>
                      <div className="flex-1 bg-surface-container rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${Math.round((sk.count / summary.total) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-blue-700 w-6 text-right">{sk.count}</span>
                    </div>
                  ))}
                  {trends.bySkill.length === 0 && <p className="text-xs text-on-surface-variant">No skill data yet.</p>}
                </div>
              </div>
            </div>

            {/* Recent 5 Volunteers Preview */}
            <div className="border-t border-outline-variant/20">
              <div className="p-4 bg-surface-container-low/30">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Recent Volunteers (preview — first 5 of {volunteers.length})</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px] text-sm">
                  <thead>
                    <tr className="bg-surface-container-low/60 text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider border-b border-outline-variant/20">
                      <th className="py-3 px-5">Name</th>
                      <th className="py-3 px-5">Email</th>
                      <th className="py-3 px-5">City</th>
                      <th className="py-3 px-5">Skills</th>
                      <th className="py-3 px-5">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.slice(0, 5).map(v => (
                      <tr key={v.id} className="border-b border-outline-variant/10 hover:bg-surface/40">
                        <td className="py-3 px-5 font-semibold text-on-surface">{v.name}</td>
                        <td className="py-3 px-5 text-on-surface-variant">{v.email}</td>
                        <td className="py-3 px-5">{v.city || '—'}</td>
                        <td className="py-3 px-5 text-xs text-on-surface-variant max-w-[160px] truncate">{v.skills || '—'}</td>
                        <td className="py-3 px-5 text-on-surface-variant">{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
