import React, { useState, memo, useMemo } from 'react';

const COLLEGES = [
  { name: "ALL", acronym: "ALL" },
  { name: "College of Accountancy", acronym: "COA" },
  { name: "College of Arts and Science", acronym: "CAS" },
  { name: "College of Business Administration", acronym: "CBA" },
  { name: "College of Communication", acronym: "COC" },
  { name: "College of Engineering and Architecture", acronym: "CEA" },
  { name: "College of Education", acronym: "COE" },
  { name: "College of Informatics and Computing Studies", acronym: "CICS" },
  { name: "College of Medical Technology", acronym: "CMT" },
  { name: "College of Nursing", acronym: "CON" }
];

export const StatisticsView = memo(({ moas = [] }) => {
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');


  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue.toDate === 'function') return dateValue.toDate();
    if (dateValue.seconds) return new Date(dateValue.seconds * 1000);
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredMoas = useMemo(() => moas.filter(moa => {
    if (!moa || moa.isDeleted) return false;
    const collegeMatch = selectedCollege === 'ALL' || String(moa.college || '').includes(selectedCollege);
    
    let dateMatch = true;
    if (startDate) {
      const start = new Date(startDate);
      const effectiveDate = parseDate(moa.effectiveDate);
      if (effectiveDate) dateMatch = dateMatch && effectiveDate >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      const expiryDate = parseDate(moa.expiryDate);
      if (expiryDate) dateMatch = dateMatch && expiryDate <= end;
    }
    
    return collegeMatch && dateMatch;
  }), [moas, selectedCollege, startDate, endDate]);

  const stats = useMemo(() => {
    return filteredMoas.reduce((acc, moa) => {
      const status = String(moa.status || '');
      if (status.includes('APPROVED')) acc.active++;
      else if (status.includes('PROCESSING')) acc.pending++;
      else if (status.includes('EXPIRED')) acc.expired++;
      else if (status.includes('EXPIRING')) acc.expiring++;
      
      acc.total++;
      return acc;
    }, { active: 0, pending: 0, expired: 0, expiring: 0, total: 0 });
  }, [filteredMoas]);

  return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
          {/* Filters */}
          <div className="bg-white/80 rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-slate-400 !text-xl">tune</span>
              <p className="text-slate-900 font-bold tracking-tight text-base">Dashboard Filters</p>
            </div>
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
                onClick={() => { setSelectedCollege('ALL'); setStartDate(''); setEndDate(''); }}
                className="col-span-full sm:col-span-1 lg:col-span-1 h-[52px] self-end px-4 flex items-center justify-center gap-2 bg-white border border-black/5 hover:bg-slate-50 hover:text-maroon hover:border-maroon/20 hover:shadow-md hover:-translate-y-0.5 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 active:translate-y-0 group"
              >
                <span className="material-symbols-outlined !text-lg group-hover:-rotate-180 transition-transform duration-500">restart_alt</span>
                Reset Filters
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <StatCard 
              icon="verified"
              label="Active"
              value={stats.active}
              color="text-green-600"
              bgColor="bg-green-100/50"
            />
            <StatCard
              icon="schedule"
              label="Processing"
              value={stats.pending}
              color="text-blue-600"
              bgColor="bg-blue-100/50"
            />
            <StatCard
              icon="event_busy"
              label="Expired"
              value={stats.expired}
              color="text-red-600"
              bgColor="bg-red-100/50"
            />
            <StatCard
              icon="hourglass_bottom"
              label="Expiring"
              value={stats.expiring}
              color="text-orange-600"
              bgColor="bg-orange-100/50"
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <div className="bg-gradient-to-br from-maroon to-red-700 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(128,0,0,0.2)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <p className="text-white/80 font-bold text-[11px] uppercase tracking-wider mb-3">Total MOAs</p>
                <p className="text-5xl font-black tracking-tight text-white mb-4">{stats.total}</p>
                <p className="text-[11px] font-medium text-white/80 pt-4 border-t border-white/10 flex items-center gap-1.5"><span className="material-symbols-outlined !text-[14px]">public</span> Across all categories</p>
              </div>
              <span className="material-symbols-outlined absolute top-6 right-6 text-white/20 !text-6xl group-hover:rotate-12 transition-transform duration-500">folder_copy</span>
            </div>
            
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-green-600 !text-2xl">trending_up</span>
              </div>
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-green-600 mb-2 drop-shadow-sm transition-transform">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</p>
              <p className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Active Rate</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-blue-600 !text-2xl">sync</span>
              </div>
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-blue-600 mb-2 drop-shadow-sm transition-transform">{stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%</p>
              <p className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Processing Rate</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center items-center text-center hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-red-600 !text-2xl">trending_down</span>
              </div>
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-red-600 mb-2 drop-shadow-sm transition-transform">{stats.total > 0 ? Math.round((stats.expired / stats.total) * 100) : 0}%</p>
              <p className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Expired Rate</p>
            </div>
          </div>

          {/* College Breakdown */}
          <div className="bg-white/80 rounded-3xl p-6 sm:p-8 lg:p-10 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-maroon/10 flex items-center justify-center text-maroon shadow-sm">
                <span className="material-symbols-outlined !text-xl">pie_chart</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Agreements by College</h3>
            </div>
            <div className="space-y-3">
              {COLLEGES.filter(c => c.name !== 'ALL').map((collegeObj, index) => {
                const collegeCount = moas.filter(m => m && String(m.college || '').includes(collegeObj.name) && !m.isDeleted).length;
                const collegePercentage = stats.total > 0 ? Math.round((collegeCount / stats.total) * 100) : 0;
                return (
                  <div 
                    key={collegeObj.name}
                    className="animate-in fade-in duration-500 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-600 text-xs sm:text-sm group-hover:text-slate-900 transition-colors">{collegeObj.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400">{collegePercentage}%</span>
                        <span className="font-black text-maroon text-sm w-6 text-right">{collegeCount}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-maroon to-red-500 h-full transition-all duration-1000 ease-out rounded-full relative"
                        style={{ width: `${collegePercentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
  );
});

const StatCard = memo(({ icon, label, value, color, bgColor }) => (
  <div className={`bg-white/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out group overflow-hidden relative flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2`}>
    <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${bgColor} blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-slate-500 font-bold text-[11px] uppercase tracking-wider mb-3">{label}</p>
        <p className={`text-5xl font-black tracking-tight ${color}`}>{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center transition-transform duration-500 ease-out group-hover:rotate-12 group-hover:scale-110 shadow-sm shrink-0`}><span className={`material-symbols-outlined !text-3xl ${color}`}>{icon}</span></div>
    </div>
  </div>
));

const FilterSelect = memo(({ label, value, onChange, options }) => (
  <div className="relative group">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
        {options.map(o => <option key={o.acronym} value={o.name}>{o.name}</option>)}
      </select>
      <div className="w-full p-3.5 bg-gradient-to-r from-maroon to-red-700 rounded-xl shadow-sm font-bold text-white flex items-center justify-between group-hover:-translate-y-0.5 group-hover:shadow-md transition-all group-focus-within:ring-4 group-focus-within:ring-red-500/30">
        <span className="truncate pr-2">{options.find(o => o.name === value)?.acronym || 'ALL'}</span>
        <span className="material-symbols-outlined !text-lg text-white/80">arrow_drop_down</span>
      </div>
    </div>
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
