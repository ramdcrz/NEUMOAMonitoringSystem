import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const mockMOAs = [
  {
    hteId: "2026-CICS-001",
    companyName: "TechNova Solutions",
    address: "123 Innovation Drive, Tech City, Metro Manila",
    contactPerson: "Jane Doe",
    contactEmail: "jane.doe@technovasolutions.com",
    industry: "Technology",
    effectiveDate: "2025-01-15",
    expiryDate: "2028-01-15",
    college: "College of Informatics and Computing Studies",
    endorsedBy: "College of Informatics and Computing Studies",
    status: "APPROVED: Signed by President",
    notes: "Standard internship partnership for BSCS and BSIT students.",
    isDeleted: false,
    createdAt: serverTimestamp(),
    createdBy: "admin@neu.edu.ph",
    lastModified: serverTimestamp()
  },
  {
    hteId: "2026-CBA-042",
    companyName: "Global Finance Corp",
    address: "45th Floor, Financial Tower, Makati City",
    contactPerson: "Michael Chen",
    contactEmail: "m.chen@globalfinance.com",
    industry: "Finance",
    effectiveDate: "2023-05-10",
    expiryDate: "2026-05-10",
    college: "College of Business Administration",
    endorsedBy: "College of Business Administration",
    status: "EXPIRING: Renewal Required",
    notes: "Requires immediate renewal review. Reached out to Mr. Chen on March 1st.",
    isDeleted: false,
    createdAt: serverTimestamp(),
    createdBy: "admin@neu.edu.ph",
    lastModified: serverTimestamp()
  },
  {
    hteId: "2026-CON-011",
    companyName: "Metro General Hospital",
    address: "Health Ave, Quezon City",
    contactPerson: "Dr. Sarah Johnson",
    contactEmail: "s.johnson@metrogeneral.org",
    industry: "Healthcare",
    effectiveDate: "2026-02-01",
    expiryDate: "2029-02-01",
    college: "College of Nursing",
    endorsedBy: "College of Medical Technology",
    status: "PROCESSING: MOA draft sent to Legal Office for Review.",
    notes: "Pending final review from the university legal counsel.",
    isDeleted: false,
    createdAt: serverTimestamp(),
    createdBy: "faculty@neu.edu.ph",
    lastModified: serverTimestamp()
  },
  {
    hteId: "2026-CEA-008",
    companyName: "BuildRight Construction",
    address: "Industrial Park, Pasig City",
    contactPerson: "Engr. Robert Davis",
    contactEmail: "robert.davis@buildright.com.ph",
    industry: "Manufacturing",
    effectiveDate: "2021-01-01",
    expiryDate: "2024-01-01",
    college: "College of Engineering and Architecture",
    endorsedBy: "College of Engineering and Architecture",
    status: "EXPIRED: Terminated",
    notes: "Partnership ended. Company relocated.",
    isDeleted: false,
    createdAt: serverTimestamp(),
    createdBy: "admin@neu.edu.ph",
    lastModified: serverTimestamp()
  },
  {
    hteId: "2026-CAS-019",
    companyName: "National Broadcasting Network",
    address: "Media Center, Diliman, Quezon City",
    contactPerson: "Maria Santos",
    contactEmail: "msantos@nbn.ph",
    industry: "Other",
    effectiveDate: "2025-08-20",
    expiryDate: "2028-08-20",
    college: "College of Communication",
    endorsedBy: "College of Arts and Science",
    status: "APPROVED: In Notarization",
    notes: "Documents currently with the notary public.",
    isDeleted: false,
    createdAt: serverTimestamp(),
    createdBy: "admin@neu.edu.ph",
    lastModified: serverTimestamp()
  }
];

export const seedDatabase = async () => {
  const moaRef = collection(db, 'moas');
  let count = 0;
  for (const moa of mockMOAs) {
    await addDoc(moaRef, moa);
    count++;
  }
  toast.success(`Successfully seeded ${count} MOAs!`);
};