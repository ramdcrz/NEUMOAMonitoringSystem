import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const logAction = async (userName, userEmail, operation, targetHte) => {
  try {
    await addDoc(collection(db, "auditTrail"), {
      userName,
      userEmail,
      operation,
      targetHte,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
};