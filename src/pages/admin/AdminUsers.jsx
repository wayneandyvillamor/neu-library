// src/pages/admin/AdminUsers.jsx
import { useState } from 'react';
import { useUsers, userOps } from '../../hooks/useFirestore';
import { useAuth } from '../../lib/AuthContext';
import {
  Search, X, Users, Shield, Loader2, AlertCircle,
  Unlock, ChevronDown, Ban, CheckCircle2, AlertTriangle,
} from 'lucide-react';

// ── Departments & Programs ────────────────────────────────────────────────
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
  'College of Information and Computing Sciences (CICS)': ['BS Information Technology (BSIT)', 'BS Computer Science (BSCS)', 'BS Information Systems (BSIS)'],
  'College of Business Administration (CBA)': ['BS Accountancy (BSA)', 'BS Business Administration (BSBA)', 'BS Entrepreneurship', 'BS Office Administration'],
  'College of Engineering (COE)': ['BS Civil Engineering (BSCE)', 'BS Electrical Engineering (BSEE)', 'BS Electronics Engineering (BSECE)', 'BS Mechanical Engineering (BSME)', 'BS Computer Engineering (BSCpE)'],
  'College of Arts and Sciences (CAS)': ['AB Communication', 'AB Political Science', 'BS Psychology', 'BS Biology'],
  'College of Education (CEd)': ['Bachelor of Elementary Education (BEEd)', 'Bachelor of Secondary Education (BSEd)'],
  'College of Criminal Justice Education (CCJE)': ['BS Criminology (BSCrim)'],
  'College of Nursing (CN)': ['BS Nursing (BSN)'],
  'College of Architecture and Fine Arts (CAFA)': ['BS Architecture (BSArch)', 'BS Fine Arts'],
  'Senior High School (SHS)': ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'],
  'Graduate School': ['Master of Business Administration (MBA)', 'Master of Public Administration (MPA)', 'Master in Information Technology (MIT)'],
};

