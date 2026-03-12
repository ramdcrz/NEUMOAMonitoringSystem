import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { logAction } from "./audit";

export const createMOA = async (moaData, currentUser) => {
  const docRef = await addDoc(collection(db, "moas"), {
    ...moaData,
    isDeleted: false,
    createdAt: serverTimestamp(),
  });
  await logAction(currentUser.displayName, currentUser.email, "INSERT", moaData.companyName);
  return docRef.id;
};

export const updateMOA = async (moaId, updatedData, currentUser) => {
  const moaRef = doc(db, "moas", moaId);
  await updateDoc(moaRef, { ...updatedData, lastModified: serverTimestamp() });
  await logAction(currentUser.displayName, currentUser.email, "EDIT", updatedData.companyName);
};

export const archiveMOA = async (moaId, companyName, currentUser) => {
  const moaRef = doc(db, "moas", moaId);
  await updateDoc(moaRef, { isDeleted: true });
  await logAction(currentUser.displayName, currentUser.email, "ARCHIVE", companyName);
};

export const subscribeToMOAs = (callback) => {
  const q = query(collection(db, "moas"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeToAudit = (callback) => {
  const q = query(collection(db, "auditTrail"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};