import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { createMOA, subscribeToMOAs, archiveMOA, subscribeToAudit, updateMOA } from '../services/moaService';
import { exportMOAsToPDF } from '../services/reportService';

const AdminDashboard = ({ user, role }) => {
  const [moas, setMoas] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCollege, setFilterCollege] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ hteId: '', companyName: '', college: 'CICS', status: 'PROCESSING' });

  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const colleges = ["ALL", "CICS", "CBA", "COE", "CAS", "CED"];

  useEffect(() => {
    const unsubMOAs = subscribeToMOAs((data) => setMoas(data));
    let unsubAudit = () => {};
    if (isAdmin) unsubAudit = subscribeToAudit((data) => setAuditLogs(data));
    return () => { unsubMOAs(); unsubAudit(); };
  }, [isAdmin]);

  const filteredMoas = moas.filter(m => {
    const matchesSearch = m.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || m.hteId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege = filterCollege === "ALL" || m.college === filterCollege;
    return !m.isDeleted && matchesSearch && matchesCollege;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    const loadToast = toast.loading('Saving agreement...');
    try {
      if (editId) await updateMOA(editId, formData, user);
      else await createMOA(formData, user);
      toast.success('Record updated successfully!', { id: loadToast });
      closeModal();
    } catch (err) {
      toast.error('Failed to save record.', { id: loadToast });
    }
  };

  const handleArchive = async (id, name) => {
    if (window.confirm(`Archive ${name}?`)) {
      try {
        await archiveMOA(id, name, user);
        toast.success('Moved to archives');
      } catch (err) {
        toast.error('Archive failed');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ hteId: '', companyName: '', college: 'CICS', status: 'PROCESSING' });
  };

  return (
    <div className="flex h-screen bg-pattern font-display overflow-hidden flex-col lg:flex-row">
      {/* Sidebar - Hidden on mobile, shown on lg+ */}
      <aside className="hidden lg:flex w-72 bg-white/90 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-maroon/10 p-6 sm:p-8 flex-col shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="w-10 h-10 bg-maroon rounded-xl text-white flex items-center justify-center shadow-lg flex-shrink-0"><span className="material-symbols-outlined">school</span></div>
          <div className="min-w-0">
            <h1 className="font-black text-lg sm:text-xl text-slate-900 leading-tight truncate">Portal</h1>
            <p className="text-[8px] sm:text-[9px] font-black text-maroon uppercase tracking-[0.2em] opacity-60 truncate">{role}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarBtn active={activeTab === 'list'} icon="dashboard" label="Directory" onClick={() => setActiveTab('list')} />
          {isAdmin && <SidebarBtn active={activeTab === 'audit'} icon="history" label="Audit Trail" onClick={() => setActiveTab('audit')} />}
        </nav>
        <button onClick={() => signOut(auth)} className="p-3 sm:p-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:text-maroon flex items-center gap-2 sm:gap-3 transition-colors text-sm sm:text-base"><span className="material-symbols-outlined !text-lg sm:!text-xl">logout</span> <span className="hidden sm:inline">Sign Out</span></button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        <header className="p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 border-b border-slate-100/50 lg:border-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-12 h-12 bg-maroon text-white rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg flex items-center justify-center flex-shrink-0"
            >
              <span className="material-symbols-outlined text-xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter capitalize">{activeTab}</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {activeTab === 'list' && (isAdmin || isStaff) && (
              <>
                <button onClick={() => exportMOAsToPDF(moas)} className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-4 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl font-black text-slate-600 hover:border-maroon/20 hover:text-maroon hover:shadow-md active:scale-95 transition-all duration-300 shadow-sm text-xs sm:text-sm whitespace-nowrap"><span className="material-symbols-outlined text-base sm:text-xl">description</span> <span className="hidden sm:inline">Export PDF</span></button>
                <button onClick={() => setIsModalOpen(true)} className="bg-maroon text-white px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-maroon/30 hover:scale-105 active:scale-95 transition-all duration-300 text-xs sm:text-sm whitespace-nowrap">+ New Entry</button>
              </>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 pb-6 sm:pb-10">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {activeTab === 'list' ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">search</span>
                  <input type="text" placeholder="Search partner institutions..." className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-5 bg-white rounded-2xl sm:rounded-3xl shadow-sm outline-none font-bold focus:ring-2 ring-maroon/10 transition-all text-sm sm:text-base" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {colleges.map(c => (
                    <button key={c} onClick={() => setFilterCollege(c)} className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase transition-all duration-300 whitespace-nowrap flex-shrink-0 ${filterCollege === c ? 'bg-maroon text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50 hover:border-maroon/20'}`}>{c}</button>
                  ))}
                </div>
              </div>

              {filteredMoas.length > 0 ? (
                <div className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-[40px] shadow-lg sm:shadow-xl border border-maroon/5 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead className="bg-slate-50/50 font-black text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest">
                      <tr><th className="p-3 sm:p-6 lg:p-8">Partner</th><th className="p-3 sm:p-6 lg:p-8">College</th><th className="p-3 sm:p-6 lg:p-8">Status</th>{(isAdmin || isStaff) && <th className="p-3 sm:p-6 lg:p-8 text-right">Actions</th>}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredMoas.map((moa, index) => (
                        <tr key={moa.id} className="hover:bg-slate-50 transition-all duration-300 font-bold group animate-in fade-in slide-in-from-bottom-2 duration-700" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                          <td className="p-3 sm:p-6 lg:p-8"><div className="font-black text-slate-800 text-sm sm:text-lg group-hover:text-maroon transition-all duration-300 line-clamp-1">{moa.companyName}</div><div className="text-[8px] sm:text-[10px] text-slate-300 font-mono tracking-widest line-clamp-1">{moa.hteId}</div></td>
                          <td className="p-3 sm:p-6 lg:p-8 text-slate-500 uppercase text-xs sm:text-xs whitespace-nowrap">{moa.college}</td>
                          <td className="p-3 sm:p-6 lg:p-8"><StatusBadge status={moa.status} /></td>
                          {(isAdmin || isStaff) && (
                            <td className="p-3 sm:p-6 lg:p-8 text-right space-x-1 sm:space-x-2 flex justify-end">
                              <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all duration-300 text-lg" title="Edit"><span className="material-symbols-outlined !text-lg">edit</span></button>
                              {isAdmin && <button onClick={() => handleArchive(moa.id, moa.companyName)} className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition-all duration-300 text-lg" title="Archive"><span className="material-symbols-outlined !text-lg">archive</span></button>}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 sm:py-20 text-center space-y-4 bg-white/50 rounded-2xl sm:rounded-3xl lg:rounded-[40px] border-2 border-dashed border-slate-200">
                  <span className="material-symbols-outlined !text-4xl sm:!text-6xl text-slate-200 block">search_off</span>
                  <p className="text-slate-400 font-black uppercase text-[9px] sm:text-xs tracking-widest">No matching MOAs found</p>
                </div>
              )}
            </div>
            ) : <AuditTable logs={auditLogs} />}
          </div>
        </section>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="absolute left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-maroon/10 p-6 flex flex-col shadow-xl animate-in slide-in-from-left-full duration-500 ease-out">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-maroon rounded-xl text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined">school</span></div>
                <div>
                  <h1 className="font-black text-lg text-slate-900 leading-tight">Portal</h1>
                  <p className="text-[8px] font-black text-maroon uppercase tracking-[0.2em] opacity-60">{role}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <nav className="flex-1 space-y-2">
              <button
                onClick={() => { setActiveTab('list'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all duration-300 ${
                  activeTab === 'list' ? 'bg-maroon text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-maroon/5 hover:text-maroon'
                }`}
              >
                <span className="material-symbols-outlined">dashboard</span> Directory
              </button>
              {role === 'admin' && (
                <button
                  onClick={() => { setActiveTab('audit'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all duration-300 ${
                    activeTab === 'audit' ? 'bg-maroon text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-maroon/5 hover:text-maroon'
                  }`}
                >
                  <span className="material-symbols-outlined">history</span> Audit Trail
                </button>
              )}
            </nav>
            
            <button onClick={() => signOut(auth)} className="p-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:text-maroon active:scale-95 flex items-center gap-3 transition-all duration-300 w-full justify-center"><span className="material-symbols-outlined">logout</span> Sign Out</button>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-[60] animate-in fade-in duration-400">
          <form onSubmit={handleSave} className="bg-white w-full max-w-sm sm:max-w-md lg:max-w-xl rounded-3xl sm:rounded-[40px] lg:rounded-[50px] p-6 sm:p-10 lg:p-12 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-6 sm:mb-8 tracking-tighter">{editId ? 'Update' : 'New'} Agreement</h3>
            <div className="space-y-4 sm:space-y-5">
              <InputField label="HTE ID" value={formData.hteId} onChange={v => setFormData({...formData, hteId: v})} placeholder="e.g. 2026-CICS-001" />
              <InputField label="Partner Institution" value={formData.companyName} onChange={v => setFormData({...formData, companyName: v})} placeholder="e.g. Microsoft Philippines" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <SelectField label="Assigned College" value={formData.college} options={colleges.filter(c => c !== "ALL")} onChange={v => setFormData({...formData, college: v})} />
                <SelectField label="Process Status" value={formData.status} options={["PROCESSING", "APPROVED"]} onChange={v => setFormData({...formData, status: v})} />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-6 mt-8 sm:mt-12">
              <button type="button" onClick={closeModal} className="font-black text-slate-300 hover:text-slate-500 transition-all duration-300 py-2 text-sm sm:text-base active:scale-95">Discard</button>
              <button type="submit" className="bg-maroon text-white px-8 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-maroon/20 hover:scale-105 active:scale-95 transition-all duration-300 text-sm sm:text-base">Save Record</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for absolute cleanliness ---
const SidebarBtn = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all duration-300 ease-out ${active ? 'bg-maroon text-white shadow-xl shadow-maroon/20 translate-x-2' : 'text-slate-400 hover:bg-maroon/5 hover:text-maroon hover:translate-x-1'}`}>
    <span className="material-symbols-outlined !text-xl">{icon}</span> {label}
  </button>
);

const StatusBadge = ({ status }) => (
  <span className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-tighter ${status?.includes('APPROVED') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
    {status}
  </span>
);

const InputField = ({ label, value, onChange, placeholder }) => (
  <div className="text-left">
    <label className="text-[8px] sm:text-[10px] font-black text-slate-300 uppercase ml-2 mb-1 block">{label}</label>
    <input required value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-2xl outline-none font-bold text-slate-700 border border-transparent focus:border-maroon/10 focus:bg-white transition-all text-sm" />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div className="text-left">
    <label className="text-[8px] sm:text-[10px] font-black text-slate-300 uppercase ml-2 mb-1 block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-2xl outline-none font-bold text-slate-700 text-sm">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const AuditTable = ({ logs }) => (
  <div className="space-y-4 sm:space-y-6">
    {logs.length > 0 ? (
      <div className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-[40px] shadow-lg sm:shadow-xl border border-maroon/5 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="bg-slate-50/50 font-black text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="p-3 sm:p-6 lg:p-8 whitespace-nowrap">User</th>
              <th className="p-3 sm:p-6 lg:p-8 whitespace-nowrap">Action</th>
              <th className="p-3 sm:p-6 lg:p-8 whitespace-nowrap">Target</th>
              <th className="p-3 sm:p-6 lg:p-8 whitespace-nowrap text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-3 sm:p-6 lg:p-8">
                  <div className="font-black text-slate-800 text-xs sm:text-sm line-clamp-1">{log.userName}</div>
                  <div className="text-[7px] sm:text-[10px] text-slate-300 font-mono truncate">{log.userEmail}</div>
                </td>
                <td className="p-3 sm:p-6 lg:p-8">
                  <span className={`text-[7px] sm:text-[9px] font-black px-2 sm:px-4 py-1 sm:py-2 rounded-full uppercase tracking-tighter whitespace-nowrap block w-min ${                    log.operation === 'INSERT' ? 'bg-green-100 text-green-700' :
                    log.operation === 'EDIT' ? 'bg-blue-100 text-blue-700' :
                    log.operation === 'ARCHIVE' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.operation}
                  </span>
                </td>
                <td className="p-3 sm:p-6 lg:p-8 text-slate-600 font-bold text-xs sm:text-sm truncate">{log.details || log.targetHte}</td>
                <td className="p-3 sm:p-6 lg:p-8 text-slate-400 text-[10px] sm:text-sm whitespace-nowrap text-right">{log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="py-12 sm:py-20 text-center space-y-4 bg-white/50 rounded-2xl sm:rounded-3xl lg:rounded-[40px] border-2 border-dashed border-slate-200">
        <span className="material-symbols-outlined !text-4xl sm:!text-6xl text-slate-200 block">history</span>
        <p className="text-slate-400 font-black uppercase text-[9px] sm:text-xs tracking-widest">No audit logs available</p>
      </div>
    )}
  </div>
);

export default AdminDashboard;