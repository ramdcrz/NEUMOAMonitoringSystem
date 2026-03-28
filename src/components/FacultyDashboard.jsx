import { useState, useEffect, memo, useMemo } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { subscribeToMOAs, createMOA, updateMOA } from '../services/moaService';
import toast from 'react-hot-toast';
import { StatisticsView } from './StatisticsDashboard';

const MOA_STATUSES = [
  'APPROVED: Signed by President',
  'APPROVED: In Notarization',
  'APPROVED: Active (No Notarization)',
  'PROCESSING: Awaiting signature of the MOA draft by HTE partner.',
  'PROCESSING: MOA draft sent to Legal Office for Review.',
  'PROCESSING: MOA draft and Opinion of Legal Office sent to VPAA/OP for approval.',
  'EXPIRED: Terminated',
  'EXPIRING: Renewal Required'
];

const INDUSTRIES = ['Technology', 'Healthcare', 'Education', 'Finance', 'Manufacturing', 'Energy', 'Retail', 'Hospitality', 'Government', 'Non-profit', 'Other'];
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

const getFullCollegeName = (val) => {
  if (!val) return 'N/A';
  const match = COLLEGES.find(c => c.name === val || c.acronym === val || String(val).includes(c.acronym));
  return match && match.name !== "ALL" ? match.name : val;
};

