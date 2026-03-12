import { useState, useEffect, memo } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { subscribeToMOAs } from '../services/moaService';

const COLLEGES = ['All', 'CICS', 'CBA', 'COE', 'CAS', 'CED'];

export const StatisticsDashboard = ({ user }) => {
  const [moas, setMoas] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMOAs(docs => {
      setMoas(docs.filter(moa => !moa.isDeleted));
    });
    return unsubscribe;
  }, []);

  const filteredMoas = moas.filter(moa => {
    const collegeMatch = selectedCollege === 'All' || moa.college === selectedCollege;
    
    let dateMatch = true;
    if (startDate) {
      const start = new Date(startDate);
      const effectiveDate = moa.effectiveDate ? new Date(moa.effectiveDate) : null;
      if (effectiveDate) dateMatch = dateMatch && effectiveDate >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      const expiryDate = moa.expiryDate ? new Date(moa.expiryDate) : null;
      if (expiryDate) dateMatch = dateMatch && expiryDate <= end;
    }
    
    return collegeMatch && dateMatch;
  });

  const stats = {
    active: filteredMoas.filter(m => m.status?.includes('APPROVED')).length,
    processing: filteredMoas.filter(m => m.status?.includes('PROCESSING')).length,
    expired: filteredMoas.filter(m => m.status?.includes('EXPIRED')).length,
    expiring: filteredMoas.filter(m => m.status?.includes('EXPIRING')).length,
    total: filteredMoas.length
  };

  const StatCard = memo(({ icon, label, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-3xl p-6 sm:p-8 border-2 border-slate-100 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-500 font-black text-xs sm:text-sm uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-3xl sm:text-5xl font-black ${color}`}>{value}</p>
        </div>
        <span className={`material-symbols-outlined !text-3xl sm:!text-4xl ${color}`}>{icon}</span>
      </div>
      <p className="text-[10px] sm:text-xs text-slate-400 font-bold">Total MOAs: {stats.total}</p>
    </div>
  ));

  return (
    <div className="flex h-screen bg-pattern font-display overflow-hidden flex-col lg:flex-row">
      {/* Header */}
      <div className="w-full bg-white/90 backdrop-blur-md border-b border-maroon/10 px-6 sm:px-8 py-5 sm:py-6 lg:hidden flex items-center justify-between shrink-0">
        <h1 className="font-black text-lg sm:text-2xl text-slate-900">Statistics</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined">menu</span></button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 lg:hidden">
          <div className="bg-white rounded-2xl p-6 m-4 w-full max-w-xs shadow-2xl">
            <nav className="space-y-3">
              <div className="px-4 py-3 rounded-2xl bg-maroon text-white font-black text-left flex items-center gap-3">
                <span className="material-symbols-outlined">bar_chart</span> Statistics
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white/90 backdrop-blur-md border-r border-maroon/10 p-8 flex-col shrink-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-maroon rounded-xl text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined">school</span></div>
          <div>
            <h1 className="font-black text-xl text-slate-900">Portal</h1>
            <p className="text-[9px] font-black text-maroon uppercase tracking-widest opacity-60">STATISTICS</p>
          </div>
        </div>
        <nav className="space-y-3 flex-grow">
          <div className="px-4 py-3 rounded-2xl bg-maroon text-white font-black flex items-center gap-3 shadow-xl shadow-maroon/20">
            <span className="material-symbols-outlined">bar_chart</span> Analytics
          </div>
        </nav>
        <div className="text-xs text-slate-600 font-bold mb-4">{user?.email}</div>
        <button onClick={() => signOut(auth)} className="p-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:text-maroon active:scale-95 flex items-center gap-3 transition-all duration-300 w-full justify-center"><span className="material-symbols-outlined">logout</span> Sign Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filters */}
          <div className="bg-white/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-sm border border-slate-100 shadow-lg shadow-maroon/5">
            <p className="text-slate-600 font-black text-sm mb-4">Filters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterSelect 
                label="College" 
                value={selectedCollege} 
                onChange={setSelectedCollege}
                options={COLLEGES}
              />
              <FilterInput
                label="Start Date"
                type="date"
                value={startDate}
                onChange={setStartDate}
              />
              <FilterInput
                label="End Date"
                type="date"
                value={endDate}
                onChange={setEndDate}
              />
              <button 
                onClick={() => { setSelectedCollege('All'); setStartDate(''); setEndDate(''); }}
                className="col-span-full sm:col-span-1 lg:col-span-1 h-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-sm transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
              icon="verified"
              label="Active MOAs"
              value={stats.active}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <StatCard
              icon="schedule"
              label="Processing MOAs"
              value={stats.processing}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              icon="event_busy"
              label="Expired MOAs"
              value={stats.expired}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <StatCard
              icon="schedule_close"
              label="Expiring Soon"
              value={stats.expiring}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
          </div>

          {/* Summary Card */}
          <div className="bg-white/50 rounded-3xl p-8 backdrop-blur-sm border border-slate-100 shadow-lg shadow-maroon/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="animate-in fade-in duration-500">
                <p className="text-4xl font-black text-maroon mb-2">{stats.total}</p>
                <p className="text-slate-600 font-bold text-sm uppercase tracking-widest">Total Agreements</p>
              </div>
              <div className="animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
                <p className="text-4xl font-black text-green-600 mb-2">{Math.round((stats.active / stats.total) * 100) || 0}%</p>
                <p className="text-slate-600 font-bold text-sm uppercase tracking-widest">Active Rate</p>
              </div>
              <div className="animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
                <p className="text-4xl font-black text-blue-600 mb-2">{Math.round((stats.processing / stats.total) * 100) || 0}%</p>
                <p className="text-slate-600 font-bold text-sm uppercase tracking-widest">Processing Rate</p>
              </div>
              <div className="animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
                <p className="text-4xl font-black text-red-600 mb-2">{Math.round((stats.expired / stats.total) * 100) || 0}%</p>
                <p className="text-slate-600 font-bold text-sm uppercase tracking-widest">Expired Rate</p>
              </div>
            </div>
          </div>

          {/* College Breakdown */}
          <div className="bg-white/50 rounded-3xl p-8 backdrop-blur-sm border border-slate-100 shadow-lg shadow-maroon/5">
            <h3 className="text-xl font-black text-slate-900 mb-6">Agreements by College</h3>
            <div className="space-y-3">
              {COLLEGES.filter(c => c !== 'All').map((college, index) => {
                const collegeCount = moas.filter(m => m.college === college && !m.isDeleted).length;
                const collegePercentage = stats.total > 0 ? Math.round((collegeCount / stats.total) * 100) : 0;
                return (
                  <div 
                    key={college}
                    className="animate-in fade-in duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-700">{college}</span>
                      <span className="font-black text-maroon">{collegeCount}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-maroon h-full transition-all duration-700"
                        style={{ width: `${collegePercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const FilterSelect = memo(({ label, value, onChange, options }) => (
  <div className="text-left">
    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">{label}</label>
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold text-slate-700 text-sm border border-transparent focus:border-maroon/20"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
));

const FilterInput = memo(({ label, type, value, onChange }) => (
  <div className="text-left">
    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold text-slate-700 text-sm border border-transparent focus:border-maroon/20"
    />
  </div>
));
