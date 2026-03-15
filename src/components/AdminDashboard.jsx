import React, { useState, useEffect, useMemo, memo } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { createMOA, subscribeToMOAs, archiveMOA, subscribeToAudit, updateMOA, restoreMOA, deleteMOAPermanently } from '../services/moaService';
import { exportMOAsToPDF } from '../services/reportService';

const COLLEGES = ["ALL", "CICS", "CBA", "COE", "CAS", "CED"];
const MOA_STATUSES = [
  "APPROVED: Signed by President",
  "APPROVED: In Notarization",
  "APPROVED: Active (No Notarization)",
  "PENDING: Partner Signature",
  "PENDING: Legal Review",
  "PENDING: University Approval",
  "EXPIRED: Terminated",
  "EXPIRING: Renewal Required"
];
const INDUSTRIES = ["Technology", "Healthcare", "Education", "Finance", "Manufacturing", "Energy", "Retail", "Hospitality", "Government", "Non-profit", "Other"];

const AdminDashboard = ({ user, role }) => {
  const [moas, setMoas] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCollege, setFilterCollege] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    hteId: '', 
    companyName: '', 
    address: '',
    contactPerson: '',
    contactEmail: '',
    industry: 'Technology',
    effectiveDate: '',
    expiryDate: '',
    college: 'CICS',
    endorsedBy: '',
    status: 'PENDING: Legal Review',
    notes: ''
  });

  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  useEffect(() => {
    const unsubMOAs = subscribeToMOAs((data) => setMoas(data));
    let unsubAudit = () => {};
    if (isAdmin) unsubAudit = subscribeToAudit((data) => setAuditLogs(data));
    return () => { unsubMOAs(); unsubAudit(); };
  }, [isAdmin]);

  const filteredMoas = useMemo(() => moas.filter(m => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = String(m.companyName || '').toLowerCase().includes(lowerSearch) || String(m.hteId || '').toLowerCase().includes(lowerSearch);
    const matchesCollege = filterCollege === "ALL" || m.college === filterCollege;
    return !m.isDeleted && matchesSearch && matchesCollege;
  }), [moas, searchTerm, filterCollege]);

  const archivedMoas = useMemo(() => moas.filter(m => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = String(m.companyName || '').toLowerCase().includes(lowerSearch) || String(m.hteId || '').toLowerCase().includes(lowerSearch);
    const matchesCollege = filterCollege === "ALL" || m.college === filterCollege;
    return m.isDeleted && matchesSearch && matchesCollege;
  }), [moas, searchTerm, filterCollege]);

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

  const handleRestore = async (id, name) => {
    if (window.confirm(`Restore ${name} from the Archive Vault?`)) {
      const loadToast = toast.loading('Restoring agreement...');
      try {
        await restoreMOA(id, name, user);
        toast.success('Agreement restored successfully', { id: loadToast });
      } catch (err) {
        toast.error('Failed to restore agreement', { id: loadToast });
      }
    }
  };

  const handlePermanentDelete = async (id, name) => {
    if (window.confirm(`WARNING: This will permanently delete ${name}. This action cannot be undone. Proceed?`)) {
      const loadToast = toast.loading('Deleting permanently...');
      try {
        await deleteMOAPermanently(id, name, user);
        toast.success('Agreement permanently deleted', { id: loadToast });
      } catch (err) {
        toast.error('Failed to delete agreement', { id: loadToast });
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({
      hteId: '',
      companyName: '',
      address: '',
      contactPerson: '',
      contactEmail: '',
      industry: 'Technology',
      effectiveDate: '',
      expiryDate: '',
      college: 'CICS',
      endorsedBy: '',
      status: 'PENDING: Legal Review',
      notes: ''
    });
  };

  return (
    <div className="flex min-h-screen bg-pattern antialiased flex-col lg:flex-row relative">
      
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-maroon/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-blue-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
      </div>

      {/* Sidebar - Hidden on mobile, shown on lg+ */}
      <aside className="hidden lg:flex w-72 bg-white/70 backdrop-blur-2xl border-r border-black/5 p-6 sm:p-8 flex-col shrink-0 z-10 transition-all lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-maroon rounded-xl text-white flex items-center justify-center shadow-sm flex-shrink-0"><span className="material-symbols-outlined !text-xl">school</span></div>
          <div className="min-w-0">
            <h1 className="font-bold tracking-tight text-lg sm:text-xl text-slate-900 leading-tight truncate">Portal</h1>
            <p className="text-[10px] font-bold text-maroon uppercase tracking-wider truncate">{role}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarBtn active={activeTab === 'list'} icon="dashboard" label="Directory" onClick={() => setActiveTab('list')} />
          {isAdmin && <SidebarBtn active={activeTab === 'archive'} icon="inventory_2" label="Archive Vault" onClick={() => setActiveTab('archive')} />}
          {isAdmin && <SidebarBtn active={activeTab === 'audit'} icon="history" label="Audit Trail" onClick={() => setActiveTab('audit')} />}
        </nav>
        <button onClick={() => signOut(auth)} className="p-3 bg-black/5 hover:bg-black/10 rounded-xl font-bold text-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95"><span className="material-symbols-outlined !text-lg">logout</span> <span className="hidden sm:inline">Sign Out</span></button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-black/5 p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-white/50 hover:bg-white text-slate-800 rounded-xl border border-black/5 shadow-sm transition-all active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{activeTab === 'list' ? 'Directory' : activeTab === 'audit' ? 'Audit Trail' : 'Archive Vault'}</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {activeTab === 'list' && (isAdmin || isStaff) && (
              <>
                <button onClick={() => exportMOAsToPDF(moas)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm active:scale-95 text-sm whitespace-nowrap"><span className="material-symbols-outlined !text-lg">description</span> <span className="hidden sm:inline">Export PDF</span></button>
                <button onClick={() => setIsModalOpen(true)} className="bg-maroon text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-maroon/90 flex items-center gap-2 transition-all active:scale-95 text-sm whitespace-nowrap"><span className="material-symbols-outlined !text-lg">add</span> New Entry</button>
              </>
            )}
          </div>
        </header>

        <section className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {activeTab === 'list' ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-xl group-focus-within:text-maroon transition-colors">search</span>
                  <input type="text" placeholder="Search partner institutions..." className="w-full pl-12 pr-10 py-3 bg-white/70 backdrop-blur-xl border border-black/5 rounded-2xl shadow-sm outline-none font-bold focus:bg-white focus:ring-4 focus:ring-maroon/10 focus:border-maroon/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-sm sm:text-base text-slate-900 placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-maroon transition-colors flex items-center justify-center hover:scale-110 active:scale-95">
                      <span className="material-symbols-outlined !text-lg">close</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 items-center no-scrollbar">
                  {COLLEGES.map(c => (
                    <button key={c} onClick={() => setFilterCollege(c)} className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wide transition-all whitespace-nowrap flex-shrink-0 border ${filterCollege === c ? 'bg-maroon text-white border-transparent shadow-sm' : 'bg-white/70 text-slate-600 border-black/5 hover:bg-white hover:text-slate-800 shadow-sm'}`}>{c}</button>
                  ))}
                </div>
              </div>

              {filteredMoas.length > 0 ? (
                <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all flex flex-col">
                  {/* Mobile View: Cards */}
                  <div className="sm:hidden divide-y divide-black/5">
                    {filteredMoas.map((moa, index) => (
                      <div key={moa.id} className="p-5 hover:bg-black/[0.02] transition-colors animate-in fade-in" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                        <div className="font-bold tracking-tight text-slate-800 mb-2">{moa.companyName}</div>
                        <div className="text-xs font-bold text-slate-600 space-y-1.5 mb-3">
                          <div>{moa.hteId}</div>
                          <div>{moa.contactPerson}</div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide whitespace-nowrap w-fit mb-3 ${moa.status?.includes('APPROVED') ? 'bg-green-100/50 text-green-700' : moa.status?.includes('PENDING') ? 'bg-blue-100/50 text-blue-700' : moa.status?.includes('EXPIRING') ? 'bg-orange-100/50 text-orange-700' : 'bg-red-100/50 text-red-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${moa.status?.includes('APPROVED') ? 'bg-green-500' : moa.status?.includes('PENDING') ? 'bg-blue-500' : moa.status?.includes('EXPIRING') ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                          {moa.status?.split(':')[0]}
                        </span>
                        {(isAdmin || isStaff) && (
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="px-3 py-1.5 rounded-md font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs transition-colors"><span className="material-symbols-outlined !text-sm">edit</span></button>
                            {isAdmin && <button onClick={() => handleArchive(moa.id, moa.companyName)} className="px-3 py-1.5 rounded-md font-bold text-red-700 bg-red-50 hover:bg-red-100 text-xs transition-colors"><span className="material-symbols-outlined !text-sm">delete</span></button>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop View: Table */}
                  <div className="hidden sm:block overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
                      <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
                      <tr><th className="p-2 sm:p-4 lg:p-6">Partner</th><th className="p-2 sm:p-4 lg:p-6">Contact</th><th className="p-2 sm:p-4 lg:p-6 hidden sm:table-cell">Industry</th><th className="p-2 sm:p-4 lg:p-6">College</th><th className="p-2 sm:p-4 lg:p-6 hidden lg:table-cell">Effective</th><th className="p-2 sm:p-4 lg:p-6">Status</th>{(isAdmin || isStaff) && <th className="p-2 sm:p-4 lg:p-6 text-right">Actions</th>}</tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredMoas.map((moa, index) => (
                        <tr key={moa.id} className="hover:bg-white/50 hover:shadow-sm transition-all duration-300 font-bold group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                          <td className="p-2 sm:p-4 lg:p-6"><div className="font-bold tracking-tight text-slate-800 text-xs sm:text-sm lg:text-base group-hover:text-maroon transition-colors duration-300 line-clamp-1">{moa.companyName}</div><div className="text-[9px] sm:text-[10px] text-slate-500 font-mono tracking-wider line-clamp-1 mt-0.5">{moa.hteId}</div></td>
                          <td className="p-2 sm:p-4 lg:p-6 text-slate-700 text-xs sm:text-sm"><div className="font-bold">{moa.contactPerson || '-'}</div><div className="text-[9px] sm:text-[10px] text-slate-500 truncate mt-0.5">{moa.contactEmail || '-'}</div></td>
                          <td className="p-2 sm:p-4 lg:p-6 text-slate-600 text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">{moa.industry || '-'}</td>
                          <td className="p-2 sm:p-4 lg:p-6 text-slate-600 uppercase text-xs sm:text-xs whitespace-nowrap tracking-wide">{moa.college}</td>
                          <td className="p-2 sm:p-4 lg:p-6 text-slate-600 text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">{moa.effectiveDate ? new Date(moa.effectiveDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: '2-digit' }) : '-'}</td>
                          <td className="p-2 sm:p-4 lg:p-6"><StatusBadge status={moa.status} /></td>
                          {(isAdmin || isStaff) && (
                            <td className="p-2 sm:p-4 lg:p-6 text-right space-x-1 sm:space-x-2 flex justify-end">
                              <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors active:scale-95" title="Edit"><span className="material-symbols-outlined !text-base sm:!text-lg">edit</span></button>
                              {isAdmin && <button onClick={() => handleArchive(moa.id, moa.companyName)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors active:scale-95" title="Archive"><span className="material-symbols-outlined !text-base sm:!text-lg">archive</span></button>}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4 bg-white/70 backdrop-blur-2xl rounded-3xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all group hover:bg-white/80">
                  <div className="w-20 h-20 bg-slate-100/50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <span className="material-symbols-outlined !text-4xl text-slate-400">search_off</span>
                  </div>
                  <p className="text-slate-500 font-bold text-sm">No matching MOAs found</p>
                </div>
              )}
            </div>
            ) : activeTab === 'archive' && isAdmin ? (
              <ArchiveVault moas={archivedMoas} onRestore={handleRestore} onPermanentDelete={handlePermanentDelete} isAdmin={isAdmin} />
            ) : ( <AuditTable logs={auditLogs} /> )}
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
          <div className="absolute left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-3xl border-r border-black/5 p-6 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.1)] animate-in slide-in-from-left duration-300 ease-out">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-maroon rounded-xl text-white flex items-center justify-center shadow-sm"><span className="material-symbols-outlined !text-xl">school</span></div>
                <div>
                  <h1 className="font-bold tracking-tight text-lg text-slate-900 leading-tight">Portal</h1>
                  <p className="text-[10px] font-bold text-maroon uppercase tracking-wider">{role}</p>
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
                className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                  activeTab === 'list' ? 'bg-maroon text-white' : 'text-slate-600 hover:bg-black/5'
                }`}
              >
                <span className="material-symbols-outlined">dashboard</span> Directory
              </button>
              {role === 'admin' && (
                <button
                  onClick={() => { setActiveTab('archive'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                    activeTab === 'archive' ? 'bg-maroon text-white' : 'text-slate-600 hover:bg-black/5'
                  }`}
                >
                  <span className="material-symbols-outlined">inventory_2</span> Archive Vault
                </button>
              )}
              {role === 'admin' && (
                <button
                  onClick={() => { setActiveTab('audit'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                    activeTab === 'audit' ? 'bg-maroon text-white' : 'text-slate-600 hover:bg-black/5'
                  }`}
                >
                  <span className="material-symbols-outlined">history</span> Audit Trail
                </button>
              )}
            </nav>
            
            <button onClick={() => signOut(auth)} className="p-3 bg-black/5 hover:bg-black/10 rounded-xl font-bold text-slate-700 active:scale-95 flex items-center justify-center gap-2 transition-all"><span className="material-symbols-outlined">logout</span> Sign Out</button>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-[60] animate-in fade-in duration-400">
          <form onSubmit={handleSave} className="bg-white/90 backdrop-blur-3xl border border-black/5 w-full max-w-sm sm:max-w-md lg:max-w-xl rounded-3xl sm:rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-out flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-6 sm:px-8 sm:py-6 border-b border-black/5 shrink-0 bg-white/50">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{editId ? 'Update' : 'New'} Agreement</h3>
            </div>
            
            <div className="p-6 sm:p-8 space-y-4 flex-1 overflow-y-auto">
              {/* Row 1: HTE ID & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InputField label="HTE ID" value={formData.hteId} onChange={v => setFormData({...formData, hteId: v})} placeholder="e.g. 2026-CICS-001" />
                <InputField label="Partner Institution" value={formData.companyName} onChange={v => setFormData({...formData, companyName: v})} placeholder="e.g. Microsoft Philippines" />
              </div>
              
              {/* Row 2: Address */}
              <InputField label="Address of Company" value={formData.address} onChange={v => setFormData({...formData, address: v})} placeholder="e.g. 123 Business Ave, Manila" />
              
              {/* Row 3: Contact Person & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InputField label="Contact Person" value={formData.contactPerson} onChange={v => setFormData({...formData, contactPerson: v})} placeholder="Full name" />
                <InputField label="Contact Email" value={formData.contactEmail} onChange={v => setFormData({...formData, contactEmail: v})} placeholder="email@example.com" />
              </div>
              
              {/* Row 4: Industry & Effective Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <SelectField label="Type of Industry" value={formData.industry} options={INDUSTRIES} onChange={v => setFormData({...formData, industry: v})} />
                <InputField label="Effective Date" type="date" value={formData.effectiveDate} onChange={v => setFormData({...formData, effectiveDate: v})} />
              </div>
              
              {/* Row 5: Expiry Date & Endorsed By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InputField label="Expiry Date" type="date" value={formData.expiryDate} onChange={v => setFormData({...formData, expiryDate: v})} />
                <InputField label="Endorsed by College" value={formData.endorsedBy} onChange={v => setFormData({...formData, endorsedBy: v})} placeholder="College name" />
              </div>
              
              {/* Row 6: College & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <SelectField label="Assigned College" value={formData.college} options={COLLEGES.filter(c => c !== "ALL")} onChange={v => setFormData({...formData, college: v})} />
                <SelectField label="Status" value={formData.status} options={MOA_STATUSES} onChange={v => setFormData({...formData, status: v})} />
              </div>
              
              {/* Row 7: Notes */}
              <div className="text-left">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl font-bold text-slate-800 focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 transition-all text-sm h-24 resize-none placeholder:text-slate-400 custom-scrollbar" />
              </div>
            </div>
            <div className="px-6 py-5 sm:px-8 border-t border-black/5 shrink-0 bg-white/50 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="font-bold text-slate-700 bg-white border border-black/5 hover:bg-slate-50 transition-all px-5 py-2.5 rounded-xl text-sm shadow-sm active:scale-95">Discard</button>
              <button type="submit" className="bg-maroon text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-maroon/90 active:scale-95 transition-all text-sm">Save Record</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for absolute cleanliness ---
const SidebarBtn = memo(({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all duration-300 group ${active ? 'bg-maroon text-white shadow-md hover:shadow-lg hover:-translate-y-0.5' : 'text-slate-600 hover:bg-black/5 hover:translate-x-1 hover:text-slate-900'}`}>
    <span className="material-symbols-outlined !text-lg group-hover:scale-110 transition-transform duration-300">{icon}</span> {label}
  </button>
));

const StatusBadge = memo(({ status }) => {
  const safeStatus = String(status || '');
  let bgColor = 'bg-slate-100/50 text-slate-700';
  let dotColor = 'bg-slate-400';
  if (safeStatus.includes('APPROVED')) { bgColor = 'bg-green-100/50 text-green-700'; dotColor = 'bg-green-500'; }
  else if (safeStatus.includes('PENDING')) { bgColor = 'bg-blue-100/50 text-blue-700'; dotColor = 'bg-blue-500'; }
  else if (safeStatus.includes('EXPIRING')) { bgColor = 'bg-orange-100/50 text-orange-700'; dotColor = 'bg-orange-500'; }
  else if (safeStatus.includes('EXPIRED')) { bgColor = 'bg-red-100/50 text-red-700'; dotColor = 'bg-red-500'; }
  
  const shortStatus = safeStatus.split(':')[0] || safeStatus || 'UNKNOWN';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide whitespace-nowrap w-fit line-clamp-1 ${bgColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`}></span>
      {shortStatus}
    </span>
  );
});

const InputField = memo(({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="text-left">
    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <input required type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl font-bold text-slate-800 focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 transition-all text-sm placeholder:text-slate-400" />
  </div>
));

const SelectField = memo(({ label, value, options, onChange }) => (
  <div className="text-left">
    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl font-bold text-slate-800 focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 transition-all text-sm appearance-none">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
));

const AuditTable = memo(({ logs }) => {
  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    if (typeof ts.toDate === 'function') return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="space-y-5">
    {logs.length > 0 ? (
      <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all">
        {/* Mobile View: Stacked Cards */}
        <div className="block sm:hidden divide-y divide-black/5">
          {logs.map((log) => (
            <div key={log.id} className="p-5 flex flex-col gap-3 hover:bg-black/[0.02] transition-colors duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold tracking-tight text-slate-800 text-sm mb-0.5">{log.userName}</div>
                  <div className="text-[9px] text-slate-400 font-mono">{log.userEmail}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide whitespace-nowrap ${
                  log.operation === 'INSERT' ? 'bg-green-100/50 text-green-700' :
                  log.operation === 'EDIT' ? 'bg-blue-100/50 text-blue-700' :
                  log.operation === 'ARCHIVE' ? 'bg-red-100/50 text-red-700' :
                  'bg-slate-100/50 text-slate-700'
                }`}>
                  {log.operation}
                </span>
              </div>
              <div className="bg-black/[0.02] rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target</p>
                <p className="font-bold text-slate-700 text-xs line-clamp-2">{log.details || log.targetHte}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 bg-black/[0.03] px-2.5 py-1 rounded-md tracking-wide">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
            <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
              <tr>
                <th className="p-3 sm:p-6 lg:p-8 whitespace-nowrap">User</th>
                <th className="p-3 sm:p-6 lg:p-8 whitespace-nowrap">Action</th>
                <th className="p-3 sm:p-6 lg:p-8 whitespace-nowrap">Target</th>
                <th className="p-3 sm:p-6 lg:p-8 whitespace-nowrap text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-black/[0.02] transition-colors duration-200">
                  <td className="p-3 sm:p-6 lg:p-8">
                    <div className="font-bold tracking-tight text-slate-800 text-xs sm:text-sm line-clamp-1 mb-0.5">{log.userName}</div>
                    <div className="text-[8px] sm:text-[10px] text-slate-500 font-mono truncate">{log.userEmail}</div>
                  </td>
                  <td className="p-3 sm:p-6 lg:p-8">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide whitespace-nowrap block w-min ${
                      log.operation === 'INSERT' ? 'bg-green-100/50 text-green-700' :
                      log.operation === 'EDIT' ? 'bg-blue-100/50 text-blue-700' :
                      log.operation === 'ARCHIVE' ? 'bg-red-100/50 text-red-700' :
                      'bg-slate-100/50 text-slate-700'
                    }`}>
                      {log.operation}
                    </span>
                  </td>
                  <td className="p-3 sm:p-6 lg:p-8 text-slate-700 font-bold text-xs sm:text-sm truncate max-w-[200px]">{log.details || log.targetHte}</td>
                  <td className="p-3 sm:p-6 lg:p-8 text-slate-500 text-[10px] sm:text-xs whitespace-nowrap text-right font-bold tracking-wide">{formatTimestamp(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <div className="py-20 text-center space-y-3 bg-white/70 backdrop-blur-2xl rounded-3xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all">
        <span className="material-symbols-outlined !text-5xl text-slate-300 block">history</span>
        <p className="text-slate-500 font-bold text-sm">No audit logs available</p>
      </div>
    )}
  </div>
  );
});

const ArchiveVault = memo(({ moas, onRestore, onPermanentDelete, isAdmin }) => (
  <div className="space-y-5">
    {moas.length > 0 ? (
      <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all flex flex-col">
        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-black/5">
          {moas.map(moa => (
            <div key={moa.id} className="p-5 hover:bg-black/[0.02] transition-colors animate-in fade-in">
              <div className="font-bold tracking-tight text-slate-800 mb-2">{moa.companyName}</div>
              <div className="text-xs font-bold text-slate-600 space-y-1.5 mb-3">
                <div>{moa.hteId}</div>
                <div>{moa.contactPerson}</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide whitespace-nowrap w-fit mb-3 bg-slate-100 text-slate-500">
                ARCHIVED
              </span>
              {isAdmin && (
                <div className="flex gap-2 mt-1">
                  <button onClick={() => onRestore(moa.id, moa.companyName)} className="px-3 py-1.5 rounded-md font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs transition-colors flex items-center gap-1"><span className="material-symbols-outlined !text-sm">restore</span> Restore</button>
                  <button onClick={() => onPermanentDelete(moa.id, moa.companyName)} className="px-3 py-1.5 rounded-md font-bold text-red-700 bg-red-50 hover:bg-red-100 text-xs transition-colors flex items-center gap-1"><span className="material-symbols-outlined !text-sm">delete_forever</span> Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
            <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
              <tr>
                <th className="p-3 sm:p-4 lg:p-6">Partner</th>
                <th className="p-3 sm:p-4 lg:p-6">Contact</th>
                <th className="p-3 sm:p-4 lg:p-6 hidden sm:table-cell">Industry</th>
                <th className="p-3 sm:p-4 lg:p-6">College</th>
                <th className="p-3 sm:p-4 lg:p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {moas.map(moa => (
                <tr key={moa.id} className="hover:bg-white/50 hover:shadow-sm transition-all duration-300 font-bold group animate-in fade-in slide-in-from-bottom-2">
                  <td className="p-3 sm:p-4 lg:p-6">
                    <div className="font-bold tracking-tight text-slate-800 text-xs sm:text-sm lg:text-base group-hover:text-slate-900 transition-colors duration-300 line-clamp-1">{moa.companyName}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono tracking-wider line-clamp-1 mt-0.5">{moa.hteId}</div>
                  </td>
                  <td className="p-3 sm:p-4 lg:p-6 text-slate-700 text-xs sm:text-sm">
                    <div className="font-bold">{moa.contactPerson || '-'}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 truncate mt-0.5">{moa.contactEmail || '-'}</div>
                  </td>
                  <td className="p-3 sm:p-4 lg:p-6 text-slate-600 text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">{moa.industry || '-'}</td>
                  <td className="p-3 sm:p-4 lg:p-6 text-slate-600 uppercase text-xs sm:text-xs whitespace-nowrap tracking-wide">{moa.college}</td>
                  <td className="p-3 sm:p-4 lg:p-6 text-right space-x-2 flex justify-end">
                    {isAdmin && (
                      <>
                        <button onClick={() => onRestore(moa.id, moa.companyName)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors active:scale-95 flex items-center justify-center" title="Restore"><span className="material-symbols-outlined !text-base sm:!text-lg">restore</span></button>
                        <button onClick={() => onPermanentDelete(moa.id, moa.companyName)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors active:scale-95 flex items-center justify-center" title="Permanent Delete"><span className="material-symbols-outlined !text-base sm:!text-lg">delete_forever</span></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <div className="py-24 text-center space-y-4 bg-white/70 backdrop-blur-2xl rounded-3xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all group hover:bg-white/80">
        <div className="w-20 h-20 bg-slate-100/50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-500 shadow-inner">
          <span className="material-symbols-outlined !text-4xl text-slate-400">inventory_2</span>
        </div>
        <p className="text-slate-500 font-bold text-sm">Vault is empty.</p>
      </div>
    )}
  </div>
));

export { AdminDashboard };