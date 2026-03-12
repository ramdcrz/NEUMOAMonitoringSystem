import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const email = currentUser.email.toLowerCase();
          const userDoc = await getDoc(doc(db, "users", email));
          
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else if (email.endsWith("@neu.edu.ph")) {
            setRole(email.split('@')[0].includes('.') ? "student" : "staff");
          } else {
            setRole("guest");
          }
          setUser(currentUser);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen bg-pattern flex items-center justify-center font-black text-maroon text-xl animate-pulse">Initializing Eagle Portal...</div>;

  return (
    <div>
      {!user || role === "guest" ? (
        <Login onLoginSuccess={(u, r) => { setUser(u); setRole(r); }} />
      ) : (
        <AdminDashboard user={user} role={role} />
      )}
    </div>
  );
}

export default App;