// src/pages/admin/AdminDashboard.jsx
import { useMemo, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useVisits, toDate } from '../../hooks/useFirestore';
import { isToday, isThisWeek, format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { Users, CalendarCheck, CheckCircle2, TrendingUp, BookOpen, Clock } from 'lucide-react';

function StatCard({ icon: Icon, value, label, color }) {
  const c = {
    blue:  { bar: 'bg-neu-500',     icon: 'text-neu-400',     bg: 'bg-neu-500/10' },
    green: { bar: 'bg-emerald-500', icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    amber: { bar: 'bg-amber-500',   icon: 'text-amber-400',   bg: 'bg-amber-500/10' },
    slate: { bar: 'bg-slate-500',   icon: 'text-slate-400',   bg: 'bg-slate-500/10' },
  }[color] || { bar: 'bg-neu-500', icon: 'text-neu-400', bg: 'bg-neu-500/10' };

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-hidden">
      <div className={`h-1 ${c.bar}`} />
      <div className="p-5 flex items-center justify-between">
        <div>
          <p className="text-3xl font-display font-semibold text-white">{value}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
    </div>
  );
}

function WeekChart({ visits }) {
  const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  const counts = days.map(day => ({
    label: format(day, 'EEE'),
    isToday: isSameDay(day, new Date()),
    count: visits.filter(v => { const d = toDate(v.timeIn); return d && isSameDay(d, day); }).length,
  }));
  const max = Math.max(...counts.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-20">
      {counts.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400">{d.count > 0 ? d.count : ''}</span>
          <div className="w-full flex items-end justify-center" style={{ height: '48px' }}>
            <div className={`w-full rounded-t-md transition-all duration-500 ${d.isToday ? 'bg-neu-400' : 'bg-slate-600'}`}
              style={{ height: `${Math.max(4, (d.count / max) * 48)}px` }} />
          </div>
          <span className="text-xs text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { visits }  = useVisits();
  const [range, setRange]           = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');

  const filtered = useMemo(() => {
    if (range === 'today') return visits.filter(v => { const d = toDate(v.timeIn); return d && isToday(d); });
    if (range === 'week')  return visits.filter(v => { const d = toDate(v.timeIn); return d && isThisWeek(d, { weekStartsOn: 1 }); });
    if (range === 'custom' && customFrom && customTo) {
      const from = startOfDay(new Date(customFrom));
      const to   = endOfDay(new Date(customTo));
      return visits.filter(v => { const d = toDate(v.timeIn); return d && d >= from && d <= to; });
    }
    return visits;
  }, [visits, range, customFrom, customTo]);

  const insideNow   = visits.filter(v => v.status === 'active');
  const todayVisits = visits.filter(v => { const d = toDate(v.timeIn); return d && isToday(d); });
  const weekVisits  = visits.filter(v => { const d = toDate(v.timeIn); return d && isThisWeek(d, { weekStartsOn: 1 }); });

  const purposeCounts = useMemo(() => {
    const map = {};
    filtered.forEach(v => { map[v.purpose] = (map[v.purpose] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const deptCounts = useMemo(() => {
    const map = {};
    filtered.forEach(v => {
      const short = v.department?.match(/\(([^)]+)\)/)?.[1] || v.department || 'Unknown';
      map[short] = (map[short] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const dateStr = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Welcome */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-neu-400 to-neu-600" />
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
            {profile?.photoURL
              ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full bg-neu-500 flex items-center justify-center text-white font-bold text-lg">{profile?.firstName?.[0]}</div>
            }
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-white">{getGreeting()}, {profile?.firstName}! 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         value={insideNow.length}   label="Inside Now"      color="green" />
        <StatCard icon={CalendarCheck} value={todayVisits.length} label="Today"            color="blue" />
        <StatCard icon={TrendingUp}    value={weekVisits.length}  label="This Week"        color="amber" />
        <StatCard icon={CheckCircle2}  value={visits.filter(v => v.status === 'completed' && isToday(toDate(v.timeIn))).length} label="Completed Today" color="slate" />
      </div>

      {/* Stats panel */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="font-semibold text-white">Visit Statistics</h2>
          <div className="flex gap-1.5 flex-wrap items-center">
            {[{k:'today',l:'Today'},{k:'week',l:'This Week'},{k:'custom',l:'Custom'}].map(r => (
              <button key={r.k} onClick={() => setRange(r.k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r.k ? 'bg-neu-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {r.l}
              </button>
            ))}
            {range === 'custom' && (
              <div className="flex gap-2 items-center mt-1 w-full sm:w-auto">
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input-field py-1.5 text-xs" />
                <span className="text-slate-400 text-xs">to</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="input-field py-1.5 text-xs" />
              </div>
            )}
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{filtered.length} visits</p>

        {/* 7-day chart */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Last 7 Days</p>
          <WeekChart visits={visits} />
        </div>

        {/* Breakdown */}
        <div className="grid sm:grid-cols-2 gap-5">
          {purposeCounts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">By Purpose</p>
              <div className="space-y-2">
                {purposeCounts.slice(0, 5).map(([purpose, count]) => (
                  <div key={purpose} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 truncate w-40">{purpose}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-neu-400 rounded-full" style={{ width: `${(count / filtered.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {deptCounts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">By Department</p>
              <div className="space-y-2">
                {deptCounts.slice(0, 5).map(([dept, count]) => (
                  <div key={dept} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 truncate w-40">{dept}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(count / filtered.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visitor type breakdown */}
        {(() => {
          const typeCounts = {};
          filtered.forEach(v => { const t = v.visitorType || 'Student'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
          const entries = Object.entries(typeCounts).sort((a,b) => b[1]-a[1]);
          if (!entries.length) return null;
          return (
            <div className="mt-5 pt-5 border-t border-slate-700/60">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">By Visitor Type</p>
              <div className="flex gap-3 flex-wrap">
                {entries.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                    <span className={`w-2 h-2 rounded-full ${type === 'Student' ? 'bg-neu-400' : type.includes('Teacher') ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-xs text-slate-300">{type}</span>
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Currently inside */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60">
        <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white text-sm">Currently Inside</h2>
            <p className="text-xs text-slate-500 mt-0.5">Active visitors right now</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Live
          </span>
        </div>
        <div className="p-4">
          {insideNow.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No active visitors right now</p>
          ) : (
            <div className="space-y-2">
              {insideNow.map(v => (
                <div key={v.id} className="flex items-center justify-between px-3 py-2.5 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neu-500/20 flex items-center justify-center text-neu-400 text-xs font-bold shrink-0">{v.studentName?.[0]}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{v.studentName}</p>
                      <p className="text-xs text-slate-400">{v.program?.match(/\(([^)]+)\)/)?.[1] || v.department || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{v.purpose}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                      <Clock size={10} />{toDate(v.timeIn) ? format(toDate(v.timeIn), 'hh:mm a') : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's log */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/60">
          <h2 className="font-semibold text-white text-sm">Today's Visit Log</h2>
          <p className="text-xs text-slate-500 mt-0.5">All visits recorded today</p>
        </div>
        {todayVisits.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen size={24} className="mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-500">No visits recorded today yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['Student','ID','Type','Dept','Program','Purpose','Time In','Time Out','Duration','Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...todayVisits].sort((a,b) => toDate(b.timeIn) - toDate(a.timeIn)).map(v => {
                  const timeIn  = toDate(v.timeIn);
                  const timeOut = toDate(v.timeOut);
                  let duration  = '—';
                  if (timeIn && timeOut) {
                    const mins = Math.round((timeOut - timeIn) / 60000);
                    duration = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
                  } else if (timeIn && v.status === 'active') {
                    const mins = Math.round((new Date() - timeIn) / 60000);
                    duration = `${mins}m`;
                  }
                  return (
                    <tr key={v.id} className="border-b border-slate-700/40 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{v.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{v.studentIdNumber || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{v.visitorType || 'Student'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[100px] truncate">{v.department?.match(/\(([^)]+)\)/)?.[1] || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[100px] truncate">{v.program?.match(/\(([^)]+)\)/)?.[1] || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{v.purpose}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{timeIn ? format(timeIn, 'hh:mm a') : '—'}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{timeOut ? format(timeOut, 'hh:mm a') : '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{duration}</td>
                      <td className="px-4 py-3">
                        {v.status === 'active'
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Active
                            </span>
                          : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400 border border-slate-600 whitespace-nowrap">Done</span>
                        }
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
