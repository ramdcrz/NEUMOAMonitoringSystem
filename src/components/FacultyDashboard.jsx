import { useState, useEffect, memo } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { subscribeToMOAs, createMOA, updateMOA } from '../services/moaService';
import toast from 'react-hot-toast';

const MOA_STATUSES = [
  'APPROVED: Signed by President',
  'APPROVED: In Notarization',
  'APPROVED: Active (No Notarization)',
  'PENDING: Partner Signature',
  'PENDING: Legal Review',
  'PENDING: University Approval',
  'EXPIRED: Terminated',
  'EXPIRING: Renewal Required'
];

const INDUSTRIES = ['Technology', 'Healthcare', 'Education', 'Finance', 'Manufacturing', 'Energy', 'Retail', 'Hospitality', 'Government', 'Non-profit', 'Other'];
const COLLEGES = ['CICS', 'CBA', 'COE', 'CAS', 'CED'];

export const FacultyDashboard = ({ user }) => {
  const [moas, setMoas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMOAs(docs => {
      const activeMoas = docs.filter(moa => !moa.isDeleted);
      setMoas(activeMoas);
    });
    return unsubscribe;
  }, []);

  const filteredMoas = moas.filter(moa => {
    if (!moa) return false;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = 
      String(moa.companyName || '').toLowerCase().includes(lowerSearch) ||
      String(moa.hteId || '').toLowerCase().includes(lowerSearch) ||
      String(moa.contactPerson || '').toLowerCase().includes(lowerSearch) ||
      String(moa.address || '').toLowerCase().includes(lowerSearch);
    
    const matchesCollege = selectedCollege === 'ALL' || moa.college === selectedCollege;
    return matchesSearch && matchesCollege;
  });

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

  const handleSave = async e => {
    e.preventDefault();
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete agreement with ${name}?`)) return;
    try {
      await updateMOA(id, { isDeleted: true }, user);
      toast.success('Agreement archived', { duration: 2000 });
    } catch (error) {
      toast.error('Error deleting agreement', { duration: 2000 });
    }
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
        <h1 className="font-bold tracking-tight text-lg text-slate-900">Faculty Portal</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white border border-black/5 rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center"><span className="material-symbols-outlined text-slate-700">menu</span></button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 lg:hidden flex items-start justify-end pt-16 pr-4">
          <div className="bg-white/90 backdrop-blur-3xl border border-black/5 rounded-3xl p-6 w-full max-w-xs shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-in slide-in-from-right duration-300">
            <nav className="space-y-3">
              <button onClick={() => { setIsMobileMenuOpen(false); setIsModalOpen(true); }} className="w-full px-4 py-3 rounded-xl bg-maroon text-white font-bold text-left flex items-center gap-3 shadow-sm transition-all active:scale-95">
                <span className="material-symbols-outlined">add</span> New Agreement
              </button>
              <div className="px-4 py-3 rounded-xl bg-black/[0.03] text-slate-700 font-bold text-left flex items-center gap-3">
                <span className="material-symbols-outlined">list</span> Agreements
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white/70 backdrop-blur-2xl border-r border-black/5 p-8 flex-col shrink-0 z-10 transition-all lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-maroon rounded-xl text-white flex items-center justify-center shadow-sm"><span className="material-symbols-outlined !text-xl">school</span></div>
          <div>
            <h1 className="font-bold tracking-tight text-xl text-slate-900">Portal</h1>
            <p className="text-[10px] font-bold text-maroon uppercase tracking-wider">FACULTY</p>
          </div>
        </div>
        <nav className="space-y-3 flex-grow">
          <button onClick={() => setIsModalOpen(true)} className="w-full px-4 py-3 rounded-xl bg-maroon text-white font-bold flex items-center gap-3 hover:bg-maroon/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined">add</span> New Agreement
          </button>
          <div className="px-4 py-3 rounded-xl bg-black/[0.03] hover:bg-black/[0.05] hover:translate-x-1 cursor-pointer text-slate-700 font-bold flex items-center gap-3 transition-all duration-300">
            <span className="material-symbols-outlined transition-transform duration-300 hover:scale-110">list</span> Agreements
          </div>
        </nav>
        <button onClick={() => signOut(auth)} className="p-3 bg-black/5 hover:bg-black/10 hover:shadow-sm hover:-translate-y-0.5 rounded-xl font-bold text-slate-700 active:scale-95 flex items-center justify-center gap-2 transition-all duration-300 w-full"><span className="material-symbols-outlined !text-lg">logout</span> Sign Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Search & Filter */}
          <div className="bg-white/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 backdrop-blur-2xl border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 flex items-center gap-3 bg-black/[0.03] border border-transparent focus-within:bg-white focus-within:border-maroon/20 focus-within:ring-4 focus-within:ring-maroon/10 rounded-xl px-4 py-3 transition-all group">
                <span className="material-symbols-outlined text-slate-400 !text-xl group-focus-within:text-maroon transition-colors">search</span>
                <input type="text" placeholder="Search by name, ID, contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full outline-none bg-transparent font-bold text-slate-800 placeholder:text-slate-400 text-sm sm:text-base pr-8" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-4 text-slate-400 hover:text-maroon transition-colors flex items-center justify-center hover:scale-110 active:scale-95">
                    <span className="material-symbols-outlined !text-lg">close</span>
                  </button>
                )}
              </div>
              <select value={selectedCollege} onChange={e => setSelectedCollege(e.target.value)} className="w-full sm:w-48 p-3.5 bg-black/[0.03] border border-transparent focus:bg-white focus:border-maroon/20 focus:ring-4 focus:ring-maroon/10 rounded-xl outline-none font-bold text-slate-700 transition-all appearance-none text-sm cursor-pointer">
                <option value="ALL">All Colleges</option>
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* MOAs Table */}
          {filteredMoas.length > 0 ? (
            <div className="bg-white/70 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-black/5 overflow-hidden transition-all flex flex-col">
              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-black/5">
                {filteredMoas.map((moa, index) => (
                  <div key={moa.id} className="p-5 hover:bg-black/[0.02] transition-colors animate-in fade-in" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                    <div className="font-bold tracking-tight text-slate-800 mb-2">{moa.companyName}</div>
                    <div className="text-xs font-bold text-slate-600 space-y-1.5 mb-3">
                      <div>{moa.hteId}</div>
                      <div>{moa.contactPerson}</div>
                    </div>
                    <div className="mb-3">
                      <StatusBadge status={moa.status} />
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="px-3 py-1.5 rounded-md font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs transition-colors"><span className="material-symbols-outlined !text-sm">edit</span></button>
                      <button onClick={() => handleDelete(moa.id, moa.companyName)} className="px-3 py-1.5 rounded-md font-bold text-red-700 bg-red-50 hover:bg-red-100 text-xs transition-colors"><span className="material-symbols-outlined !text-sm">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse text-xs sm:text-sm relative">
                  <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md font-bold text-[11px] text-slate-500 uppercase tracking-wider border-b border-black/5 shadow-sm">
                    <tr>
                      <th className="p-3 sm:p-4">Partner</th>
                      <th className="p-3 sm:p-4">Contact</th>
                      <th className="p-3 sm:p-4 hidden lg:table-cell">Industry</th>
                      <th className="p-3 sm:p-4">College</th>
                      <th className="p-3 sm:p-4 hidden lg:table-cell">Status</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filteredMoas.map((moa, index) => (
                      <tr key={moa.id} className="hover:bg-black/[0.02] transition-colors duration-200 font-bold animate-in fade-in" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                        <td className="p-3 sm:p-4"><div className="font-bold tracking-tight text-slate-800 text-xs sm:text-sm mb-0.5">{moa.companyName}</div><div className="text-[9px] text-slate-500 font-mono tracking-wider">{moa.hteId}</div></td>
                        <td className="p-3 sm:p-4 text-slate-700 text-xs"><div>{moa.contactPerson || '-'}</div></td>
                        <td className="p-3 sm:p-4 text-slate-600 hidden lg:table-cell">{moa.industry || '-'}</td>
                        <td className="p-3 sm:p-4 text-slate-600 text-xs uppercase">{moa.college}</td>
                        <td className="p-3 sm:p-4 hidden lg:table-cell">
                          <StatusBadge status={moa.status} />
                        </td>
                        <td className="p-3 sm:p-4 text-right space-x-1 flex justify-end">
                          <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors active:scale-95"><span className="material-symbols-outlined !text-base">edit</span></button>
                          <button onClick={() => handleDelete(moa.id, moa.companyName)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors active:scale-95"><span className="material-symbols-outlined !text-base">delete</span></button>
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
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <form onSubmit={handleSave} className="bg-white/90 backdrop-blur-3xl border border-black/5 w-full max-w-md rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col overflow-hidden">
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
                <InputField label="Expiry Date" type="date" value={formData.expiryDate} onChange={v => setFormData({...formData, expiryDate: v})} />
                <InputField label="Endorsed By" value={formData.endorsedBy} onChange={v => setFormData({...formData, endorsedBy: v})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="College" value={formData.college} options={COLLEGES} onChange={v => setFormData({...formData, college: v})} />
                <SelectField label="Status" value={formData.status} options={MOA_STATUSES} onChange={v => setFormData({...formData, status: v})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-maroon/10 focus:border-maroon/20 transition-all text-sm h-20 resize-none placeholder:text-slate-400 custom-scrollbar" />
              </div>
            </div>
            <div className="px-6 py-5 sm:px-8 border-t border-black/5 shrink-0 bg-white/50 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="font-bold text-slate-700 bg-white border border-black/5 hover:bg-slate-50 transition-all px-5 py-2.5 rounded-xl text-sm shadow-sm active:scale-95">Cancel</button>
              <button type="submit" className="bg-maroon text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-maroon/90 active:scale-95 transition-all text-sm">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

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
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <input required type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-maroon/10 focus:border-maroon/20 transition-all text-sm placeholder:text-slate-400" />
  </div>
));

const SelectField = memo(({ label, value, options, onChange }) => (
  <div className="text-left">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-3.5 bg-black/[0.03] border border-transparent rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-maroon/10 focus:border-maroon/20 transition-all text-sm appearance-none">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
));
