import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";

// Helper for Logging
const logAction = async (userName, userEmail, operation, targetHte, details = "") => {
  try {
    await addDoc(collection(db, "auditTrail"), {
      userName, userEmail, operation, targetHte, details,
      timestamp: serverTimestamp(),
    });
  } catch (e) { console.error("Audit error:", e); }
};

// 1. MOA SUBSCRIPTION (Live Updates)
export const subscribeToMOAs = (callback) => {
  const q = query(collection(db, "moas"), orderBy("companyName", "asc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// 2. AUDIT SUBSCRIPTION (Live Updates for Admins)
export const subscribeToAudit = (callback) => {
  const q = query(collection(db, "auditTrail"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// 3. CRUD OPERATIONS
export const createMOA = async (moaData, currentUser) => {
  const data = { ...moaData, isDeleted: false, createdAt: serverTimestamp(), createdBy: currentUser.email };
  const docRef = await addDoc(collection(db, "moas"), data);
  await logAction(currentUser.displayName || "User", currentUser.email, "INSERT", moaData.companyName, "New MOA created");
  return docRef;
};

export const updateMOA = async (moaId, updatedData, currentUser) => {
  const moaRef = doc(db, "moas", moaId);
  await updateDoc(moaRef, { ...updatedData, lastModified: serverTimestamp() });
  await logAction(currentUser.displayName || "User", currentUser.email, "EDIT", updatedData.companyName, `Status: ${updatedData.status}`);
};

export const archiveMOA = async (moaId, companyName, currentUser) => {
  const moaRef = doc(db, "moas", moaId);
  await updateDoc(moaRef, { isDeleted: true });
  await logAction(currentUser.displayName || "User", currentUser.email, "ARCHIVE", companyName, "MOA archived");
};

export const restoreMOA = async (moaId, companyName, currentUser) => {
  const moaRef = doc(db, "moas", moaId);
  await updateDoc(moaRef, { isDeleted: false, lastModified: serverTimestamp() });
  await logAction(currentUser.displayName || "User", currentUser.email, "RESTORE", companyName, "MOA restored from archive");
};

export const deleteMOAPermanently = async (moaId, companyName, currentUser) => {
  const moaRef = doc(db, "moas", moaId);
  await deleteDoc(moaRef);
  await logAction(currentUser.displayName || "User", currentUser.email, "PERMANENT_DELETE", companyName, "MOA permanently deleted");
};