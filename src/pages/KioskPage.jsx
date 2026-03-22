// src/pages/KioskPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useVisits, visitOps, userOps, toDate } from '../hooks/useFirestore';
import {
  LogOut, LogIn, BookOpen, CheckCircle2,
  Loader2, ChevronDown, Lock, Info,
} from 'lucide-react';
import { format } from 'date-fns';

const DEPARTMENTS = [
  'College of Information and Computing Sciences (CICS)',
  'College of Business Administration (CBA)',
  'College of Engineering (COE)',
  'College of Arts and Sciences (CAS)',
  'College of Education (CEd)',
  'College of Criminal Justice Education (CCJE)',
  'College of Nursing (CN)',
  'College of Architecture and Fine Arts (CAFA)',
  'Senior High School (SHS)',
  'Graduate School',
];

const PROGRAMS_BY_DEPT = {
  'College of Information and Computing Sciences (CICS)': [
    'BS Information Technology (BSIT)',
    'BS Computer Science (BSCS)',
    'BS Information Systems (BSIS)',
  ],
  'College of Business Administration (CBA)': [
    'BS Accountancy (BSA)',
    'BS Business Administration (BSBA)',
    'BS Entrepreneurship',
    'BS Office Administration',
  ],
  'College of Engineering (COE)': [
    'BS Civil Engineering (BSCE)',
    'BS Electrical Engineering (BSEE)',
    'BS Electronics Engineering (BSECE)',
    'BS Mechanical Engineering (BSME)',
    'BS Computer Engineering (BSCpE)',
  ],
  'College of Arts and Sciences (CAS)': [
    'AB Communication',
    'AB Political Science',
    'BS Psychology',
    'BS Biology',
  ],
  'College of Education (CEd)': [
    'Bachelor of Elementary Education (BEEd)',
    'Bachelor of Secondary Education (BSEd)',
  ],
  'College of Criminal Justice Education (CCJE)': ['BS Criminology (BSCrim)'],
  'College of Nursing (CN)':                      ['BS Nursing (BSN)'],
  'College of Architecture and Fine Arts (CAFA)': ['BS Architecture (BSArch)', 'BS Fine Arts'],
  'Senior High School (SHS)':                     ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'],
  'Graduate School': [
    'Master of Business Administration (MBA)',
    'Master of Public Administration (MPA)',
    'Master in Information Technology (MIT)',
  ],
};

const PURPOSES = [
  'Reading / Leisure',
  'Study / Homework',
  'Thesis / Capstone Work',
  'Research',
  'Borrowing / Returning Book',
  'Computer Use',
  'Group Study',
  'Other',
];

// ── Helpers ───────────────────────────────────────────────────────────────
// Profile is "locked" if student has already saved dept/program/id before
function isProfileLocked(profile) {
  // Only consider locked if ALL required fields are saved
  return !!(
    profile?.profileLocked === true &&
    profile?.studentId &&
    profile?.department &&
    profile?.program &&
    profile?.visitorType
  );
}

