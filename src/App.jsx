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
      if (currentUser) {
        // Fetch the role from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.email));
        if (userDoc.exists()) {
          setRole(userDoc.data().role); // 'admin' or 'staff'
        } else if (currentUser.email.endsWith("@neu.edu.ph")) {
          setRole("student");
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-maroon">Initializing Eagle Portal...</div>;

  return (
    <div>
      {!user ? (
        <Login onLoginSuccess={(u, r) => { setUser(u); setRole(r); }} />
      ) : (
        <AdminDashboard user={user} role={role} />
      )}
    </div>
  );
}

export default App;