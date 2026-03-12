import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
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
  const [formData, setFormData] = useState({ hteId: '', companyName: '', college: 'CICS', status: 'PROCESSING', expiryDate: '' });

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
    if (editId) await updateMOA(editId, formData, user);
    else await createMOA(formData, user);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ hteId: '', companyName: '', college: 'CICS', status: 'PROCESSING', expiryDate: '' });
  };

  return (
    <div className="flex h-screen bg-pattern font-display">
      <aside className="w-72 bg-white/90 backdrop-blur-md border-r border-maroon/10 p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-maroon rounded-xl text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined">school</span></div>
          <div>
            <h1 className="font-black text-xl text-slate-900 leading-tight">Welcome!</h1>
            <p className="text-[9px] font-black text-maroon uppercase tracking-widest">{role}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-4">
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black ${activeTab === 'list' ? 'bg-maroon text-white shadow-xl' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined">dashboard</span> MOA Directory
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black ${activeTab === 'audit' ? 'bg-maroon text-white shadow-xl' : 'text-slate-400'}`}>
              <span className="material-symbols-outlined">history</span> Audit Trail
            </button>
          )}
        </nav>
        <button onClick={() => signOut(auth)} className="p-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:text-maroon flex items-center gap-2"><span className="material-symbols-outlined">logout</span> Sign Out</button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{activeTab === 'list' ? 'MOA Directory' : 'System Logs'}</h2>
          <div className="flex gap-4">
            {activeTab === 'list' && (isAdmin || isStaff) && (
              <>
                <button onClick={() => exportMOAsToPDF(moas)} className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-600 hover:border-maroon/20 hover:text-maroon transition-all shadow-sm active:scale-95">
                  <span className="material-symbols-outlined !text-[20px]">description</span> Export PDF
                </button>
                <button onClick={() => setIsModalOpen(true)} className="bg-maroon text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-maroon/30 hover:scale-105 transition-all">
                  + New Entry
                </button>
              </>
            )}
          </div>
        </header>

        {activeTab === 'list' ? (
          <div className="space-y-6">
            <input type="text" placeholder="Search partners..." className="w-full p-5 bg-white rounded-3xl shadow-sm outline-none font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {colleges.map(c => (
                <button key={c} onClick={() => setFilterCollege(c)} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase transition-all ${filterCollege === c ? 'bg-maroon text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{c}</button>
              ))}
            </div>
            <div className="bg-white rounded-[40px] shadow-xl border border-maroon/5 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                  <tr><th className="p-8">Partner</th><th className="p-8">College</th><th className="p-8">Status</th>{(isAdmin || isStaff) && <th className="p-8 text-right">Actions</th>}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMoas.map(moa => (
                    <tr key={moa.id} className="hover:bg-slate-50/30 transition-colors font-bold text-sm">
                      <td className="p-8"><div className="font-black text-slate-800 text-lg">{moa.companyName}</div><div className="text-[10px] text-slate-400 font-mono uppercase">{moa.hteId}</div></td>
                      <td className="p-8 text-slate-500 uppercase text-xs">{moa.college}</td>
                      <td className="p-8"><span className={`text-[9px] font-black px-4 py-2 rounded-full uppercase ${moa.status?.includes('APPROVED') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{moa.status}</span></td>
                      {(isAdmin || isStaff) && (
                        <td className="p-8 text-right space-x-2">
                          <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><span className="material-symbols-outlined !text-[18px]">edit</span></button>
                          {isAdmin && <button onClick={() => archiveMOA(moa.id, moa.companyName, user)} className="p-2 bg-red-50 text-red-600 rounded-lg"><span className="material-symbols-outlined !text-[18px]">archive</span></button>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <AuditTable logs={auditLogs} />
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <form onSubmit={handleSave} className="bg-white w-full max-w-xl rounded-[50px] p-12 shadow-2xl">
            <h3 className="text-3xl font-black mb-8">{editId ? 'Update' : 'Register'} MOA</h3>
            <div className="space-y-4">
              <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="HTE ID" value={formData.hteId} onChange={e => setFormData({...formData, hteId: e.target.value})} />
              <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Company Name" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="p-4 bg-slate-50 rounded-2xl font-bold" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})}>
                  {colleges.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" className="p-4 bg-slate-50 rounded-2xl font-bold" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-6 mt-12">
              <button type="button" onClick={closeModal} className="font-black text-slate-400">Discard</button>
              <button type="submit" className="px-10 py-4 bg-maroon text-white rounded-2xl font-black shadow-xl">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const AuditTable = ({ logs }) => (
  <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-maroon/5">
    <table className="w-full text-left">
      <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase tracking-widest">
        <tr><th className="p-8">Admin</th><th className="p-8">Action</th><th className="p-8">Partner</th><th className="p-8 text-right">Time</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {logs.map(log => (
          <tr key={log.id} className="text-sm font-bold">
            <td className="p-8 text-slate-800">{log.userName}</td>
            <td className="p-8"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${log.operation === 'INSERT' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{log.operation}</span></td>
            <td className="p-8 text-slate-500">{log.targetHte}</td>
            <td className="p-8 text-right text-slate-300 text-[10px]">{log.timestamp?.toDate().toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AdminDashboard;