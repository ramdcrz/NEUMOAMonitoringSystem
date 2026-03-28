import { useState, useEffect, memo, useMemo } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { subscribeToMOAs } from '../services/moaService';

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

export const StudentDashboard = ({ user }) => {
  const [moas, setMoas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMoa, setSelectedMoa] = useState(null);
  const [filterCollege, setFilterCollege] = useState('ALL');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMOAs(docs => {
      // Filter to show only APPROVED and non-deleted MOAs
      const approvedMoas = docs.filter(moa => String(moa.status || '').includes('APPROVED') && !moa.isDeleted);
      setMoas(approvedMoas);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredMoas = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const safeString = (str) => String(str || '').toLowerCase();

    return moas.filter(moa => {
      if (!moa) return false;
      
      const matchesSearch = !query || 
        safeString(moa.companyName).includes(query) ||
        safeString(moa.contactPerson).includes(query) ||
        safeString(moa.address).includes(query) ||
        safeString(moa.industry).includes(query) ||
        safeString(moa.status).includes(query) ||
        safeString(moa.college).includes(query);
                            
      const matchesCollege = filterCollege === 'ALL' || 
        safeString(moa.college).includes(filterCollege.toLowerCase()) || 
        String(moa.college || '').includes(COLLEGES.find(c => c.name === filterCollege)?.acronym);
      
      return matchesSearch && matchesCollege;
    }).sort((a, b) => String(a.companyName || '').localeCompare(String(b.companyName || '')));
  }, [moas, searchTerm, filterCollege]);

  return (
    <div className="flex min-h-screen bg-pattern antialiased flex-col lg:flex-row relative">

      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-maroon/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-blue-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
      </div>

      {/* Sidebar - Hidden on mobile, shown on lg+ */}
      <aside className="hidden lg:flex w-72 bg-white/70 backdrop-blur-2xl border-r border-black/5 p-6 sm:p-8 flex-col shrink-0 z-10 transition-all lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-maroon rounded-xl text-white flex items-center justify-center shadow-sm flex-shrink-0"><span className="material-symbols-outlined !text-xl">school</span></div>
          <div className="min-w-0">
            <h1 className="font-bold tracking-tight text-lg sm:text-xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight truncate">Portal</h1>
            <p className="text-[10px] font-bold text-maroon uppercase tracking-wider truncate">STUDENT</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarBtn active={true} icon="dashboard" label="Agreements" onClick={() => {}} />
        </nav>
        <div className="mt-auto pt-6 w-full border-t border-black/5">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=800000&color=fff`} alt="Profile" className="w-10 h-10 rounded-full shadow-sm object-cover bg-white p-[2px] border border-slate-200" referrerPolicy="no-referrer" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-900 truncate">{user?.displayName || user?.email?.split('@')[0]}</span>
              <span className="text-[10px] font-medium text-slate-500 truncate">{user?.email}</span>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="p-3 bg-black/5 hover:bg-black/10 rounded-xl font-bold text-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 w-full"><span className="material-symbols-outlined !text-lg">logout</span> <span className="hidden sm:inline">Sign Out</span></button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-black/5 p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-4 flex flex-row justify-between items-center gap-4 sm:gap-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-white/50 hover:bg-white text-slate-800 rounded-xl border border-black/5 shadow-sm transition-all active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">Agreements</h2>
          </div>
        </header>

        <section className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {/* Search Bar */}
          <div className="bg-white/70 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-2xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500">
            <div className="flex flex-row gap-2 sm:gap-3 w-full animate-in fade-in duration-500">
              <div className="relative flex-1 flex items-center gap-2 px-3 sm:px-4 py-3 bg-black/[0.03] border border-transparent rounded-xl sm:rounded-2xl focus-within:bg-white focus-within:ring-4 focus-within:ring-maroon/10 focus-within:border-maroon/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group">
                <span className="material-symbols-outlined text-slate-400 !text-xl shrink-0 group-focus-within:text-maroon transition-colors">search</span>
                <input type="text" placeholder="Search partner institutions..." className="w-full bg-transparent outline-none font-bold text-sm sm:text-base text-slate-900 placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-maroon transition-colors shrink-0 flex items-center justify-center hover:scale-110 active:scale-95">
                    <span className="material-symbols-outlined !text-lg">close</span>
                  </button>
                )}
              </div>
              <div className="relative w-24 sm:w-32 shrink-0 group">
                <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                  {COLLEGES.map(c => <option key={c.acronym} value={c.name}>{c.name}</option>)}
                </select>
                <div className="w-full h-full px-2 sm:px-3 bg-gradient-to-r from-maroon to-red-700 rounded-xl sm:rounded-2xl shadow-sm font-bold text-white flex items-center justify-center gap-1 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all group-focus-within:ring-4 group-focus-within:ring-red-500/30">
                  <span className="truncate text-xs sm:text-sm">{COLLEGES.find(c => c.name === filterCollege)?.acronym || 'ALL'}</span>
                  <span className="material-symbols-outlined !text-lg text-white/80 shrink-0">arrow_drop_down</span>
                </div>
              </div>
            </div>
          </div>

          {/* MOAs Grid/Table */}
          {!loading && filteredMoas.length > 0 ? (
            <div className="bg-white/70 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all flex flex-col">
              {/* Mobile View: Cards */}
              <div className="sm:hidden divide-y divide-black/5 overflow-y-auto max-h-[65vh] custom-scrollbar">
                {filteredMoas.map((moa, index) => (
                  <div
                    key={moa.id}
                    onClick={() => setSelectedMoa(moa)}
                    className="p-5 hover:bg-black/[0.02] transition-colors animate-in fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="font-bold tracking-tight text-slate-800 mb-1 line-clamp-1">{moa.companyName}</div>
                    <div className="text-xs text-slate-600 mb-1 line-clamp-1">{moa.address || 'N/A'}</div>
                    <div className="text-xs text-slate-600 mb-1">{moa.contactPerson || 'N/A'}</div>
                    <div className="text-xs text-blue-600 hover:underline">{moa.contactEmail || 'N/A'}</div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
                  <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
                    <tr>
                      <th className="p-4 sm:p-6">Company Name</th>
                      <th className="p-4 sm:p-6">Address</th>
                      <th className="p-4 sm:p-6 hidden sm:table-cell">Contact Person</th>
                      <th className="p-4 sm:p-6 hidden lg:table-cell">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filteredMoas.map((moa, index) => (
                      <tr
                        key={moa.id}
                        className="hover:bg-white/60 hover:shadow-sm transition-all duration-300 font-bold animate-in fade-in cursor-pointer group"
                        onClick={() => setSelectedMoa(moa)}
                        style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                      >
                        <td className="p-4 sm:p-6"><div className="font-bold tracking-tight text-slate-900 text-sm group-hover:text-maroon transition-colors duration-300 line-clamp-1">{moa.companyName}</div></td>
                        <td className="p-4 sm:p-6 text-slate-700 text-xs sm:text-sm line-clamp-2">{moa.address || 'N/A'}</td>
                        <td className="p-4 sm:p-6 text-slate-700 text-xs sm:text-sm hidden sm:table-cell">{moa.contactPerson || 'N/A'}</td>
                        <td className="p-4 sm:p-6 text-slate-700 text-xs sm:text-sm hidden lg:table-cell">{moa.contactEmail || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading ? (
            <div className="py-20 text-center space-y-4 bg-white/70 backdrop-blur-2xl rounded-3xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all group hover:bg-white/80">
              <div className="w-20 h-20 bg-slate-100/50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <span className="material-symbols-outlined !text-4xl text-slate-400">search_off</span>
              </div>
              <p className="text-slate-500 font-bold text-sm">No approved agreements found</p>
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-white/40 backdrop-blur-xl rounded-3xl border border-black/5 animate-pulse">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-slate-200/50 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-maroon border-t-transparent rounded-full animate-spin"></div>
                <span className="material-symbols-outlined text-maroon !text-xl animate-pulse">description</span>
              </div>
              <p className="text-slate-500 font-bold text-sm tracking-wide">Fetching agreements...</p>
            </div>
          )}
          </div>
        </section>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-3xl border-r border-black/5 p-6 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-in slide-in-from-left duration-300 ease-out">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-maroon rounded-xl text-white flex items-center justify-center shadow-sm flex-shrink-0"><span className="material-symbols-outlined !text-xl">school</span></div>
                <div className="min-w-0">
                  <h1 className="font-bold tracking-tight text-lg text-slate-900 leading-tight truncate">Portal</h1>
                  <p className="text-[10px] font-bold text-maroon uppercase tracking-wider truncate">STUDENT</p>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <nav className="flex-1 space-y-2">
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all bg-gradient-to-r from-maroon to-red-700 text-white">
                <span className="material-symbols-outlined">dashboard</span> Agreements
              </button>
            </nav>
            
            <div className="mt-auto pt-6 w-full border-t border-black/5">
              <div className="flex items-center gap-3 px-2 mb-4">
                <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=800000&color=fff`} alt="Profile" className="w-10 h-10 rounded-full shadow-sm object-cover bg-white p-[2px] border border-slate-200" referrerPolicy="no-referrer" />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-slate-900 truncate">{user?.displayName || user?.email?.split('@')[0]}</span>
                  <span className="text-[10px] font-medium text-slate-500 truncate">{user?.email}</span>
                </div>
              </div>
              <button onClick={() => signOut(auth)} className="p-3 bg-black/5 hover:bg-black/10 rounded-xl font-bold text-slate-700 active:scale-95 flex items-center justify-center gap-2 transition-all w-full"><span className="material-symbols-outlined">logout</span> Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedMoa && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300" onClick={() => setSelectedMoa(null)}>
          <div className="bg-white/90 backdrop-blur-3xl border border-black/5 w-full max-w-2xl rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-out flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-6 sm:px-8 sm:py-6 border-b border-black/5 shrink-0 bg-white/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{selectedMoa.companyName}</h3>
              </div>
              <button onClick={() => setSelectedMoa(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined block !text-xl">close</span>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-8">
              <section>
                <h4 className="text-xs font-bold text-maroon uppercase tracking-wider mb-4 border-b border-black/5 pb-2">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Contact Person</p>
                    <p className="text-sm font-bold text-slate-800">{selectedMoa.contactPerson || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                    {selectedMoa.contactEmail ? (
                      <a href={`mailto:${selectedMoa.contactEmail}`} className="text-sm font-bold text-slate-900 hover:text-maroon hover:underline transition-colors">{selectedMoa.contactEmail}</a>
                    ) : <p className="text-sm font-bold text-slate-800">N/A</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                    <p className="text-sm font-bold text-slate-800">{selectedMoa.address || 'N/A'}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarBtn = memo(({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all duration-300 ease-out group ${active ? 'bg-gradient-to-r from-maroon to-red-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:brightness-110' : 'text-slate-600 hover:bg-black/5 hover:translate-x-1 hover:text-slate-900'}`}>
    <span className="material-symbols-outlined !text-lg group-hover:scale-110 transition-transform duration-300 ease-out">{icon}</span> {label}
  </button>
));