// ── Success screen ────────────────────────────────────────────────────────
function SuccessScreen({ visit, onDone }) {
  const [count, setCount] = useState(5);
  useEffect(() => {
    const iv = setInterval(() => setCount(c => { if (c <= 1) { clearInterval(iv); onDone(); return 0; } return c - 1; }), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 animate-slide-up relative z-10">
      <div className="w-24 h-24 rounded-full bg-emerald-900/30 flex items-center justify-center mb-6">
        <CheckCircle2 size={48} className="text-emerald-500" />
      </div>
      <h1 className="font-display text-4xl font-bold text-white mb-2">Welcome to NEU Library!</h1>
      <p className="text-slate-400 text-lg mb-1">{visit.studentName}</p>
      <p className="text-slate-500 text-sm mb-1">{visit.department}</p>
      <p className="text-slate-500 text-sm mb-6">{visit.program}</p>
      <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/50 rounded-xl px-5 py-3 mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 font-medium text-sm">
          Timed in at {format(new Date(), 'hh:mm a')} · {visit.purpose}
        </span>
      </div>
      <div className="w-12 h-12 rounded-full border-4 border-slate-600 flex items-center justify-center mb-2">
        <span className="text-lg font-bold text-slate-400">{count}</span>
      </div>
      <p className="text-slate-300 dark:text-slate-600 text-sm">Signing out automatically…</p>
    </div>
  );
}

// ── Timed out screen ──────────────────────────────────────────────────────
function TimedOutScreen({ onDone }) {
  const [count, setCount] = useState(5);
  useEffect(() => {
    const iv = setInterval(() => setCount(c => { if (c <= 1) { clearInterval(iv); onDone(); return 0; } return c - 1; }), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 animate-slide-up relative z-10">
      <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6">
        <LogOut size={44} className="text-slate-400" />
      </div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">See you next time!</h1>
      <p className="text-slate-500 text-sm mt-1 mb-6">Your visit has been recorded. Thanks for visiting NEU Library.</p>
      <div className="w-12 h-12 rounded-full border-4 border-slate-600 flex items-center justify-center mb-2">
        <span className="text-lg font-bold text-slate-400">{count}</span>
      </div>
      <p className="text-slate-300 dark:text-slate-600 text-sm">Signing out automatically…</p>
    </div>
  );
}

// ── Main Kiosk ────────────────────────────────────────────────────────────
export default function KioskPage() {
  const { profile, logout, refreshProfile } = useAuth();
  const { visits } = useVisits(profile?.uid);

  const [step, setStep]       = useState('form');
  const [lastVisit, setLastVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const locked = isProfileLocked(profile);

  const [form, setForm] = useState({
    department:  profile?.department  || '',
    program:     profile?.program     || '',
    studentId:   profile?.studentId   || '',
    visitorType: profile?.visitorType || '',
    purpose:     '',
  });

  // Sync form with profile whenever profile data changes
  useEffect(() => {
    setForm(f => ({
      ...f,
      department:  profile?.department  || f.department  || '',
      program:     profile?.program     || f.program     || '',
      studentId:   profile?.studentId   || f.studentId   || '',
      visitorType: profile?.visitorType || f.visitorType || '',
    }));
  }, [profile?.department, profile?.program, profile?.studentId, profile?.visitorType]);

  // Locked based on visitor type — each type has different required fields
  const effectiveLocked = (() => {
    if (!profile?.profileLocked || !profile?.visitorType) return false;
    const vt = profile.visitorType;
    if (vt === 'Student')          return !!(profile.studentId && profile.department && profile.program);
    if (vt === 'Teacher / Faculty') return !!(profile.department);
    if (vt === 'Staff / Employee')  return true; // only visitorType needed
    return false;
  })();

  const activeVisit = visits.find(v => v.status === 'active');
  const programs    = PROGRAMS_BY_DEPT[form.department] || [];

  function handleChange(e) {
    if (effectiveLocked && e.target.name !== 'purpose') return; // locked fields
    const { name, value } = e.target;
    if (name === 'department') setForm(f => ({ ...f, department: value, program: '' }));
    else setForm(f => ({ ...f, [name]: value }));
  }

  async function handleTimeIn(e) {
    e.preventDefault();
    if (!form.visitorType){ setError('Please select your visitor type.'); return; }
    if (form.visitorType === 'Student' && !form.studentId) { setError('Please enter your Student ID.'); return; }
    if (form.visitorType !== 'Staff / Employee' && !form.department) { setError('Please select your department.'); return; }
    if (form.visitorType === 'Student' && !form.program) { setError('Please select your program.'); return; }
    if (!form.purpose)    { setError('Please select your purpose of visit.'); return; }
    setError('');
    setLoading(true);
    try {
      // Save profile whenever not fully locked
      if (!effectiveLocked) {
        const vt = form.visitorType;
        await userOps.updateProfile(profile.uid, {
          visitorType:   vt,
          // Student: save all fields
          studentId:     vt === 'Student' ? (form.studentId || '') : '',
          department:    vt !== 'Staff / Employee' ? form.department : '',
          program:       vt === 'Student' ? form.program : '',
          profileLocked: true,
        });
        await refreshProfile();
      }

      const visit = {
        studentId:       profile.uid,
        studentName:     profile.displayName,
        studentIdNumber: form.studentId || '—',
        department:      form.department,
        program:         form.program,
        visitorType:     form.visitorType || 'Student',
        purpose:         form.purpose,
      };
      await visitOps.timeIn(visit);
      setLastVisit(visit);
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeOut() {
    if (!activeVisit) return;
    setLoading(true);
    try {
      await visitOps.timeOut(activeVisit.id);
      setStep('timedout');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetAndLogout() { logout(); }

  if (step === 'success')  return (
    <div className="min-h-screen relative overflow-hidden">
      <BgLayer />
      <SuccessScreen visit={lastVisit} onDone={resetAndLogout} />
    </div>
  );
  if (step === 'timedout') return (
    <div className="min-h-screen relative overflow-hidden">
      <BgLayer />
      <TimedOutScreen onDone={resetAndLogout} />
    </div>
  );

  // Shared select class
  const selectClass = `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-neu-400 focus:border-transparent transition-all appearance-none cursor-pointer
    ${locked ? 'bg-slate-200 border-slate-400 text-slate-900 cursor-not-allowed font-semibold' : 'bg-slate-700 border-slate-600 text-white'}`;

  const inputClass = `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-neu-400 focus:border-transparent transition-all font-mono
    ${locked ? 'bg-slate-200 border-slate-400 text-slate-900 cursor-not-allowed font-semibold' : 'bg-slate-700 border-slate-600 text-white'}`;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <BgLayer />

      {/* Top bar */}
      <header className="relative z-10 bg-slate-900/75 backdrop-blur-sm border-b border-slate-700/60 px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <img src="/neu-logo.png" alt="NEU" className="w-9 h-9 rounded-full object-cover border border-slate-600" />
          <div>
            <p className="font-display font-semibold text-white text-sm leading-tight">NEU Library</p>
            <p className="text-xs text-slate-400">Visitor Kiosk</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {profile?.photoURL && (
              <img src={profile.photoURL} className="w-8 h-8 rounded-full object-cover border border-slate-600" alt="" />
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-200 leading-tight">{profile?.displayName}</p>
              <p className="text-xs text-slate-400">{profile?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 border border-slate-600 transition-colors">
            <LogOut size={13} />Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Welcome */}
          <div className="text-center mb-7">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg border-2 border-white/50 dark:border-slate-600">
              {profile?.photoURL
                ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full bg-neu-500 flex items-center justify-center text-white font-bold text-xl">{profile?.displayName?.[0]}</div>
              }
            </div>
            <h1 className="font-display text-3xl font-bold text-white">Welcome to NEU Library!</h1>
            <p className="text-slate-400 mt-1">
              Hello, <span className="font-semibold text-slate-200">{profile?.displayName}</span>!
            </p>
          </div>

          {/* Active visit */}
          {activeVisit ? (
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/60 p-6 text-center shadow-lg transition-colors duration-300">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-400 text-sm">Currently Inside the Library</span>
              </div>
              <p className="text-slate-400 text-sm mb-1">
                Timed in at <span className="font-medium text-slate-200">
                  {toDate(activeVisit.timeIn) ? format(toDate(activeVisit.timeIn), 'hh:mm a') : '—'}
                </span>
              </p>
              <p className="text-slate-400 text-sm mb-6">
                Purpose: <span className="font-medium text-slate-200">{activeVisit.purpose}</span>
              </p>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <button onClick={handleTimeOut} disabled={loading}
                className="w-full py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 size={17} className="animate-spin" /> : <><LogOut size={17} />Time Out — Leave Library</>}
              </button>
            </div>
          ) : (

            /* Visit form */
            <form onSubmit={handleTimeIn} className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/60 p-6 shadow-lg space-y-4 transition-colors duration-300">
              <div>
                <h2 className="font-display font-semibold text-white text-lg">Log Your Visit</h2>
                <p className="text-slate-500 text-sm mt-0.5">Fill in the details below to enter the library.</p>
              </div>

              {/* Only show lock notice when profile is fully locked */}
              {effectiveLocked && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-900/20 border border-amber-700/50 rounded-xl">
                  <Lock size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400">
                    Your details are locked. To make changes, please request it from the Admin.
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg px-3 py-2">{error}</p>}

              {/* Visitor Type */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Visitor Type {effectiveLocked && <Lock size={11} className="text-slate-400" />}
                </label>
                <div className="relative">
                  <select
                    className={effectiveLocked
                      ? "w-full px-3.5 py-2.5 rounded-lg border border-slate-400 bg-slate-200 text-slate-900 font-semibold text-sm transition-all appearance-none cursor-not-allowed"
                      : "w-full px-3.5 py-2.5 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-neu-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                    }
                    name="visitorType"
                    value={form.visitorType}
                    onChange={handleChange}
                    disabled={effectiveLocked}
                    required
                  >
                    <option value="">Select visitor type…</option>
                    <option value="Student">Student</option>
                    <option value="Teacher / Faculty">Teacher / Faculty</option>
                    <option value="Staff / Employee">Staff / Employee</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Student ID — hidden for Teacher and Staff */}
              {form.visitorType !== 'Teacher / Faculty' && form.visitorType !== 'Staff / Employee' && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Student ID {effectiveLocked && <Lock size={11} className="text-slate-400" />}
                  </label>
                  <input className={inputClass} name="studentId" value={form.studentId} onChange={handleChange}
                    placeholder="e.g. 24-12345-678" readOnly={effectiveLocked} />
                </div>
              )}

              {/* Department — hidden for Staff */}
              {form.visitorType !== 'Staff / Employee' && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Department / College {effectiveLocked && <Lock size={11} className="text-slate-400" />}
                  </label>
                  <div className="relative">
                    <select className={selectClass} name="department" value={form.department} onChange={handleChange} disabled={effectiveLocked}>
                      <option value="">Select your department…</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Program — only for Students */}
              {form.visitorType === 'Student' && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Program / Course {effectiveLocked && <Lock size={11} className="text-slate-400" />}
                  </label>
                  <div className="relative">
                    <select className={selectClass} name="program" value={form.program} onChange={handleChange} disabled={effectiveLocked || !form.department}>
                      <option value="">{form.department ? 'Select your program…' : 'Select department first'}</option>
                      {programs.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              )}

              {/* Purpose — always editable */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Purpose of Visit</label>
                <div className="relative">
                  <select
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-neu-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                    name="purpose" value={form.purpose} onChange={handleChange} required>
                    <option value="">Select purpose…</option>
                    {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-neu-500 hover:bg-neu-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-1">
                {loading ? <Loader2 size={17} className="animate-spin" /> : <><LogIn size={17} />Time In — Enter Library</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Background layer component ────────────────────────────────────────────
function BgLayer() {
  return (
    <>
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: "url('/neu-library-inside.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }} />
      <div className="absolute inset-0 z-0 bg-slate-900/82 transition-colors duration-300" />
    </>
  );
}
