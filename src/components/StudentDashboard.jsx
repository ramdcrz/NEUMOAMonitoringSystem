import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { subscribeToMOAs } from '../services/moaService';

export const StudentDashboard = ({ user }) => {
  const [moas, setMoas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMOAs(docs => {
      // Filter to show only APPROVED MOAs
      const approvedMoas = docs.filter(moa => String(moa.status || '').includes('APPROVED'));
      setMoas(approvedMoas);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredMoas = moas.filter(moa => {
    if (!moa) return false;
    const lowerSearch = searchTerm.toLowerCase();
    return String(moa.companyName || '').toLowerCase().includes(lowerSearch) ||
           String(moa.contactPerson || '').toLowerCase().includes(lowerSearch) ||
           String(moa.address || '').toLowerCase().includes(lowerSearch);
  });

  const formatDate = (dateValue, options) => {
    if (!dateValue) return 'N/A';
    let d;
    if (typeof dateValue.toDate === 'function') d = dateValue.toDate();
    else if (dateValue.seconds) d = new Date(dateValue.seconds * 1000);
    else d = new Date(dateValue);
    return isNaN(d.getTime()) ? 'N/A' : (options ? d.toLocaleDateString('en-PH', options) : d.toLocaleDateString());
  };

  return (
    <div className="flex min-h-screen bg-pattern antialiased flex-col lg:flex-row relative">

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-maroon/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-blue-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
      </div>

      {/* Header */}
      <div className="w-full bg-white/70 backdrop-blur-xl border-b border-black/5 px-6 sm:px-8 py-4 sm:py-5 lg:hidden flex items-center justify-between shrink-0 z-30 sticky top-0 shadow-sm transition-all">
        <h1 className="font-bold tracking-tight text-lg text-slate-900">Student Portal</h1>
        <div className="text-right">
          <p className="text-sm font-bold tracking-tight text-slate-800">{(user?.email || '').split('@')[0]?.toUpperCase() || 'STUDENT'}</p>
          <p className="text-[10px] font-bold text-slate-500">{user?.email}</p>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white/70 backdrop-blur-2xl border-r border-black/5 p-8 flex-col shrink-0 z-10 transition-all lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-maroon rounded-xl text-white flex items-center justify-center shadow-sm"><span className="material-symbols-outlined !text-xl">school</span></div>
          <div className="min-w-0">
            <h1 className="font-bold tracking-tight text-xl text-slate-900 truncate">Portal</h1>
            <p className="text-[10px] font-bold text-maroon uppercase tracking-wider">STUDENT</p>
          </div>
        </div>
        <nav className="space-y-3 flex-grow">
          <div className="px-4 py-3 rounded-xl bg-maroon text-white font-bold flex items-center gap-3 shadow-md hover:shadow-lg hover:scale-[1.02] cursor-pointer transition-all duration-300">
            <span className="material-symbols-outlined !text-xl">list</span> Agreements
          </div>
        </nav>
        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3 px-2">Account</div>
        <div className="text-sm text-slate-800 font-bold mb-4 px-2 truncate">{user?.email}</div>
        <button onClick={() => signOut(auth)} className="p-3 bg-black/5 hover:bg-black/10 hover:shadow-sm hover:-translate-y-0.5 rounded-xl font-bold text-slate-700 active:scale-95 flex items-center justify-center gap-2 transition-all duration-300 w-full"><span className="material-symbols-outlined !text-lg">logout</span> Sign Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Search Bar */}
          <div className="bg-white/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-2xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500">
            <div className="relative group flex items-center gap-3 bg-black/[0.03] border border-transparent focus-within:bg-white focus-within:border-maroon/20 focus-within:ring-4 focus-within:ring-maroon/10 focus-within:-translate-y-1 focus-within:shadow-md rounded-xl px-4 py-3 transition-all duration-300">
              <span className="material-symbols-outlined text-slate-400 !text-xl group-focus-within:text-maroon transition-colors">search</span>
              <input
                type="text"
                placeholder="Search by company name, contact person..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full outline-none bg-transparent font-medium text-slate-800 placeholder:text-slate-400 text-sm sm:text-base pr-8"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 text-slate-400 hover:text-maroon transition-colors flex items-center justify-center hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined !text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          {/* MOAs Grid/Table */}
          {!loading && filteredMoas.length > 0 ? (
            <div className="bg-white/70 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all flex flex-col">
              {/* Mobile View: Cards */}
              <div className="sm:hidden divide-y divide-black/5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {filteredMoas.map((moa, index) => (
                  <div
                    key={moa.id}
                    className="p-5 hover:bg-white/80 hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 rounded-xl cursor-pointer"
                    style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="font-semibold tracking-tight text-slate-800 text-base mb-2 line-clamp-1">{moa.companyName}</div>
                    <div className="text-xs text-slate-600 font-medium mb-4 space-y-1.5">
                      <div><span className="text-slate-400 mr-1">Address:</span> {moa.address || 'N/A'}</div>
                      <div><span className="text-slate-400 mr-1">Contact:</span> {moa.contactPerson || 'N/A'}</div>
                      <div><span className="text-slate-400 mr-1">Email:</span> {moa.contactEmail || 'N/A'}</div>
                      <div><span className="text-slate-400 mr-1">Effective:</span> {formatDate(moa.effectiveDate)}</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-green-100/50 text-green-700 uppercase tracking-wide w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      APPROVED
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
                  <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
                    <tr>
                      <th className="p-4 sm:p-6">Partner Institution</th>
                      <th className="p-4 sm:p-6">Address</th>
                      <th className="p-4 sm:p-6 hidden lg:table-cell">Contact Person</th>
                      <th className="p-4 sm:p-6 hidden xl:table-cell">Email</th>
                      <th className="p-4 sm:p-6 hidden lg:table-cell text-right">Effective Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filteredMoas.map((moa, index) => (
                      <tr
                        key={moa.id}
                        className="hover:bg-white/60 hover:shadow-sm transition-all duration-300 font-bold animate-in fade-in cursor-default"
                        style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                      >
                        <td className="p-4 sm:p-6"><div className="font-bold text-slate-900 text-sm">{moa.companyName}</div></td>
                        <td className="p-4 sm:p-6 text-slate-700 text-xs sm:text-sm line-clamp-1">{moa.address || 'N/A'}</td>
                        <td className="p-4 sm:p-6 text-slate-700 text-xs sm:text-sm hidden lg:table-cell">{moa.contactPerson || 'N/A'}</td>
                        <td className="p-4 sm:p-6 text-slate-700 text-xs sm:text-sm hidden xl:table-cell line-clamp-1">{moa.contactEmail || 'N/A'}</td>
                        <td className="p-4 sm:p-6 text-slate-600 text-xs sm:text-sm hidden lg:table-cell text-right">{formatDate(moa.effectiveDate, { month: 'short', day: '2-digit', year: '2-digit' })}</td>
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
      </main>
    </div>
  );
};
