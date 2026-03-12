import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Toaster } from 'react-hot-toast';

// Component Imports
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';

/**
 * NEU MOA Monitoring System - Core Application Wrapper
 * Features: RBAC (Role-Based Access Control), Institutional Gatekeeping, 
 * and Real-time Notification Provisioning.
 */
function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Auth Listener: Triggers on Login, Logout, or Session Refresh
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const email = currentUser.email.toLowerCase();
          
          // 1. Database Check (For Manual Admin/Staff Overrides)
          const userDoc = await getDoc(doc(db, "users", email));
          
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } 
          // 2. Institutional Pattern Check (@neu.edu.ph)
          else if (email.endsWith("@neu.edu.ph")) {
            const namePart = email.split('@')[0];
            // Format: firstname.lastname@neu.edu.ph = Student
            // Format: fi+lastname@neu.edu.ph = Staff
            setRole(namePart.includes('.') ? "student" : "staff");
          } 
          // 3. Fallback for unauthorized users
          else {
            setRole("guest");
          }
          setUser(currentUser);
        } else {
          // Clear session on logout
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Critical Auth Error:", err);
      } finally {
        // Stop the "Eagle Portal" pulse animation
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Professional Loading State (matches your Portal aesthetic)
  if (loading) {
    return (
      <div className="h-screen bg-pattern flex flex-col items-center justify-center font-display animate-in fade-in zoom-in-95 duration-700">
        <div className="w-16 h-16 border-4 border-maroon/10 border-t-maroon rounded-full animate-spin mb-6"></div>
        <p className="font-black text-maroon text-xs uppercase tracking-[0.5em] animate-pulse">
          Initializing Eagle Portal
        </p>
      </div>
    );
  }

  return (
    <div className="font-display">
      {/* Global Notification Provider (Success/Error Popups) */}
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          className: 'font-bold text-sm rounded-2xl shadow-2xl border border-slate-50',
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            padding: '16px 24px',
          },
          success: {
            iconTheme: { primary: '#800000', secondary: '#fff' },
          },
        }}
      />

      {/* Main View Logic: Gatekeep restricted areas from "guests" */}
      {!user || role === "guest" ? (
        <Login onLoginSuccess={(u, r) => { setUser(u); setRole(r); }} />
      ) : (
        <AdminDashboard user={user} role={role} />
      )}
    </div>
  );
}

export default App;