export const FacultyDashboard = ({ user }) => {
  const [moas, setMoas] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMOAs(docs => {
      const activeMoas = docs.filter(moa => !moa.isDeleted);
      setMoas(activeMoas);
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
        safeString(moa.hteId).includes(query) ||
        safeString(moa.contactPerson).includes(query) ||
        safeString(moa.address).includes(query) ||
        safeString(moa.industry).includes(query) ||
        safeString(moa.status).includes(query) ||
        safeString(moa.college).includes(query);
      
      const matchesCollege = selectedCollege === 'ALL' || 
        safeString(moa.college).includes(selectedCollege.toLowerCase()) || 
        String(moa.college || '').includes(COLLEGES.find(c => c.name === selectedCollege)?.acronym);
        
      return matchesSearch && matchesCollege;
    }).sort((a, b) => String(a.companyName || '').localeCompare(String(b.companyName || '')));
  }, [moas, searchTerm, selectedCollege]);

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

  const handleSave = async e => {
    e.preventDefault();
    
    if (formData.effectiveDate && formData.expiryDate && formData.expiryDate <= formData.effectiveDate) {
      toast.error('Expiry date must be strictly after the Effective Date.');
      return;
    }

    try {
      if (editId) {
        await updateMOA(editId, formData, user);
        toast.success('Agreement updated successfully!', { duration: 2000 });
      } else {
        await createMOA(formData, user);
        toast.success('Agreement created successfully!', { duration: 2000 });
      }
      closeModal();
    } catch (error) {
      toast.error('Error saving agreement', { duration: 2000 });
    }
  };

  const handleArchive = async (id, name) => {
    if (!window.confirm(`Archive agreement with ${name}?`)) return;
    try {
      await updateMOA(id, { isDeleted: true }, user);
      toast.success('Agreement archived', { duration: 2000 });
    } catch (error) {
      toast.error('Error archiving agreement', { duration: 2000 });
    }
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
            <p className="text-[10px] font-bold text-maroon uppercase tracking-wider truncate">FACULTY</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarBtn active={activeTab === 'list'} icon="dashboard" label="Agreements" onClick={() => setActiveTab('list')} />
          <SidebarBtn active={activeTab === 'statistics'} icon="bar_chart" label="Statistics" onClick={() => setActiveTab('statistics')} />
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
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">{activeTab === 'list' ? 'Agreements' : 'Statistics'}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === 'list' && (
              <button onClick={() => setIsModalOpen(true)} className="hidden sm:flex bg-gradient-to-r from-maroon to-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 items-center gap-2 transition-all duration-300 ease-out hover:brightness-110 active:scale-95 text-sm whitespace-nowrap"><span className="material-symbols-outlined !text-lg">add</span> New Agreement</button>
            )}
          </div>
        </header>

        <section className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          {/* Floating Action Button for Mobile */}
          {activeTab === 'list' && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-maroon to-red-700 text-white rounded-full shadow-[0_8px_32px_rgba(128,0,0,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
            >
              <span className="material-symbols-outlined !text-3xl">add</span>
            </button>
          )}
          {activeTab === 'list' ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              {/* Search & Filter */}
              <div className="bg-white/70 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-2xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500">
                <div className="flex flex-row gap-2 sm:gap-3 w-full">
                  <div className="relative flex-1 flex items-center gap-2 px-3 sm:px-4 py-3 bg-black/[0.03] border border-transparent rounded-xl sm:rounded-2xl focus-within:bg-white focus-within:ring-4 focus-within:ring-maroon/10 focus-within:border-maroon/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out group">
                <span className="material-symbols-outlined text-slate-400 !text-xl shrink-0 group-focus-within:text-maroon transition-colors">search</span>
                <input type="text" placeholder="Search by name, ID, contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent outline-none font-bold text-sm sm:text-base text-slate-900 placeholder:text-slate-400" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-maroon transition-colors shrink-0 flex items-center justify-center hover:scale-110 active:scale-95">
                    <span className="material-symbols-outlined !text-lg">close</span>
                  </button>
                )}
                  </div>
                  <div className="relative w-24 sm:w-32 shrink-0 group">
                <select value={selectedCollege} onChange={e => setSelectedCollege(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                  {COLLEGES.map(c => <option key={c.acronym} value={c.name}>{c.name}</option>)}
                </select>
                <div className="w-full h-full px-2 sm:px-3 bg-gradient-to-r from-maroon to-red-700 rounded-xl sm:rounded-2xl shadow-sm font-bold text-white flex items-center justify-center gap-1 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all duration-300 ease-out group-focus-within:ring-4 group-focus-within:ring-red-500/30">
                  <span className="truncate text-xs sm:text-sm">{COLLEGES.find(c => c.name === selectedCollege)?.acronym || 'ALL'}</span>
                  <span className="material-symbols-outlined !text-lg text-white/80 shrink-0">arrow_drop_down</span>
                </div>
                  </div>
                </div>
              </div>

              {/* MOAs Table */}
              {filteredMoas.length > 0 ? (
                <div className="bg-white/70 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all flex flex-col">
                  {/* Mobile Cards */}
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
                        <div className="flex gap-2 mt-1" onClick={e => e.stopPropagation()}>
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
                          }} className="px-3 py-1.5 rounded-md font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs transition-colors"><span className="material-symbols-outlined !text-sm">edit</span></button>
                          <button onClick={() => handleArchive(moa.id, moa.companyName)} className="px-3 py-1.5 rounded-md font-bold text-red-700 bg-red-50 hover:bg-red-100 text-xs transition-colors" title="Archive"><span className="material-symbols-outlined !text-sm">archive</span></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
                      <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
                        <tr>
                          <th className="p-3 sm:p-4 lg:p-6">Partner & ID</th>
                          <th className="p-3 sm:p-4 hidden lg:table-cell">Industry</th>
                          <th className="p-3 sm:p-4 lg:p-6">College</th>
                          <th className="p-3 sm:p-4 hidden lg:table-cell">Status</th>
                          <th className="p-3 sm:p-4 lg:p-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {filteredMoas.map((moa, index) => (
                          <tr key={moa.id} onClick={() => setSelectedMoa(moa)} className="hover:bg-white/50 hover:shadow-sm transition-all duration-300 font-bold group animate-in fade-in slide-in-from-bottom-2 cursor-pointer" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                            <td className="p-3 sm:p-4 lg:p-6"><div className="font-bold tracking-tight text-slate-800 text-xs sm:text-sm lg:text-base group-hover:text-maroon transition-colors duration-300 line-clamp-1">{moa.companyName}</div><div className="text-[9px] sm:text-[10px] text-slate-500 font-mono tracking-wider line-clamp-1 mt-0.5">{moa.hteId}</div></td>
                            <td className="p-3 sm:p-4 text-slate-600 hidden lg:table-cell">{moa.industry || '-'}</td>
                            <td className="p-3 sm:p-4 lg:p-6 text-slate-600 uppercase text-xs sm:text-xs whitespace-nowrap tracking-wide">{COLLEGES.find(c => c.name === moa.college || c.acronym === moa.college)?.acronym || moa.college}</td>
                            <td className="p-3 sm:p-4 hidden lg:table-cell">
                              <StatusBadge status={moa.status} />
                            </td>
                            <td className="p-3 sm:p-4 lg:p-6 text-right space-x-1 sm:space-x-2 flex justify-end" onClick={e => e.stopPropagation()}>
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
                              }} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors active:scale-95"><span className="material-symbols-outlined !text-base">edit</span></button>
                              <button onClick={() => handleArchive(moa.id, moa.companyName)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors active:scale-95" title="Archive"><span className="material-symbols-outlined !text-base">archive</span></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4 bg-white/70 backdrop-blur-2xl rounded-3xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all group hover:bg-white/80">
                  <div className="w-20 h-20 bg-slate-100/50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <span className="material-symbols-outlined !text-4xl text-slate-400">folder_open</span>
                  </div>
                  <p className="text-slate-500 font-bold text-sm">No agreements found</p>
                </div>
              )}
            </div>
          ) : (
            <StatisticsView moas={moas} />
          )}
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
                  <p className="text-[10px] font-bold text-maroon uppercase tracking-wider truncate">FACULTY</p>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <nav className="flex-1 space-y-2">
              <button onClick={() => { setActiveTab('list'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'list' ? 'bg-gradient-to-r from-maroon to-red-700 text-white' : 'text-slate-600 hover:bg-black/5'}`}>
                <span className="material-symbols-outlined">dashboard</span> Agreements
              </button>
              <button onClick={() => { setActiveTab('statistics'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'statistics' ? 'bg-gradient-to-r from-maroon to-red-700 text-white' : 'text-slate-600 hover:bg-black/5'}`}>
                <span className="material-symbols-outlined">bar_chart</span> Statistics
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

            </div>

            {/* Action Footer */}
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
              <button onClick={() => { handleArchive(selectedMoa.id, selectedMoa.companyName); setSelectedMoa(null); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors text-sm shadow-sm active:scale-95"><span className="material-symbols-outlined !text-base">archive</span> Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-400" onMouseDown={closeModal}>
          <form onMouseDown={e => e.stopPropagation()} onSubmit={handleSave} className="bg-white/90 backdrop-blur-3xl border border-black/5 w-full max-w-md rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-6 sm:px-8 sm:py-6 border-b border-black/5 shrink-0 bg-white/50">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{editId ? 'Update' : 'New'} Agreement</h3>
            </div>
            <div className="p-6 sm:p-8 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="HTE ID" value={formData.hteId} onChange={v => setFormData({...formData, hteId: v})} />
                <InputField label="Partner" value={formData.companyName} onChange={v => setFormData({...formData, companyName: v})} />
              </div>
              <InputField label="Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Contact Person" value={formData.contactPerson} onChange={v => setFormData({...formData, contactPerson: v})} />
                <InputField label="Email" type="email" value={formData.contactEmail} onChange={v => setFormData({...formData, contactEmail: v})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Industry" value={formData.industry} options={INDUSTRIES} onChange={v => setFormData({...formData, industry: v})} />
                <InputField label="Effective Date" type="date" value={formData.effectiveDate} onChange={v => setFormData({...formData, effectiveDate: v})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Expiry Date" type="date" min={formData.effectiveDate} value={formData.expiryDate} onChange={v => setFormData({...formData, expiryDate: v})} />
                <SelectField label="Endorsed By" value={formData.endorsedBy} options={COLLEGES.filter(c => c.name !== "ALL").map(c => c.name)} onChange={v => setFormData({...formData, endorsedBy: v})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Assigned College" value={formData.college} options={COLLEGES.filter(c => c.name !== "ALL").map(c => c.name)} onChange={v => setFormData({...formData, college: v})} />
                <SelectField label="Status" value={formData.status} options={MOA_STATUSES} onChange={v => setFormData({...formData, status: v})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-maroon/10 focus:border-maroon/20 transition-all text-sm h-20 resize-none placeholder:text-slate-400 custom-scrollbar" />
              </div>
            </div>
            <div className="px-6 py-5 sm:px-8 border-t border-black/5 shrink-0 bg-white/50 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="font-bold text-slate-700 bg-white border border-black/5 hover:bg-slate-50 transition-all px-5 py-2.5 rounded-xl text-sm shadow-sm active:scale-95">Cancel</button>
              <button type="submit" className="bg-gradient-to-r from-maroon to-red-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md active:scale-95 transition-all text-sm">Save</button>
            </div>
          </form>
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
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <input required type={type} min={min} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-maroon/10 focus:border-maroon/20 transition-all text-sm placeholder:text-slate-400" />
  </div>
));

const SelectField = memo(({ label, value, options = [], onChange }) => (
  <div className="text-left">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <select required value={value || ''} onChange={e => onChange(e.target.value)} className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-maroon/10 focus:border-maroon/20 transition-all text-sm appearance-none cursor-pointer">
      <option value="" disabled>Select an option</option>
      {options?.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
));
