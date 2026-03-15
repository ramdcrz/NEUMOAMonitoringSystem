import { useState, useEffect, useMemo, memo } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { createMOA, subscribeToMOAs, archiveMOA, subscribeToAudit, updateMOA, restoreMOA, deleteMOAPermanently } from '../services/moaService';
import { exportMOAsToPDF } from '../services/reportService';

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
const MOA_STATUSES = [
  "APPROVED: Signed by President",
  "APPROVED: In Notarization",
  "APPROVED: Active (No Notarization)",
  "PROCESSING: Awaiting signature of the MOA draft by HTE partner.",
  "PROCESSING: MOA draft sent to Legal Office for Review.",
  "PROCESSING: MOA draft and Opinion of Legal Office sent to VPAA/OP for approval.",
  "EXPIRED: Terminated",
  "EXPIRING: Renewal Required"
];
const INDUSTRIES = ["Technology", "Healthcare", "Education", "Finance", "Manufacturing", "Energy", "Retail", "Hospitality", "Government", "Non-profit", "Other"];

const getFullCollegeName = (val) => {
  if (!val) return 'N/A';
  const match = COLLEGES.find(c => c.name === val || c.acronym === val || String(val).includes(c.acronym));
  return match && match.name !== "ALL" ? match.name : val;
};

