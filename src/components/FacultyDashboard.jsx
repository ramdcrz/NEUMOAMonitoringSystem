import { useState, useEffect, memo } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { subscribeToMOAs, createMOA, updateMOA, archiveMOA } from '../services/moaService';
import toast from 'react-hot-toast';

const MOA_STATUSES = [
  'APPROVED: Signed by President',
  'APPROVED: On-going notarization',
  'APPROVED: No notarization needed',
  'PROCESSING: Awaiting signature of HTE partner',
  'PROCESSING: MOA draft sent to Legal Office',
  'PROCESSING: Sent to VPAA/OP for approval',
  'EXPIRED: No renewal done',
  'EXPIRING: Two months before expiration'
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
    status: 'PROCESSING: MOA draft sent to Legal Office',
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
    const matchesSearch = 
      moa.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      moa.hteId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      moa.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      moa.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      status: 'PROCESSING: MOA draft sent to Legal Office',
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
    <div className="flex h-screen bg-pattern font-display overflow-hidden flex-col lg:flex-row">
      {/* Header */}
      <div className="w-full bg-white/90 backdrop-blur-md border-b border-maroon/10 px-6 sm:px-8 py-5 sm:py-6 lg:hidden flex items-center justify-between shrink-0">
        <h1 className="font-black text-lg sm:text-2xl text-slate-900">Faculty Portal</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-100 rounded-lg active:scale-95"><span className="material-symbols-outlined">menu</span></button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 lg:hidden flex items-start justify-end pt-16 pr-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-in slide-in-from-right duration-300">
            <nav className="space-y-3">
              <button onClick={() => { setIsMobileMenuOpen(false); setIsModalOpen(true); }} className="w-full px-4 py-3 rounded-xl bg-maroon text-white font-black text-left flex items-center gap-3">
                <span className="material-symbols-outlined">add</span> New Agreement
              </button>
              <div className="px-4 py-3 rounded-2xl bg-slate-50 text-slate-600 font-black text-left flex items-center gap-3">
                <span className="material-symbols-outlined">list</span> Agreements
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white/90 backdrop-blur-md border-r border-maroon/10 p-8 flex-col shrink-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-maroon rounded-xl text-white flex items-center justify-center shadow-lg"><span className="material-symbols-outlined">school</span></div>
          <div>
            <h1 className="font-black text-xl text-slate-900">Portal</h1>
            <p className="text-[9px] font-black text-maroon uppercase tracking-widest opacity-60">FACULTY</p>
          </div>
        </div>
        <nav className="space-y-3 flex-grow">
          <button onClick={() => setIsModalOpen(true)} className="w-full px-4 py-3 rounded-2xl bg-maroon text-white font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-maroon/20">
            <span className="material-symbols-outlined">add</span> New Agreement
          </button>
          <div className="px-4 py-3 rounded-2xl bg-slate-50 text-slate-600 font-black flex items-center gap-3">
            <span className="material-symbols-outlined">list</span> Agreements
          </div>
        </nav>
        <button onClick={() => signOut(auth)} className="p-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:text-maroon active:scale-95 flex items-center gap-3 transition-all duration-300 w-full justify-center"><span className="material-symbols-outlined">logout</span> Sign Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search & Filter */}
          <div className="bg-white/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-sm border border-slate-100 shadow-lg shadow-maroon/5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 sm:gap-4 bg-slate-50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input type="text" placeholder="Search by name, ID, contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full outline-none bg-transparent font-bold text-slate-800 text-sm sm:text-base" />
              </div>
              <select value={selectedCollege} onChange={e => setSelectedCollege(e.target.value)} className="w-full max-w-xs p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl outline-none font-bold text-slate-700">
                <option value="ALL">All Colleges</option>
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* MOAs Table */}
          {filteredMoas.length > 0 ? (
            <div className="bg-white/50 rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-sm border border-slate-100 shadow-lg shadow-maroon/5">
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3 p-4">
                {filteredMoas.map((moa, index) => (
                  <div key={moa.id} className="bg-white rounded-xl p-4 border border-slate-100 animate-in fade-in duration-700" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                    <div className="font-black text-slate-800 mb-2">{moa.companyName}</div>
                    <div className="text-[10px] text-slate-500 space-y-1 mb-3">
                      <div>{moa.hteId}</div>
                      <div>{moa.contactPerson}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="px-3 py-1 rounded-lg font-black text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs"><span className="material-symbols-outlined !text-sm">edit</span></button>
                      <button onClick={() => handleDelete(moa.id, moa.companyName)} className="px-3 py-1 rounded-lg font-black text-red-600 bg-red-50 hover:bg-red-100 text-xs"><span className="material-symbols-outlined !text-sm">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead className="bg-slate-50/50 font-black text-[7px] sm:text-[9px] text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="p-3 sm:p-4">Partner</th>
                      <th className="p-3 sm:p-4">Contact</th>
                      <th className="p-3 sm:p-4 hidden lg:table-cell">Industry</th>
                      <th className="p-3 sm:p-4">College</th>
                      <th className="p-3 sm:p-4 hidden lg:table-cell">Status</th>
                      <th className="p-3 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMoas.map((moa, index) => (
                      <tr key={moa.id} className="hover:bg-slate-50 transition-all duration-300 animate-in fade-in duration-700" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}>
                        <td className="p-3 sm:p-4"><div className="font-black text-slate-800 text-xs sm:text-sm">{moa.companyName}</div><div className="text-[7px] text-slate-400">{moa.hteId}</div></td>
                        <td className="p-3 sm:p-4 text-slate-600 text-xs"><div>{moa.contactPerson || '-'}</div></td>
                        <td className="p-3 sm:p-4 text-slate-500 hidden lg:table-cell">{moa.industry || '-'}</td>
                        <td className="p-3 sm:p-4 text-slate-500 text-xs uppercase">{moa.college}</td>
                        <td className="p-3 sm:p-4 hidden lg:table-cell"><span className={`text-[7px] font-black px-2 py-1 rounded-full whitespace-nowrap ${moa.status?.includes('APPROVED') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{moa.status?.split(':')[0]}</span></td>
                        <td className="p-3 sm:p-4 text-right space-x-1 flex justify-end">
                          <button onClick={() => { setEditId(moa.id); setFormData(moa); setIsModalOpen(true); }} className="px-2 py-1 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 text-sm font-black"><span className="material-symbols-outlined !text-base">edit</span></button>
                          <button onClick={() => handleDelete(moa.id, moa.companyName)} className="px-2 py-1 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 text-sm font-black"><span className="material-symbols-outlined !text-base">delete</span></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
              <span className="material-symbols-outlined !text-6xl text-slate-200 block mb-4">folder_open</span>
              <p className="text-slate-400 font-black uppercase text-xs">No agreements found</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <form onSubmit={handleSave} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black mb-6">{editId ? 'Update' : 'New'} Agreement</h3>
            <div className="space-y-4">
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
                <label className="text-[9px] font-black text-slate-300 uppercase ml-2 mb-1 block">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold text-slate-700 focus:border-maroon/10 transition-all text-sm h-20" />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button type="button" onClick={closeModal} className="font-black text-slate-400 hover:text-slate-600 px-4 py-2">Cancel</button>
              <button type="submit" className="bg-maroon text-white px-6 py-2 rounded-xl font-black hover:scale-105 active:scale-95 transition-all">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const InputField = memo(({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="text-left">
    <label className="text-[8px] font-black text-slate-300 uppercase ml-2 mb-1 block">{label}</label>
    <input required type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold text-slate-700 text-sm" />
  </div>
));

const SelectField = memo(({ label, value, options, onChange }) => (
  <div className="text-left">
    <label className="text-[8px] font-black text-slate-300 uppercase ml-2 mb-1 block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-3 bg-slate-50 rounded-lg outline-none font-bold text-slate-700 text-sm">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
));
