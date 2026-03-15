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
    active: filteredMoas.filter(m => String(m.status || '').includes('APPROVED')).length,
    pending: filteredMoas.filter(m => String(m.status || '').includes('PENDING')).length,
    expired: filteredMoas.filter(m => String(m.status || '').includes('EXPIRED')).length,
    expiring: filteredMoas.filter(m => String(m.status || '').includes('EXPIRING')).length,
    total: filteredMoas.length
  };

  const StatCard = memo(({ icon, label, value, color, bgColor }) => (
    <div className={`bg-white/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:bg-white/90 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl sm:text-5xl font-bold tracking-tight ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgColor} flex items-center justify-center`}><span className={`material-symbols-outlined !text-3xl ${color}`}>{icon}</span></div>
      </div>
      <p className="text-[11px] text-slate-500 font-bold">Total MOAs: {stats.total}</p>
    </div>
  ));

  return (
    <div className="flex h-screen bg-pattern font-sans antialiased overflow-hidden flex-col lg:flex-row">
      {/* Header */}
      <div className="w-full bg-white/70 backdrop-blur-2xl border-b border-black/5 px-6 sm:px-8 py-4 sm:py-5 lg:hidden flex items-center justify-between shrink-0 z-20 sticky top-0 transition-all">
        <h1 className="font-bold tracking-tight text-lg text-slate-900">Statistics</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white border border-black/5 rounded-xl shadow-sm active:scale-95 transition-all"><span className="material-symbols-outlined text-slate-700">menu</span></button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 lg:hidden">
          <div className="bg-white/90 backdrop-blur-3xl border border-black/5 rounded-3xl p-6 m-4 w-full max-w-xs shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-4 duration-300">
            <nav className="space-y-3">
              <div className="px-4 py-3 rounded-xl bg-maroon text-white font-bold text-left flex items-center gap-3 shadow-sm">
                <span className="material-symbols-outlined !text-xl">bar_chart</span> Statistics
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white/70 backdrop-blur-2xl border-r border-black/5 p-8 flex-col shrink-0 z-10 transition-all lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-maroon rounded-xl text-white flex items-center justify-center shadow-sm"><span className="material-symbols-outlined !text-xl">school</span></div>
          <div>
            <h1 className="font-bold tracking-tight text-xl text-slate-900">Portal</h1>
            <p className="text-[10px] font-bold text-maroon uppercase tracking-wider">STATISTICS</p>
          </div>
        </div>
        <nav className="space-y-3 flex-grow">
        <div className="px-4 py-3 rounded-xl bg-maroon text-white font-bold flex items-center gap-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all duration-300">
          <span className="material-symbols-outlined !text-xl animate-pulse">bar_chart</span> Analytics
          </div>
        </nav>
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3 px-2">Account</div>
        <div className="text-sm text-slate-800 font-bold mb-4 px-2 truncate">{user?.email}</div>
      <button onClick={() => signOut(auth)} className="p-3 bg-black/5 hover:bg-black/10 hover:shadow-sm hover:-translate-y-0.5 rounded-xl font-bold text-slate-700 active:scale-95 flex items-center justify-center gap-2 transition-all duration-300 w-full"><span className="material-symbols-outlined !text-lg">logout</span> Sign Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Filters */}
          <div className="bg-white/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-2xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all">
            <p className="text-slate-900 font-bold tracking-tight text-base mb-4">Filters</p>
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
                className="col-span-full sm:col-span-1 lg:col-span-1 h-[52px] self-end px-4 flex items-center justify-center gap-2 bg-white border border-black/5 hover:bg-slate-50 hover:text-maroon hover:shadow-md hover:-translate-y-0.5 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 active:translate-y-0 group"
              >
                <span className="material-symbols-outlined !text-lg group-hover:-rotate-180 transition-transform duration-500">restart_alt</span>
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
              color="text-green-700"
              bgColor="bg-green-100/50"
            />
            <StatCard
              icon="schedule"
              label="Pending MOAs"
              value={stats.pending}
              color="text-blue-700"
              bgColor="bg-blue-100/50"
            />
            <StatCard
              icon="event_busy"
              label="Expired MOAs"
              value={stats.expired}
              color="text-red-700"
              bgColor="bg-red-100/50"
            />
            <StatCard
              icon="schedule_close"
              label="Expiring Soon"
              value={stats.expiring}
              color="text-orange-700"
              bgColor="bg-orange-100/50"
            />
          </div>

          {/* Summary Card */}
          <div className="bg-white/70 rounded-3xl p-8 backdrop-blur-2xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="animate-in fade-in duration-500">
                <p className="text-4xl font-bold tracking-tight text-maroon mb-2">{stats.total}</p>
                <p className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">Total Agreements</p>
              </div>
              <div className="animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
                <p className="text-4xl font-bold tracking-tight text-green-700 mb-2">{Math.round((stats.active / stats.total) * 100) || 0}%</p>
                <p className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">Active Rate</p>
              </div>
              <div className="animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
                <p className="text-4xl font-bold tracking-tight text-blue-700 mb-2">{Math.round((stats.pending / stats.total) * 100) || 0}%</p>
                <p className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">Pending Rate</p>
              </div>
              <div className="animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
                <p className="text-4xl font-bold tracking-tight text-red-700 mb-2">{Math.round((stats.expired / stats.total) * 100) || 0}%</p>
                <p className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">Expired Rate</p>
              </div>
            </div>
          </div>

          {/* College Breakdown */}
          <div className="bg-white/70 rounded-3xl p-8 backdrop-blur-2xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-6">Agreements by College</h3>
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
                      <span className="font-bold text-maroon">{collegeCount}</span>
                    </div>
                    <div className="w-full bg-black/5 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-maroon h-full transition-all duration-700 ease-out rounded-full"
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
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl outline-none font-bold text-slate-800 text-sm focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 transition-all appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
));

const FilterInput = memo(({ label, type, value, onChange }) => (
  <div className="text-left">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl outline-none font-bold text-slate-800 text-sm focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 transition-all placeholder:text-slate-400"
    />
  </div>
));
