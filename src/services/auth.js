import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 1. Check if the user exists in our Firestore "users" collection
    const userDocRef = doc(db, "users", user.email);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if they are blocked (Requirement #7)
      if (userData.isBlocked) {
        await signOut(auth);
        return { success: false, message: "Your account has been blocked." };
      }

      return { success: true, user, role: userData.role };
    } 

    // 2. If not in the "users" list, check for the NEU domain (Requirement #1)
    if (user.email.endsWith("@neu.edu.ph")) {
      // Default new NEU accounts to "student" role
      return { success: true, user, role: "student" };
    }

    // 3. If neither, sign them out and deny access
    await signOut(auth);
    return { success: false, message: "Access Denied: Please use your @neu.edu.ph email." };

  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, message: "An error occurred during login." };
  }
};