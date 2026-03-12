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
    <div className="flex h-screen bg-pattern font-display overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white/90 backdrop-blur-md border-r border-maroon/10 p-8 flex flex-col shrink-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-maroon rounded-xl text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined">school</span></div>
          <div>
            <h1 className="font-black text-xl text-slate-900 leading-tight">Portal</h1>
            <p className="text-[9px] font-black text-maroon uppercase tracking-[0.2em] opacity-60">{role}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarBtn active={activeTab === 'list'} icon="dashboard" label="Directory" onClick={() => setActiveTab('list')} />
          {isAdmin && <SidebarBtn active={activeTab === 'audit'} icon="history" label="Audit Trail" onClick={() => setActiveTab('audit')} />}
        </nav>
        <button onClick={() => signOut(auth)} className="p-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:text-maroon flex items-center gap-3 transition-colors"><span className="material-symbols-outlined !text-xl">logout</span> Sign Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-10 pb-4 flex justify-between items-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter capitalize">{activeTab}</h2>
          <div className="flex gap-3">
            {activeTab === 'list' && (isAdmin || isStaff) && (
              <>
                <button onClick={() => exportMOAsToPDF(moas)} className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-600 hover:border-maroon/20 hover:text-maroon transition-all shadow-sm active:scale-95"><span className="material-symbols-outlined">description</span> Export PDF</button>
                <button onClick={() => setIsModalOpen(true)} className="bg-maroon text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-maroon/30 hover:scale-105 transition-all">+ New Entry</button>
              </>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-10 pb-10">
          {activeTab === 'list' ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">search</span>
                  <input type="text" placeholder="Search partner institutions..." className="w-full pl-14 pr-6 py-5 bg-white rounded-3xl shadow-sm outline-none font-bold focus:ring-2 ring-maroon/10 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  {colleges.map(c => (
                    <button key={c} onClick={() => setFilterCollege(c)} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase transition-all ${filterCollege === c ? 'bg-maroon text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>{c}</button>
                  ))}
                </div>
              </div>

              {filteredMoas.length > 0 ? (
                <div className="bg-white rounded-[40px] shadow-xl border border-maroon/5 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                      <tr><th className="p-8">Partner</th><th className="p-8">College</th><th className="p-8">Status</th>{(isAdmin || isStaff) && <th className="p-8 text-right">Actions</th>}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredMoas.map(moa => (
                        <tr key={moa.id} className="hover:bg-slate-50/50 transition-colors font-bold group">
                          <td className="p-8"><div className="font-black text-slate-800 text-lg group-hover:text-maroon transition-colors">{moa.companyName}</div><div className="text-[10px] text-slate-300 font-mono tracking-widest">{moa.hteId}</div></td>
                          <td className="p-8 text-slate-500 uppercase text-xs">{moa.college}</td>
                          <td className="p-8"><StatusBadge status={moa.status} /></td>
                          {(isAdmin || isStaff) && (
                            <td className="p-8 text-right space-x-2">
                              <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="px-4 py-2 rounded-xl font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"><span className="material-symbols-outlined !text-lg">edit</span></button>
                              {isAdmin && <button onClick={() => handleArchive(moa.id, moa.companyName)} className="px-4 py-2 rounded-xl font-black text-red-600 bg-red-50 hover:bg-red-100 transition-colors"><span className="material-symbols-outlined !text-lg">archive</span></button>}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4 bg-white/50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <span className="material-symbols-outlined !text-6xl text-slate-200">search_off</span>
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No matching MOAs found</p>
                </div>
              )}
            </div>
          ) : <AuditTable logs={auditLogs} />}
        </section>
      </main>

      {/* Modal - Kept consistent with professional inputs */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 z-[60]">
          <form onSubmit={handleSave} className="bg-white w-full max-w-xl rounded-[50px] p-12 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black mb-8 tracking-tighter">{editId ? 'Update' : 'New'} Agreement</h3>
            <div className="space-y-5">
              <InputField label="HTE ID" value={formData.hteId} onChange={v => setFormData({...formData, hteId: v})} placeholder="e.g. 2026-CICS-001" />
              <InputField label="Partner Institution" value={formData.companyName} onChange={v => setFormData({...formData, companyName: v})} placeholder="e.g. Microsoft Philippines" />
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Assigned College" value={formData.college} options={colleges.filter(c => c !== "ALL")} onChange={v => setFormData({...formData, college: v})} />
                <SelectField label="Process Status" value={formData.status} options={["PROCESSING", "APPROVED"]} onChange={v => setFormData({...formData, status: v})} />
              </div>
            </div>
            <div className="flex justify-end gap-6 mt-12">
              <button type="button" onClick={closeModal} className="font-black text-slate-300 hover:text-slate-500 transition-colors">Discard</button>
              <button type="submit" className="bg-maroon text-white px-12 py-5 rounded-2xl font-black shadow-xl shadow-maroon/20">Save Record</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for absolute cleanliness ---
const SidebarBtn = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${active ? 'bg-maroon text-white shadow-xl shadow-maroon/20' : 'text-slate-400 hover:bg-maroon/5 hover:text-maroon'}`}>
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
    <label className="text-[10px] font-black text-slate-300 uppercase ml-2 mb-1 block">{label}</label>
    <input required value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 border border-transparent focus:border-maroon/10 focus:bg-white transition-all" />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div className="text-left">
    <label className="text-[10px] font-black text-slate-300 uppercase ml-2 mb-1 block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const AuditTable = ({ logs }) => (
  <div className="space-y-6">
    {logs.length > 0 ? (
      <div className="bg-white rounded-[40px] shadow-xl border border-maroon/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="p-8">User</th>
              <th className="p-8">Action</th>
              <th className="p-8">Target</th>
              <th className="p-8">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-8">
                  <div className="font-black text-slate-800">{log.userName}</div>
                  <div className="text-[10px] text-slate-300 font-mono">{log.userEmail}</div>
                </td>
                <td className="p-8">
                  <span className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-tighter ${
                    log.operation === 'INSERT' ? 'bg-green-100 text-green-700' :
                    log.operation === 'EDIT' ? 'bg-blue-100 text-blue-700' :
                    log.operation === 'ARCHIVE' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.operation}
                  </span>
                </td>
                <td className="p-8 text-slate-600 font-bold">{log.details || log.targetHte}</td>
                <td className="p-8 text-slate-400 text-sm">{log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="py-20 text-center space-y-4 bg-white/50 rounded-[40px] border-2 border-dashed border-slate-200">
        <span className="material-symbols-outlined !text-6xl text-slate-200">history</span>
        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No audit logs available</p>
      </div>
    )}
  </div>
);

export default AdminDashboard;