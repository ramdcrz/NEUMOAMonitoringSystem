import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { createMOA, subscribeToMOAs, archiveMOA, subscribeToAudit, updateMOA } from '../services/moaService';

const AdminDashboard = ({ user, role }) => {
  const [moas, setMoas] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ hteId: '', companyName: '', college: '', status: 'PROCESSING', expiryDate: '' });

  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const isStudent = role === 'student';

  useEffect(() => {
    const unsubMOAs = subscribeToMOAs((data) => setMoas(data));
    // Requirement #11: Only Admins can see the Audit Trail
    let unsubAudit = () => {};
    if (isAdmin) unsubAudit = subscribeToAudit((data) => setAuditLogs(data));
    return () => { unsubMOAs(); unsubAudit(); };
  }, [isAdmin]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (editId) await updateMOA(editId, formData, user);
    else await createMOA(formData, user);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ hteId: '', companyName: '', college: '', status: 'PROCESSING', expiryDate: '' });
  };

  return (
    <div className="flex h-screen bg-pattern font-display">
      {/* Sidebar */}
      <aside className="w-72 bg-white/90 backdrop-blur-md border-r border-maroon/10 p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-maroon rounded-xl text-white flex items-center justify-center">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <h1 className="font-black text-xl text-slate-900 leading-tight">Welcome!</h1>
            <p className="text-[9px] font-black text-maroon uppercase tracking-widest">{role}</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-4">
          <SidebarBtn active={activeTab === 'list'} onClick={() => setActiveTab('list')} icon="dashboard" label="MOA Directory" />
          
          {/* Requirement #11: Hide Audit for Students */}
          {isAdmin && (
            <SidebarBtn active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon="history" label="Audit Trail" />
          )}
        </nav>

        <button onClick={() => signOut(auth)} className="p-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:text-maroon flex items-center gap-2">
          <span className="material-symbols-outlined">logout</span> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
            {activeTab === 'list' ? 'MOA Directory' : 'System Logs'}
          </h2>
          {/* Requirement #1: Only Admin/Staff can add new records */}
          {activeTab === 'list' && (isAdmin || isStaff) && (
            <button onClick={() => setIsModalOpen(true)} className="bg-maroon text-white px-8 py-4 rounded-2xl font-black shadow-xl">+ New Entry</button>
          )}
        </div>

        {activeTab === 'list' ? (
          <div className="space-y-6">
            <input type="text" placeholder="Search by partner or college..." className="w-full p-5 bg-white rounded-3xl shadow-sm outline-none font-bold text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            
            <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-maroon/5">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-8">Partner</th>
                    <th className="p-8 text-center">College</th>
                    <th className="p-8">Status</th>
                    {(isAdmin || isStaff) && <th className="p-8 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {moas.filter(m => !m.isDeleted && m.companyName?.toLowerCase().includes(searchTerm.toLowerCase())).map(moa => (
                    <tr key={moa.id} className="hover:bg-slate-50/30 transition-colors font-bold">
                      <td className="p-8">
                        <div className="font-black text-slate-800 text-lg">{moa.companyName}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{moa.hteId}</div>
                      </td>
                      <td className="p-8 text-center text-slate-500 uppercase text-xs">{moa.college}</td>
                      <td className="p-8">
                        <span className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-tighter ${moa.status?.includes('APPROVED') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {moa.status}
                        </span>
                      </td>
                      {/* Requirement #1 & #11: Role-based Action Access */}
                      {(isAdmin || isStaff) && (
                        <td className="p-8 text-right space-x-2">
                           <button onClick={() => handleOpenEdit(moa)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><span className="material-symbols-outlined !text-[18px]">edit</span></button>
                           {isAdmin && (
                             <button onClick={() => archiveMOA(moa.id, moa.companyName, user)} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><span className="material-symbols-outlined !text-[18px]">archive</span></button>
                           )}
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

      {/* Modal - Limited to authorized users */}
      {isModalOpen && (isAdmin || isStaff) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <form onSubmit={handleSave} className="bg-white w-full max-w-xl rounded-[50px] p-12 shadow-2xl">
            <h3 className="text-3xl font-black mb-8">{editId ? 'Update Record' : 'Register MOA'}</h3>
            <div className="space-y-4">
              <ModalInput label="HTE ID" val={formData.hteId} set={(v) => setFormData({...formData, hteId: v})} />
              <ModalInput label="Company Name" val={formData.companyName} set={(v) => setFormData({...formData, companyName: v})} />
              <div className="grid grid-cols-2 gap-4">
                <ModalInput label="College" val={formData.college} set={(v) => setFormData({...formData, college: v})} />
                <div className="flex flex-col">
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Expiry Date</label>
                   <input type="date" className="p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
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

const SidebarBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-5 rounded-[24px] transition-all font-black ${active ? 'bg-maroon text-white shadow-xl shadow-maroon/20' : 'text-slate-400 hover:bg-maroon/5 hover:text-maroon'}`}>
    <span className="material-symbols-outlined">{icon}</span> {label}
  </button>
);

const ModalInput = ({ label, val, set }) => (
    <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">{label}</label>
        <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={val} onChange={e => set(e.target.value)} />
    </div>
);

const AuditTable = ({ logs }) => (
    <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-maroon/5">
        <table className="w-full text-left">
            <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr><th className="p-8">Administrator</th><th className="p-8">Operation</th><th className="p-8">Partner</th><th className="p-8 text-right">Time</th></tr>
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