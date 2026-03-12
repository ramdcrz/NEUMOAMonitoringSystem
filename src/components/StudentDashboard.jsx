import { useState, useEffect, memo } from 'react';
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
      const approvedMoas = docs.filter(moa => moa.status?.includes('APPROVED'));
      setMoas(approvedMoas);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredMoas = moas.filter(moa =>
    moa.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    moa.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    moa.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-pattern font-display overflow-hidden flex-col lg:flex-row">
      {/* Header */}
      <div className="w-full bg-white/90 backdrop-blur-md border-b border-maroon/10 px-6 sm:px-8 py-5 sm:py-6 lg:hidden flex items-center justify-between shrink-0">
        <h1 className="font-black text-lg sm:text-2xl text-slate-900">Student Portal</h1>
        <div className="text-right">
          <p className="text-xs sm:text-sm font-black text-slate-600">{user?.email?.split('@')[0].toUpperCase() || 'STUDENT'}</p>
          <p className="text-[8px] sm:text-[9px] text-slate-400">{user?.email}</p>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white/90 backdrop-blur-md border-r border-maroon/10 p-8 flex-col shrink-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-maroon rounded-xl text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined">school</span></div>
          <div className="min-w-0">
            <h1 className="font-black text-xl text-slate-900 truncate">Portal</h1>
            <p className="text-[9px] font-black text-maroon uppercase tracking-[0.2em] opacity-60">STUDENT</p>
          </div>
        </div>
        <nav className="space-y-3 flex-grow">
          <div className="px-4 py-3 rounded-2xl bg-maroon text-white font-black flex items-center gap-3 shadow-xl shadow-maroon/20">
            <span className="material-symbols-outlined">list</span> Agreements
          </div>
        </nav>
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 mb-4">Account</div>
        <div className="text-xs text-slate-600 font-bold mb-4">{user?.email}</div>
        <button onClick={() => signOut(auth)} className="p-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:text-maroon active:scale-95 flex items-center gap-3 transition-all duration-300 w-full justify-center"><span className="material-symbols-outlined">logout</span> Sign Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search Bar */}
          <div className="bg-white/50 rounded-2xl sm:rounded-3xl lg:rounded-[40px] p-6 sm:p-8 lg:p-10 backdrop-blur-sm border border-slate-100 shadow-lg shadow-maroon/5">
            <div className="flex items-center gap-2 sm:gap-4 bg-slate-50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4">
              <span className="material-symbols-outlined text-slate-400 !text-lg sm:!text-2xl">search</span>
              <input
                type="text"
                placeholder="Search by company name, contact person..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full outline-none bg-transparent font-bold text-slate-800 placeholder-slate-400 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* MOAs Grid/Table */}
          {!loading && filteredMoas.length > 0 ? (
            <div className="bg-white/50 rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden backdrop-blur-sm border border-slate-100 shadow-lg shadow-maroon/5">
              {/* Mobile View: Cards */}
              <div className="sm:hidden space-y-3 p-4">
                {filteredMoas.map((moa, index) => (
                  <div
                    key={moa.id}
                    className="bg-white rounded-xl p-4 border border-slate-100 hover:border-maroon/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-700"
                    style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="font-black text-slate-800 text-base mb-2 line-clamp-1">{moa.companyName}</div>
                    <div className="text-[11px] text-slate-500 font-bold mb-3 space-y-1">
                      <div><span className="text-slate-400">Address:</span> {moa.address || 'N/A'}</div>
                      <div><span className="text-slate-400">Contact:</span> {moa.contactPerson || 'N/A'}</div>
                      <div><span className="text-slate-400">Email:</span> {moa.contactEmail || 'N/A'}</div>
                      <div><span className="text-slate-400">Effective:</span> {moa.effectiveDate ? new Date(moa.effectiveDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-green-100 text-green-700 inline-block">APPROVED</span>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead className="bg-slate-50/50 font-black text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="p-4 sm:p-6">Partner Institution</th>
                      <th className="p-4 sm:p-6">Address</th>
                      <th className="p-4 sm:p-6 hidden lg:table-cell">Contact Person</th>
                      <th className="p-4 sm:p-6 hidden xl:table-cell">Email</th>
                      <th className="p-4 sm:p-6 hidden lg:table-cell text-right">Effective Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMoas.map((moa, index) => (
                      <tr
                        key={moa.id}
                        className="hover:bg-slate-50 transition-all duration-300 font-bold animate-in fade-in slide-in-from-bottom-2 duration-700"
                        style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                      >
                        <td className="p-4 sm:p-6"><div className="font-black text-slate-800 text-sm">{moa.companyName}</div></td>
                        <td className="p-4 sm:p-6 text-slate-600 text-xs sm:text-sm line-clamp-1">{moa.address || 'N/A'}</td>
                        <td className="p-4 sm:p-6 text-slate-600 text-xs sm:text-sm hidden lg:table-cell">{moa.contactPerson || 'N/A'}</td>
                        <td className="p-4 sm:p-6 text-slate-600 text-xs sm:text-sm hidden xl:table-cell line-clamp-1">{moa.contactEmail || 'N/A'}</td>
                        <td className="p-4 sm:p-6 text-slate-500 text-xs sm:text-sm hidden lg:table-cell text-right">{moa.effectiveDate ? new Date(moa.effectiveDate).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: '2-digit' }) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading ? (
            <div className="py-20 text-center space-y-4 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
              <span className="material-symbols-outlined !text-6xl text-slate-200 block">search_off</span>
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No approved agreements found</p>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-maroon rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
