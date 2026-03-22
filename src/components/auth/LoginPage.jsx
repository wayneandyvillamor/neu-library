// src/components/auth/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-right shadow-xl z-10">
      <p className="text-white font-bold text-2xl leading-tight font-mono tracking-wider">
        {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-white/50 text-xs mt-0.5">
        {time.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
}

export default function LoginPage() {
  const { loginGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      const profile = await loginGoogle();
      // Role-based redirect — admin goes to dashboard, student goes to kiosk
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/kiosk');
      }
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url('/neu-library-building.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlays */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-neu-900/40 via-transparent to-neu-800/40" />

      {/* Top left branding */}
      <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
        <img src="/neu-logo.png" alt="NEU" className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white/30" />
        <div>
          <p className="text-white font-bold text-sm leading-tight tracking-wide">NEW ERA UNIVERSITY</p>
          <p className="text-white/50 text-xs leading-tight">No. 9 Central Ave, New Era, Quezon City</p>
        </div>
      </div>

      {/* Live clock */}
      <LiveClock />

      {/* Center card */}
      <div className="relative z-10 w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="relative mb-4">
            <img src="/neu-logo.png" alt="NEU Logo" className="w-20 h-20 rounded-full object-cover shadow-2xl border-4 border-white/30" />
            <div className="absolute inset-0 rounded-full border-4 border-neu-400/40 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-white font-display text-3xl font-bold tracking-wide text-center">NEU Library</h1>
          <p className="text-white/40 text-sm mt-1 text-center">Visitor Management</p>
        </div>

        {/* Glass card */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/15 rounded-3xl p-7 shadow-2xl">
          <h2 className="text-white font-display text-xl font-semibold text-center mb-1">Welcome! 👋</h2>
          <p className="text-white/40 text-sm text-center mb-6">
            Sign in with your NEU Google account to continue.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-xl mb-4 text-sm text-red-300 animate-fade-in">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-50 transition-all text-slate-800 font-semibold text-sm shadow-lg disabled:opacity-60 hover:shadow-xl hover:scale-[1.02] active:scale-100 duration-150"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-slate-500" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.3 0-9.6-3.4-11.2-8.1l-6.5 5C9.7 39.6 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41.1 35.6 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-center text-white/25 text-xs mt-5">
            @neu.edu.ph accounts only · Admins & Students
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-4">
          New Era University · Library Services · Est. 1975
        </p>
      </div>
    </div>
  );
}
