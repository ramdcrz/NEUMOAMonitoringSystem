import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Login = ({ onLoginSuccess }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.email));
      
      if (userDoc.exists()) {
        onLoginSuccess(user, userDoc.data().role);
      } else if (user.email.endsWith("@neu.edu.ph")) {
        onLoginSuccess(user, "student");
      } else {
        setError("Access Denied: Use @neu.edu.ph email.");
        await signOut(auth);
      }
    } catch (err) {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <div className="glass-morphism rounded-[40px] p-12 w-full max-w-md text-center shadow-2xl">
        <div className="w-20 h-20 bg-maroon rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-lg">
          <span className="material-symbols-outlined !text-4xl">school</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome!</h1>
        <p className="text-maroon/60 font-bold text-sm mb-10">MOA Monitoring System</p>
        
        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-bold">{error}</div>}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
        >
          {loading ? "Connecting..." : <>
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="G" />
            Sign in with Google
          </>}
        </button>
      </div>
    </div>
  );
};

export default Login;