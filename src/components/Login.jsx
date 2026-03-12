import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Login = ({ onLoginSuccess }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false); // State for the Help Modal

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
    <div className="min-h-screen bg-pattern flex flex-col font-display relative">
      
      {/* 1. TOP HEADER BAR */}
      <div className="w-full bg-white shrink-0 shadow-lg shadow-maroon/5 z-10">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-maroon">
              <span className="material-symbols-outlined !text-xl sm:!text-2xl">account_balance</span>
            </div>
            <span className="font-bold text-sm sm:text-lg text-maroon tracking-tight uppercase">NEU</span>
            <span className="hidden sm:inline font-bold text-sm sm:text-lg text-maroon tracking-tight uppercase">University</span>
          </div>
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="px-4 sm:px-6 py-2 border border-maroon/20 rounded-xl text-xs sm:text-sm font-black text-maroon hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            Help
          </button>
        </header>
      </div>

      {/* 2. CENTERED LOGIN CARD */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="glass-morphism rounded-[40px] sm:rounded-[50px] p-8 sm:p-12 w-full max-w-sm sm:max-w-[480px] text-center shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-1000 ease-out">
          <div 
            className="w-16 sm:w-20 h-16 sm:h-20 bg-maroon rounded-3xl mx-auto mb-6 sm:mb-8 flex items-center justify-center text-white shadow-xl shadow-maroon/20 animate-in zoom-in fade-in duration-1000"
            style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
          >
            <span className="material-symbols-outlined !text-3xl sm:!text-4xl">school</span>
          </div>
          
          <h1 
            className="text-2xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tighter animate-in slide-in-from-bottom-4 fade-in duration-1000"
            style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
          >Welcome!</h1>
          <p 
            className="text-maroon/60 font-bold text-xs sm:text-sm mb-8 sm:mb-10 animate-in slide-in-from-bottom-4 fade-in duration-1000"
            style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
          >MOA Monitoring System</p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-[9px] sm:text-[10px] rounded-xl font-black uppercase tracking-tighter flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="material-symbols-outlined !text-sm">error</span>
              {error}
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 sm:py-5 bg-white border-2 border-slate-50 rounded-[24px] font-black text-maroon hover:bg-slate-50 hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-sm disabled:opacity-50 mb-8 hover:scale-[1.02] animate-in slide-in-from-bottom-4 fade-in duration-1000 text-sm sm:text-base"
            style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}
          >
            {loading ? (
               <div className="animate-spin h-5 w-5 border-2 border-maroon border-t-transparent rounded-full" />
            ) : (
              <>
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 sm:w-6 h-5 sm:h-6" alt="G" />
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden">Sign in</span>
              </>
            )}
          </button>

          {/* UPDATED: CSD HELPDESK LINK */}
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 animate-in fade-in duration-1000" style={{ animationDelay: '1000ms', animationFillMode: 'backwards' }}>
            Don't have an account? {' '}
            <a 
              href="mailto:csd@neu.edu.ph?subject=MOA System Access Request"
              className="text-maroon cursor-pointer hover:underline font-black"
            >
              CSD Helpdesk
            </a>
          </p>
        </div>
      </main>

      {/* 3. HELP MODAL (THE HELP PAGE) */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-400">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black text-slate-900">System Help & Guide</h3>
              <button onClick={() => setIsHelpOpen(false)} className="text-slate-400 hover:text-maroon">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-6 text-slate-600 text-sm font-medium leading-relaxed">
              <section>
                <h4 className="font-black text-maroon uppercase text-[10px] tracking-widest mb-2">Login Issues</h4>
                <p>Ensure you are using your official <b>@neu.edu.ph</b> email address.</p>
              </section>

              <section>
                <h4 className="font-black text-maroon uppercase text-[10px] tracking-widest mb-2">Access Roles</h4>
                <p>Access level is determined by your institutional role. If you believe your role is incorrect, please contact your department head.</p>
              </section>

              <section>
                <h4 className="font-black text-maroon uppercase text-[10px] tracking-widest mb-2">Technical Support</h4>
                <p>For system bugs or technical errors, please email the development team at <b>csd@neu.edu.ph</b> with a screenshot of the issue.</p>
              </section>
            </div>

            <button 
              onClick={() => setIsHelpOpen(false)} 
              className="w-full mt-10 py-4 bg-maroon text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* 4. FOOTER SECTION */}
      <footer className="py-10 text-center space-y-3">
        <p className="text-maroon/20 text-[9px] font-black uppercase tracking-[0.5em] mb-1">
          Service · Education · Progress
        </p>
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
          © 2026 New Era University. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default Login;