// ── Block Confirmation Modal ──────────────────────────────────────────────
function BlockModal({ user, onConfirm, onClose, loading }) {
  const isBlocking = !user.blocked;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-700 animate-slide-up">
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isBlocking ? 'bg-red-900/30 border border-red-700/50' : 'bg-emerald-900/30 border border-emerald-700/50'}`}>
            {isBlocking
              ? <Ban size={26} className="text-red-400" />
              : <CheckCircle2 size={26} className="text-emerald-400" />
            }
          </div>

          <h2 className="font-display font-semibold text-white text-lg mb-1">
            {isBlocking ? 'Block this user?' : 'Unblock this user?'}
          </h2>

          <p className="text-slate-400 text-sm mb-2">
            <span className="font-medium text-white">{user.displayName}</span>
          </p>
          <p className="text-slate-500 text-xs mb-5">
            {isBlocking
              ? 'This user will no longer be able to sign in to NEU Library. They will see a "blocked" message when they try to log in.'
              : 'This user will be able to sign in and use NEU Library again.'
            }
          </p>

          {isBlocking && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/40 rounded-xl mb-5 text-left">
              <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">This action takes effect immediately. The user will be signed out on their next login attempt.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                isBlocking
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {loading
                ? <Loader2 size={15} className="animate-spin" />
                : isBlocking ? <><Ban size={14} />Yes, Block User</> : <><CheckCircle2 size={14} />Yes, Unblock</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────
function EditProfileModal({ user, onClose }) {
  const [form, setForm] = useState({
    studentId:   user.studentId   || '',
    department:  user.department  || '',
    program:     user.program     || '',
    visitorType: user.visitorType || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const programs = PROGRAMS_BY_DEPT[form.department] || [];

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'department') setForm(f => ({ ...f, department: value, program: '' }));
    else setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await userOps.updateProfile(user.uid, {
        studentId:   form.studentId,
        department:  form.department,
        program:     form.program,
        visitorType: form.visitorType,
        profileLocked: true,
      });
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const selectClass = "w-full px-3.5 py-2.5 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-neu-400 appearance-none cursor-pointer transition-all";
  const inputClass  = "w-full px-3.5 py-2.5 rounded-lg border border-slate-600 bg-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neu-400 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="font-display font-semibold text-white">Edit Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.displayName}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex items-start gap-2.5 p-3 bg-amber-900/20 border border-amber-700/50 rounded-xl">
            <Unlock size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-400">You are editing a locked profile on behalf of this user.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Visitor Type</label>
            <div className="relative">
              <select className={selectClass} name="visitorType" value={form.visitorType} onChange={handleChange}>
                <option value="">Select visitor type…</option>
                <option value="Student">Student</option>
                <option value="Teacher / Faculty">Teacher / Faculty</option>
                <option value="Staff / Employee">Staff / Employee</option>
              </select>
              <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {form.visitorType === 'Student' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Student ID</label>
              <input className={inputClass} name="studentId" value={form.studentId} onChange={handleChange} placeholder="00-00000-000" />
            </div>
          )}

          {form.visitorType !== 'Staff / Employee' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Department</label>
              <div className="relative">
                <select className={selectClass} name="department" value={form.department} onChange={handleChange}>
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {form.visitorType === 'Student' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Program</label>
              <div className="relative">
                <select className={selectClass} name="program" value={form.program} onChange={handleChange} disabled={!form.department}>
                  <option value="">{form.department ? 'Select program…' : 'Select department first'}</option>
                  {programs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-neu-500 hover:bg-neu-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const { profile: me } = useAuth();
  const [search, setSearch]       = useState('');
  const [editUser, setEditUser]   = useState(null);
  const [blockUser, setBlockUser] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const { users, loading } = useUsers(search);
  const [updating, setUpdating]   = useState(null);
  const [error, setError]         = useState('');

  async function handleRole(user, role) {
    if (user.uid === me?.uid) { setError("You can't change your own role."); setTimeout(() => setError(''), 3000); return; }
    setUpdating(user.uid + role);
    try { await userOps.setRole(user.uid, role); }
    catch (err) { setError(err.message); setTimeout(() => setError(''), 3000); }
    finally { setUpdating(null); }
  }

  async function handleBlockConfirm() {
    if (!blockUser) return;
    setBlockLoading(true);
    try {
      await userOps.setBlocked(blockUser.uid, !blockUser.blocked);
      setBlockUser(null);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setBlockLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {editUser  && <EditProfileModal user={editUser}  onClose={() => setEditUser(null)} />}
      {blockUser && (
        <BlockModal
          user={blockUser}
          onConfirm={handleBlockConfirm}
          onClose={() => setBlockUser(null)}
          loading={blockLoading}
        />
      )}

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white">Users</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage roles, edit profiles, and block users.</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-700/50 rounded-xl mb-5">
        <Shield size={16} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-300">
          <span className="font-semibold">Tip:</span> Students' ID/Department/Program are locked after first login. Click <strong>Edit Profile</strong> to update them.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/50 rounded-lg mb-4 text-sm text-red-400">
          <AlertCircle size={15} className="shrink-0" />{error}
        </div>
      )}

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-600 text-sm bg-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neu-400"
          placeholder="Search by name, email, department…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={15} /></button>}
      </div>

      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><Loader2 size={22} className="animate-spin text-slate-500 mx-auto" /></div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center"><Users size={26} className="mx-auto mb-2 text-slate-600" /><p className="text-sm text-slate-500">No users found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['User','Department','Program','Role','Actions','Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isMe = u.uid === me?.uid;
                  return (
                    <tr key={u.uid} className={`border-b border-slate-700/40 transition-colors ${u.blocked ? 'bg-red-900/10' : 'hover:bg-slate-700/30'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                              {u.photoURL
                                ? <img src={u.photoURL} className="w-full h-full object-cover" alt="" />
                                : <div className="w-full h-full bg-neu-500/20 flex items-center justify-center text-neu-400 text-xs font-bold">{u.displayName?.[0]}</div>
                              }
                            </div>
                            {u.blocked && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-800 flex items-center justify-center">
                                <Ban size={7} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white whitespace-nowrap flex items-center gap-2">
                              {u.displayName}
                              {isMe && <span className="text-xs text-slate-500">(you)</span>}
                              {u.blocked && <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/50 px-1.5 py-0.5 rounded-full">Blocked</span>}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                            {u.studentId && <p className="text-xs text-slate-500 font-mono">{u.studentId}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{u.department?.match(/\(([^)]+)\)/)?.[1] || u.department || '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-400">{u.program?.match(/\(([^)]+)\)/)?.[1] || u.program || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          u.role === 'admin'
                            ? 'bg-neu-500/10 text-neu-400 border-neu-500/20'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}>
                          {u.role === 'admin' && <Shield size={10} />}{u.role}
                        </span>
                      </td>
                      {/* Actions column — role + edit profile */}
                      <td className="px-5 py-3">
                        {isMe ? (
                          <span className="text-xs text-slate-600">Cannot edit yourself</span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex gap-1.5 flex-wrap">
                              {['student','admin'].filter(r => r !== u.role).map(r => (
                                <button key={r} onClick={() => handleRole(u, r)} disabled={!!updating}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                                    r === 'admin'
                                      ? 'border-neu-500/30 text-neu-400 hover:bg-neu-500/10'
                                      : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                                  }`}>
                                  {updating === u.uid + r ? <Loader2 size={12} className="animate-spin inline" /> : `→ ${r}`}
                                </button>
                              ))}
                            </div>
                            {u.profileLocked && (
                              <button onClick={() => setEditUser(u)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-700/50 text-amber-400 hover:bg-amber-900/20 transition-colors w-fit">
                                <Unlock size={11} />Edit Profile
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status column — block / unblock */}
                      <td className="px-5 py-3">
                        {!isMe ? (
                          <button
                            onClick={() => setBlockUser(u)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              u.blocked
                                ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/40'
                                : 'bg-red-900/10 border-red-700/50 text-red-400 hover:bg-red-900/30'
                            }`}
                          >
                            {u.blocked
                              ? <><CheckCircle2 size={13} />Unblock</>
                              : <><Ban size={13} />Block</>
                            }
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
