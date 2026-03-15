import { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
      
      if (!user.email) {
        setError("Email not provided by Google.");
        await signOut(auth);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.email));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.blocked) {
          setError("Account blocked by administrator.");
          await signOut(auth);
          return;
        }
        
        onLoginSuccess(user, userData.role || "student");
      } else if (user.email.endsWith("@neu.edu.ph")) {
        await setDoc(userDocRef, {
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role: "student",
          blocked: false,
          createdAt: serverTimestamp()
        });
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
    <div className="min-h-screen bg-pattern flex flex-col antialiased relative overflow-hidden">
      
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-maroon/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
      </div>

      {/* 1. TOP HEADER BAR */}
      <div className="w-full bg-white/70 backdrop-blur-2xl border-b border-black/5 shrink-0 z-20 sticky top-0 transition-all">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-maroon">
              <span className="material-symbols-outlined !text-xl sm:!text-2xl">account_balance</span>
            </div>
            <span className="font-bold text-sm sm:text-lg text-maroon tracking-tight uppercase">New Era University</span>
          </div>
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="px-4 sm:px-5 py-2 bg-white border border-black/5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            Help
          </button>
        </header>
      </div>

      {/* 2. CENTERED LOGIN CARD */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white/80 backdrop-blur-3xl border border-black/5 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 w-full max-w-sm sm:max-w-[440px] text-center shadow-[0_24px_60px_rgba(0,0,0,0.1)] hover:shadow-[0_32px_80px_rgba(0,0,0,0.15)] hover:-translate-y-2 animate-in fade-in zoom-in-90 slide-in-from-bottom-12 duration-1000 ease-out transition-all">
          <div 
            className="w-16 sm:w-20 h-16 sm:h-20 bg-maroon rounded-[1.25rem] mx-auto mb-6 sm:mb-8 flex items-center justify-center text-white shadow-md animate-in zoom-in fade-in duration-700"
            style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
          >
            <span className="material-symbols-outlined !text-3xl sm:!text-4xl">school</span>
          </div>
          
          <h1 
            className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight animate-in slide-in-from-bottom-4 fade-in duration-700 transition-all"
            style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
          >Welcome!</h1>
          <p 
            className="text-slate-500 font-bold text-sm sm:text-base mb-8 sm:mb-10 animate-in slide-in-from-bottom-4 fade-in duration-700"
            style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
          >MOA Monitoring System</p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50/80 border border-red-100 text-red-700 text-[11px] rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
              <span className="material-symbols-outlined !text-sm">error</span>
              {error}
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 sm:py-4 bg-white border border-black/5 rounded-2xl font-bold text-slate-800 hover:bg-slate-50 hover:scale-[1.02] hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 mb-8 animate-in slide-in-from-bottom-4 fade-in text-sm sm:text-base"
            style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}
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
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 animate-in fade-in duration-1000" style={{ animationDelay: '1000ms', animationFillMode: 'backwards' }}>
            Don't have an account? {' '}
            <a 
              href="mailto:csd@neu.edu.ph?subject=MOA System Access Request"
              className="text-maroon cursor-pointer hover:underline font-bold"
            >
              CSD Helpdesk
            </a>
          </p>
        </div>
      </main>

      {/* 3. HELP MODAL (THE HELP PAGE) */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-400">
          <div className="bg-white/90 backdrop-blur-3xl border border-black/5 w-full max-w-lg rounded-[2rem] shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-out flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="px-6 py-6 sm:px-8 sm:py-6 border-b border-black/5 shrink-0 flex justify-between items-center bg-white/50">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">System Help & Guide</h3>
              <button onClick={() => setIsHelpOpen(false)} className="text-slate-500 hover:bg-black/5 p-2 rounded-full transition-all duration-200">
                <span className="material-symbols-outlined block !text-xl">close</span>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6 text-slate-600 text-sm font-bold leading-relaxed flex-1 overflow-y-auto custom-scrollbar">
              <section>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">Login Issues</h4>
                <p>Ensure you are using your official <b>@neu.edu.ph</b> email address.</p>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">Access Roles</h4>
                <p>Access level is determined by your institutional role. If you believe your role is incorrect, please contact your department head.</p>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2">Technical Support</h4>
                <p>For system bugs or technical errors, please email the development team at <b>csd@neu.edu.ph</b> with a screenshot of the issue.</p>
              </section>
            </div>

            <div className="px-6 py-5 sm:px-8 border-t border-black/5 shrink-0 bg-white/50">
              <button 
                onClick={() => setIsHelpOpen(false)} 
                className="w-full py-3.5 bg-maroon text-white rounded-xl font-bold shadow-sm hover:bg-maroon/90 transition-all active:scale-95"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER SECTION */}
      <footer className="py-10 text-center space-y-3">
        <p className="text-maroon/30 text-[9px] font-bold uppercase tracking-[0.5em] mb-1">
          Service · Education · Progress
        </p>
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
          © 2026 New Era University. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default Login;