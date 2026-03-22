// src/pages/admin/AdminVisits.jsx
import { useState, useMemo } from 'react';
import { useVisits, visitOps, toDate } from '../../hooks/useFirestore';
import { isToday, format, startOfDay, endOfDay } from 'date-fns';
import { Search, X, ClipboardList, Loader2 } from 'lucide-react';

export default function AdminVisits() {
  const { visits, loading } = useVisits();
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('today');
  const [customFrom, setFrom]   = useState('');
  const [customTo, setTo]       = useState('');
  const [timedOut, setTimedOut] = useState(null);

  const filtered = useMemo(() => {
    let list = [...visits];
    if (filter === 'today')  list = list.filter(v => { const d = toDate(v.timeIn); return d && isToday(d); });
    if (filter === 'active') list = list.filter(v => v.status === 'active');
    if (filter === 'custom' && customFrom && customTo) {
      const from = startOfDay(new Date(customFrom));
      const to   = endOfDay(new Date(customTo));
      list = list.filter(v => { const d = toDate(v.timeIn); return d && d >= from && d <= to; });
    }
    if (search) {
      const t = search.toLowerCase();
      list = list.filter(v =>
        v.studentName?.toLowerCase().includes(t) ||
        v.studentIdNumber?.toLowerCase().includes(t) ||
        v.department?.toLowerCase().includes(t) ||
        v.program?.toLowerCase().includes(t) ||
        v.purpose?.toLowerCase().includes(t) ||
        v.visitorType?.toLowerCase().includes(t)
      );
    }
    return list.sort((a,b) => toDate(b.timeIn) - toDate(a.timeIn));
  }, [visits, filter, search, customFrom, customTo]);

  async function handleTimeOut(v) {
    setTimedOut(v.id);
    try { await visitOps.timeOut(v.id); }
    finally { setTimedOut(null); }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white">Visit Logs</h1>
        <p className="text-slate-400 text-sm mt-0.5">{filtered.length} records found</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-600 text-sm bg-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neu-400"
            placeholder="Search name, ID, department, purpose…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={15} /></button>}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{k:'today',l:'Today'},{k:'active',l:'Active'},{k:'all',l:'All'},{k:'custom',l:'Custom'}].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f.k ? 'bg-neu-500 text-white' : 'bg-slate-700 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600'}`}>
              {f.l}
            </button>
          ))}
        </div>
        {filter === 'custom' && (
          <div className="flex gap-2 items-center w-full">
            <input type="date" value={customFrom} onChange={e => setFrom(e.target.value)} className="input-field py-2 text-xs" />
            <span className="text-slate-500 text-xs">to</span>
            <input type="date" value={customTo} onChange={e => setTo(e.target.value)} className="input-field py-2 text-xs" />
          </div>
        )}
      </div>

      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><Loader2 size={22} className="animate-spin text-slate-500 mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList size={26} className="mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-500">No records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['Student','ID','Type','Department','Program','Purpose','Time In','Time Out','Duration','Status',''].map((h,i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
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
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[110px] truncate">{v.department?.match(/\(([^)]+)\)/)?.[1] || v.department || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[110px] truncate">{v.program?.match(/\(([^)]+)\)/)?.[1] || v.program || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{v.purpose}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{timeIn ? format(timeIn, 'MMM d · hh:mm a') : '—'}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{timeOut ? format(timeOut, 'hh:mm a') : '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{duration}</td>
                      <td className="px-4 py-3">
                        {v.status === 'active'
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Active
                            </span>
                          : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400 border border-slate-600">Done</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {v.status === 'active' && (
                          <button onClick={() => handleTimeOut(v)} disabled={timedOut === v.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600 transition-colors whitespace-nowrap">
                            {timedOut === v.id ? <Loader2 size={12} className="animate-spin inline" /> : 'Time Out'}
                          </button>
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