const AdminDashboard = ({ user, role }) => {
  const [moas, setMoas] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCollege, setFilterCollege] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedMoa, setSelectedMoa] = useState(null);
  const [formData, setFormData] = useState({ 
    hteId: '', 
    companyName: '', 
    address: '',
    contactPerson: '',
    contactEmail: '',
    industry: '',
    effectiveDate: '',
    expiryDate: '',
    college: '',
    endorsedBy: '',
    status: 'PROCESSING: MOA draft sent to Legal Office for Review.',
    notes: ''
  });

  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  useEffect(() => {
    const unsubMOAs = subscribeToMOAs((data) => setMoas(data));
    let unsubAudit = () => {};
    let unsubUsers = () => {};
    if (isAdmin) {
      unsubAudit = subscribeToAudit((data) => setAuditLogs(data));
      const q = query(collection(db, "users"));
      unsubUsers = onSnapshot(q, (snap) => setSystemUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
    return () => { unsubMOAs(); unsubAudit(); unsubUsers(); };
  }, [isAdmin]);

  const filteredMoas = useMemo(() => moas.filter(m => {
    if (!m) return false;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = 
      String(m.companyName || '').toLowerCase().includes(lowerSearch) || 
      String(m.hteId || '').toLowerCase().includes(lowerSearch) ||
      String(m.contactPerson || '').toLowerCase().includes(lowerSearch) ||
      String(m.address || '').toLowerCase().includes(lowerSearch) ||
      String(m.industry || '').toLowerCase().includes(lowerSearch) ||
      String(m.status || '').toLowerCase().includes(lowerSearch) ||
      String(m.college || '').toLowerCase().includes(lowerSearch);
    const matchesCollege = filterCollege === "ALL" || String(m.college || '').toLowerCase().includes(filterCollege.toLowerCase()) || String(m.college || '').includes(COLLEGES.find(c => c.name === filterCollege)?.acronym);
    return !m.isDeleted && matchesSearch && matchesCollege;
  }), [moas, searchTerm, filterCollege]);

  const archivedMoas = useMemo(() => moas.filter(m => {
    if (!m) return false;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = 
      String(m.companyName || '').toLowerCase().includes(lowerSearch) || 
      String(m.hteId || '').toLowerCase().includes(lowerSearch) ||
      String(m.contactPerson || '').toLowerCase().includes(lowerSearch) ||
      String(m.address || '').toLowerCase().includes(lowerSearch) ||
      String(m.industry || '').toLowerCase().includes(lowerSearch) ||
      String(m.status || '').toLowerCase().includes(lowerSearch) ||
      String(m.college || '').toLowerCase().includes(lowerSearch);
    const matchesCollege = filterCollege === "ALL" || String(m.college || '').toLowerCase().includes(filterCollege.toLowerCase()) || String(m.college || '').includes(COLLEGES.find(c => c.name === filterCollege)?.acronym);
    return m.isDeleted && matchesSearch && matchesCollege;
  }), [moas, searchTerm, filterCollege]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (formData.effectiveDate && formData.expiryDate && formData.expiryDate <= formData.effectiveDate) {
      toast.error('Expiry date must be strictly after the Effective Date.');
      return;
    }

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
    if (window.confirm(`Restore ${name} from the Archive?`)) {
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

  const handleUpdateUserRole = async (email, newRole) => {
    const loadToast = toast.loading('Updating role...');
    try {
      await updateDoc(doc(db, "users", email), { role: newRole });
      toast.success('Role updated!', { id: loadToast });
    } catch (err) {
      toast.error('Failed to update role.', { id: loadToast });
    }
  };

  const handleToggleBlock = async (email, currentStatus) => {
    const action = currentStatus ? "unblock" : "block";
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      const loadToast = toast.loading(`${currentStatus ? 'Unblocking' : 'Blocking'} user...`);
      try {
        await updateDoc(doc(db, "users", email), { blocked: !currentStatus });
        toast.success(`User ${action}ed successfully!`, { id: loadToast });
      } catch (err) {
        toast.error(`Failed to ${action} user.`, { id: loadToast });
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
      industry: '',
      effectiveDate: '',
      expiryDate: '',
      college: '',
      endorsedBy: '',
      status: 'PROCESSING: MOA draft sent to Legal Office for Review.',
      notes: ''
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    let d;
    if (typeof dateValue.toDate === 'function') d = dateValue.toDate();
    else if (dateValue.seconds) d = new Date(dateValue.seconds * 1000);
    else d = new Date(dateValue);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 'N/A';
    let end;
    if (typeof expiryDate.toDate === 'function') end = expiryDate.toDate();
    else if (expiryDate.seconds) end = new Date(expiryDate.seconds * 1000);
    else end = new Date(expiryDate);
    if (isNaN(end.getTime())) return 'N/A';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays} days until renewal required`;
    if (diffDays === 0) return `Expires today`;
    return `Expired ${Math.abs(diffDays)} days ago`;
  };

  const toInputDate = (dateValue) => {
    if (!dateValue) return '';
    let d;
    if (typeof dateValue.toDate === 'function') d = dateValue.toDate();
    else if (dateValue.seconds) d = new Date(dateValue.seconds * 1000);
    else d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
            <p className="text-[10px] font-bold text-maroon uppercase tracking-wider truncate">{role}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarBtn active={activeTab === 'list'} icon="dashboard" label="Directory" onClick={() => setActiveTab('list')} />
          {isAdmin && <SidebarBtn active={activeTab === 'users'} icon="manage_accounts" label="User Management" onClick={() => setActiveTab('users')} />}
          {isAdmin && <SidebarBtn active={activeTab === 'audit' || activeTab === 'archive'} icon="history" label="Audit Trail" onClick={() => setActiveTab('audit')} />}
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
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-black/5 p-4 sm:p-6 lg:p-10 pb-3 sm:pb-4 lg:pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-white/50 hover:bg-white text-slate-800 rounded-xl border border-black/5 shadow-sm transition-all active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">{activeTab === 'list' ? 'Directory' : activeTab === 'audit' ? 'Audit Trail' : activeTab === 'users' ? 'User Management' : 'Archive'}</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {activeTab === 'list' && (isAdmin || isStaff) && (
              <>
                <button onClick={() => exportMOAsToPDF(moas)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm active:scale-95 text-sm whitespace-nowrap"><span className="material-symbols-outlined !text-lg">description</span> <span className="hidden sm:inline">Export PDF</span></button>
                <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-maroon to-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 text-sm whitespace-nowrap"><span className="material-symbols-outlined !text-lg">add</span> New Entry</button>
              </>
            )}
            {activeTab === 'audit' && isAdmin && (
              <button onClick={() => setActiveTab('archive')} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm active:scale-95 text-sm whitespace-nowrap"><span className="material-symbols-outlined !text-lg text-slate-400">inventory_2</span> Archive</button>
            )}
            {activeTab === 'archive' && isAdmin && (
              <button onClick={() => setActiveTab('audit')} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm active:scale-95 text-sm whitespace-nowrap"><span className="material-symbols-outlined !text-lg text-slate-400">arrow_back</span> Back to Audit</button>
            )}
          </div>
        </header>

        <section className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {activeTab === 'list' ? (
            <div className="space-y-5">
              <div className="flex flex-row gap-2 sm:gap-3 w-full">
                <div className="relative flex-1 flex items-center gap-2 px-3 sm:px-4 py-3 bg-white/70 backdrop-blur-xl border border-black/5 rounded-xl sm:rounded-2xl shadow-sm focus-within:bg-white focus-within:ring-4 focus-within:ring-maroon/10 focus-within:border-maroon/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group">
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

              {filteredMoas.length > 0 ? (
                <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all">
                  {/* Mobile View: Cards */}
                  <div className="sm:hidden divide-y divide-black/5">
                    {filteredMoas.map((moa, index) => (
                      <div key={moa.id} onClick={() => setSelectedMoa(moa)} className="p-5 hover:bg-black/[0.02] transition-colors animate-in fade-in cursor-pointer" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                        <div className="font-bold tracking-tight text-slate-800 mb-1">{moa.companyName}</div>
                        <div className="text-[10px] font-bold text-slate-500 font-mono tracking-wider mb-1">{moa.hteId}</div>
                        <div className="text-[11px] font-bold text-slate-600 tracking-wider mb-3">Industry: {moa.industry || 'N/A'}</div>
                        <div className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">{COLLEGES.find(c => c.name === moa.college || c.acronym === moa.college)?.acronym || moa.college}</div>
                        <div className="mb-3">
                          <StatusBadge status={moa.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop View: Table */}
                  <div className="hidden sm:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
                      <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
                      <tr><th className="p-2 sm:p-4 lg:p-6">Partner & ID</th><th className="p-2 sm:p-4 lg:p-6 hidden sm:table-cell">Industry</th><th className="p-2 sm:p-4 lg:p-6">College</th><th className="p-2 sm:p-4 lg:p-6">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredMoas.map((moa, index) => (
                        <tr key={moa.id} onClick={() => setSelectedMoa(moa)} className="hover:bg-white/50 hover:shadow-sm transition-all duration-300 font-bold group animate-in fade-in slide-in-from-bottom-2 cursor-pointer" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                          <td className="p-2 sm:p-4 lg:p-6"><div className="font-bold tracking-tight text-slate-800 text-xs sm:text-sm lg:text-base group-hover:text-maroon transition-colors duration-300 line-clamp-1">{moa.companyName}</div><div className="text-[9px] sm:text-[10px] text-slate-500 font-mono tracking-wider line-clamp-1 mt-0.5">{moa.hteId}</div></td>
                          <td className="p-2 sm:p-4 lg:p-6 text-slate-600 text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">{moa.industry || '-'}</td>
                          <td className="p-2 sm:p-4 lg:p-6 text-slate-600 uppercase text-xs sm:text-xs whitespace-nowrap tracking-wide">{COLLEGES.find(c => c.name === moa.college || c.acronym === moa.college)?.acronym || moa.college}</td>
                          <td className="p-2 sm:p-4 lg:p-6"><StatusBadge status={moa.status} /></td>
                          {(isAdmin || isStaff) && (
                            <td className="p-2 sm:p-4 lg:p-6 text-right space-x-1 sm:space-x-2 flex justify-end" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { 
                              setEditId(moa.id); 
                              setFormData({
                                hteId: moa.hteId || '',
                                companyName: moa.companyName || '',
                                address: moa.address || '',
                                contactPerson: moa.contactPerson || '',
                                contactEmail: moa.contactEmail || '',
                                industry: moa.industry || 'Technology',
                                effectiveDate: toInputDate(moa.effectiveDate),
                                expiryDate: toInputDate(moa.expiryDate),
                                college: moa.college || 'College of Informatics and Computing Studies',
                                endorsedBy: moa.endorsedBy || '',
                                status: moa.status || 'PENDING: Legal Review',
                                notes: moa.notes || ''
                              }); 
                              setIsModalOpen(true); 
                            }} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors active:scale-95" title="Edit"><span className="material-symbols-outlined !text-base sm:!text-lg">edit</span></button>
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
            ) : activeTab === 'users' && isAdmin ? (
              <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all">
                {/* Mobile View */}
                <div className="sm:hidden divide-y divide-black/5">
                  {systemUsers.map(sysUser => (
                    <div key={sysUser.id} className="p-5 flex flex-col gap-4">
                      <div>
                        <div className="font-bold text-slate-800 line-clamp-1">{sysUser.name}</div>
                        <div className="text-[10px] font-bold text-slate-500 font-mono mt-0.5">{sysUser.email}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <select value={sysUser.role || 'student'} onChange={(e) => handleUpdateUserRole(sysUser.email, e.target.value)} className="bg-black/[0.03] border border-transparent rounded-lg px-3 py-1.5 outline-none font-bold text-slate-700 text-xs focus:bg-white focus:ring-2 focus:ring-maroon/20 cursor-pointer transition-all">
                          <option value="student">Student</option>
                          <option value="staff">Faculty</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => handleToggleBlock(sysUser.email, sysUser.blocked)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 ${sysUser.blocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                          {sysUser.blocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
                    <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
                      <tr><th className="p-3 sm:p-4 lg:p-6">User</th><th className="p-3 sm:p-4 lg:p-6">Role</th><th className="p-3 sm:p-4 lg:p-6">Status</th><th className="p-3 sm:p-4 lg:p-6 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {systemUsers.map(sysUser => (
                        <tr key={sysUser.id} className="hover:bg-black/[0.02] transition-colors duration-200">
                          <td className="p-3 sm:p-4 lg:p-6"><div className="font-bold text-slate-800 line-clamp-1">{sysUser.name}</div><div className="text-[10px] text-slate-500 font-mono mt-0.5">{sysUser.email}</div></td>
                          <td className="p-3 sm:p-4 lg:p-6">
                            <select value={sysUser.role || 'student'} onChange={(e) => handleUpdateUserRole(sysUser.email, e.target.value)} className="bg-black/[0.03] border border-transparent rounded-lg px-3 py-1.5 outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-maroon/20 cursor-pointer transition-all">
                              <option value="student">Student</option>
                              <option value="staff">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-3 sm:p-4 lg:p-6"><span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide w-fit ${sysUser.blocked ? 'bg-red-100/50 text-red-700' : 'bg-green-100/50 text-green-700'}`}><span className={`w-1.5 h-1.5 rounded-full ${sysUser.blocked ? 'bg-red-500' : 'bg-green-500'}`}></span>{sysUser.blocked ? 'Blocked' : 'Active'}</span></td>
                          <td className="p-3 sm:p-4 lg:p-6 text-right">
                            <button onClick={() => handleToggleBlock(sysUser.email, sysUser.blocked)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 ${sysUser.blocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>{sysUser.blocked ? 'Unblock' : 'Block User'}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  activeTab === 'list' ? 'bg-gradient-to-r from-maroon to-red-700 text-white' : 'text-slate-600 hover:bg-black/5'
                }`}
              >
                <span className="material-symbols-outlined">dashboard</span> Directory
              </button>
              {role === 'admin' && (
                <button
                  onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                    activeTab === 'users' ? 'bg-gradient-to-r from-maroon to-red-700 text-white' : 'text-slate-600 hover:bg-black/5'
                  }`}
                >
                  <span className="material-symbols-outlined">manage_accounts</span> User Management
                </button>
              )}
              {role === 'admin' && (
                <button
                  onClick={() => { setActiveTab('audit'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${
                    (activeTab === 'audit' || activeTab === 'archive') ? 'bg-gradient-to-r from-maroon to-red-700 text-white' : 'text-slate-600 hover:bg-black/5'
                  }`}
                >
                  <span className="material-symbols-outlined">history</span> Audit Trail
                </button>
              )}
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
              
              {/* Row 4: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InputField label="Effective Date" type="date" value={formData.effectiveDate} onChange={v => setFormData({...formData, effectiveDate: v})} />
                <InputField label="Expiry Date" type="date" value={formData.expiryDate} onChange={v => setFormData({...formData, expiryDate: v})} />
              </div>
              
              {/* Row 5: Colleges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <SelectField label="Assigned College" value={formData.college} options={COLLEGES.filter(c => c.name !== "ALL").map(c => c.name)} onChange={v => setFormData({...formData, college: v})} />
                <SelectField label="Endorsed By" value={formData.endorsedBy} options={COLLEGES.filter(c => c.name !== "ALL").map(c => c.name)} onChange={v => setFormData({...formData, endorsedBy: v})} />
              </div>

              {/* Row 6: Status & Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <SelectField label="Status" value={formData.status} options={MOA_STATUSES} onChange={v => setFormData({...formData, status: v})} />
                <SelectField label="Type of Industry" value={formData.industry} options={INDUSTRIES} onChange={v => setFormData({...formData, industry: v})} />
              </div>
              
              {/* Row 7: Notes */}
              <div className="text-left">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl font-bold text-slate-800 focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 transition-all text-sm h-24 resize-none placeholder:text-slate-400 custom-scrollbar" />
              </div>
            </div>
            <div className="px-6 py-5 sm:px-8 border-t border-black/5 shrink-0 bg-white/50 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="font-bold text-slate-700 bg-white border border-black/5 hover:bg-slate-50 transition-all px-5 py-2.5 rounded-xl text-sm shadow-sm active:scale-95">Discard</button>
              <button type="submit" className="bg-gradient-to-r from-maroon to-red-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md active:scale-95 transition-all text-sm">Save Record</button>
            </div>
          </form>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedMoa && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-in fade-in duration-300" onClick={() => setSelectedMoa(null)}>
          <div className="bg-white/90 backdrop-blur-3xl border border-black/5 w-full max-w-2xl rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-out flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-6 sm:px-8 sm:py-6 border-b border-black/5 shrink-0 bg-white/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{selectedMoa.companyName}</h3>
                <p className="text-xs font-bold text-slate-500 font-mono mt-1">{selectedMoa.hteId}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">Industry: {selectedMoa.industry || 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedMoa(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined block !text-xl">close</span>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-8">
              {/* Section: Partnership Details */}
              <section>
                <h4 className="text-xs font-bold text-maroon uppercase tracking-wider mb-4 border-b border-black/5 pb-2">Partnership Details</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned College</p>
                    <p className="text-sm font-bold text-slate-800">{getFullCollegeName(selectedMoa.college)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endorsed By</p>
                    <p className="text-sm font-bold text-slate-800">{getFullCollegeName(selectedMoa.endorsedBy)}</p>
                  </div>
                </div>
              </section>

              {/* Section A: Contact Information */}
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

              {/* Section B: Timeline & Compliance */}
              <section>
                <h4 className="text-xs font-bold text-maroon uppercase tracking-wider mb-4 border-b border-black/5 pb-2">Timeline & Compliance</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Effective Date</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(selectedMoa.effectiveDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(selectedMoa.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <StatusBadge status={selectedMoa.status} />
                  </div>
                  <div className="sm:col-span-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Days Remaining</p>
                    <p className="text-sm font-bold text-slate-800">{getDaysRemaining(selectedMoa.expiryDate)}</p>
                  </div>
                </div>
              </section>

              {/* Section C: Audit Context */}
              <section>
                <h4 className="text-xs font-bold text-maroon uppercase tracking-wider mb-4 border-b border-black/5 pb-2">Audit Context</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created By</p>
                    <p className="text-sm font-bold text-slate-800">{selectedMoa.createdBy || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Modified</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(selectedMoa.lastModified) || formatDate(selectedMoa.createdAt) || 'N/A'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notarization Notes</p>
                    <div className="bg-black/[0.03] rounded-xl p-4 border border-black/5">
                      <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap">{selectedMoa.notes || 'No additional notes provided.'}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Action Footer */}
            {(isAdmin || isStaff) && (
              <div className="px-6 py-5 sm:px-8 border-t border-black/5 shrink-0 bg-white/50 flex justify-end gap-3">
                <button onClick={() => { 
                  setEditId(selectedMoa.id); 
                  setFormData({
                    hteId: selectedMoa.hteId || '',
                    companyName: selectedMoa.companyName || '',
                    address: selectedMoa.address || '',
                    contactPerson: selectedMoa.contactPerson || '',
                    contactEmail: selectedMoa.contactEmail || '',
                    industry: selectedMoa.industry || '',
                    effectiveDate: toInputDate(selectedMoa.effectiveDate),
                    expiryDate: toInputDate(selectedMoa.expiryDate),
                    college: selectedMoa.college || '',
                    endorsedBy: selectedMoa.endorsedBy || '',
                    status: selectedMoa.status || '',
                    notes: selectedMoa.notes || ''
                  }); 
                  setSelectedMoa(null);
                  setIsModalOpen(true); 
                }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors text-sm shadow-sm active:scale-95"><span className="material-symbols-outlined !text-base">edit</span> Edit Entry</button>
                {isAdmin && <button onClick={() => { handleArchive(selectedMoa.id, selectedMoa.companyName); setSelectedMoa(null); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors text-sm shadow-sm active:scale-95"><span className="material-symbols-outlined !text-base">archive</span> Archive</button>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for absolute cleanliness ---
const SidebarBtn = memo(({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all duration-300 group ${active ? 'bg-gradient-to-r from-maroon to-red-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5' : 'text-slate-600 hover:bg-black/5 hover:translate-x-1 hover:text-slate-900'}`}>
    <span className="material-symbols-outlined !text-lg group-hover:scale-110 transition-transform duration-300">{icon}</span> {label}
  </button>
));

const StatusBadge = memo(({ status }) => {
  const safeStatus = String(status || '');
  let bgColor = 'bg-slate-100/50 text-slate-700';
  let dotColor = 'bg-slate-400';
  if (safeStatus.includes('APPROVED')) { bgColor = 'bg-green-100/50 text-green-700'; dotColor = 'bg-green-500'; }
  else if (safeStatus.includes('PROCESSING')) { bgColor = 'bg-blue-100/50 text-blue-700'; dotColor = 'bg-blue-500'; }
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

const InputField = memo(({ label, value, onChange, placeholder = "", type = 'text', min }) => (
  <div className="text-left">
    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <input required type={type} min={min} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl font-bold text-slate-800 focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 transition-all text-sm placeholder:text-slate-400" />
  </div>
));

const SelectField = memo(({ label, value, options = [], onChange }) => (
  <div className="text-left">
    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <select required value={value || ''} onChange={e => onChange(e.target.value)} className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl font-bold text-slate-800 focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 transition-all text-sm appearance-none cursor-pointer">
      <option value="" disabled>Select an option</option>
      {options?.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
));

const AuditTable = memo(({ logs }) => {
  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    let d;
    if (typeof ts.toDate === 'function') d = ts.toDate();
    else if (ts.seconds) d = new Date(ts.seconds * 1000);
    else d = new Date(ts);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
        <div className="hidden sm:block overflow-x-auto custom-scrollbar">
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
      <div className="bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all">
        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-black/5">
          {moas.map(moa => (
            <div key={moa.id} className="p-5 hover:bg-black/[0.02] transition-colors animate-in fade-in cursor-default">
              <div className="font-bold tracking-tight text-slate-800 mb-1">{moa.companyName}</div>
              <div className="text-[10px] font-bold text-slate-500 font-mono tracking-wider mb-1">{moa.hteId}</div>
              <div className="text-[11px] font-bold text-slate-600 tracking-wider mb-3">Industry: {moa.industry || 'N/A'}</div>
              <div className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">{moa.college}</div>
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
        <div className="hidden sm:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
            <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
              <tr>
                <th className="p-3 sm:p-4 lg:p-6">Partner & ID</th>
                <th className="p-3 sm:p-4 lg:p-6 hidden sm:table-cell">Industry</th>
                <th className="p-3 sm:p-4 lg:p-6">College</th>
                <th className="p-3 sm:p-4 lg:p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {moas.map(moa => (
                <tr key={moa.id} className="hover:bg-white/50 hover:shadow-sm transition-all duration-300 font-bold group animate-in fade-in slide-in-from-bottom-2 cursor-default">
                  <td className="p-3 sm:p-4 lg:p-6">
                    <div className="font-bold tracking-tight text-slate-800 text-xs sm:text-sm lg:text-base group-hover:text-slate-900 transition-colors duration-300 line-clamp-1">{moa.companyName}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono tracking-wider line-clamp-1 mt-0.5">{moa.hteId}</div>
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