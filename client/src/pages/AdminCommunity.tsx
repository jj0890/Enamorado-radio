import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Users, FileText, Image } from 'lucide-react';

interface User { id: number; handle: string; displayName: string; email: string; role: string; createdAt: string; }
interface Contribution { id: number; userId: number; type: string; title: string; url?: string; status: string; createdAt: string; }

export default function AdminCommunity() {
  const [tab, setTab] = useState<'users' | 'contributions' | 'avatars'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [contribs, setContribs] = useState<Contribution[]>([]);

  useEffect(() => {
    fetch('/api/user/admin/users', { credentials: 'include' }).then(r => r.json()).then(d => setUsers(d.users ?? []));
    fetch('/api/user/admin/contributions', { credentials: 'include' }).then(r => r.json()).then(d => setContribs(d.contributions ?? []));
  }, []);

  async function setRole(id: number, role: string) {
    await fetch(`/api/user/admin/users/${id}/role`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  }

  async function approveContrib(id: number) {
    await fetch(`/api/user/admin/contributions/${id}/approve`, { method: 'POST', credentials: 'include' });
    setContribs(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
  }

  async function rejectContrib(id: number) {
    await fetch(`/api/user/admin/contributions/${id}/reject`, { method: 'POST', credentials: 'include' });
    setContribs(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
  }

  const pending = contribs.filter(c => c.status === 'pending');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-black uppercase text-2xl text-gray-900 dark:text-white">Community</h1>
        <p className="font-mono text-xs text-gray-500 mt-1">Members · contributions · moderation</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: 'Members', value: users.length },
          { icon: FileText, label: 'Pending', value: pending.length },
          { icon: CheckCircle, label: 'Approved', value: contribs.filter(c => c.status === 'approved').length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white dark:bg-[#13141A] border border-gray-200 dark:border-[#25272E] p-5 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
            </div>
            <div className="font-display font-black text-3xl text-gray-900 dark:text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-white/10 mb-6">
        {(['users', 'contributions', 'avatars'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-mono text-[10px] uppercase tracking-[0.16em] px-4 py-2.5 border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue text-blue' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-white/60'}`}>
            {t}
            {t === 'contributions' && pending.length > 0 && (
              <span className="ml-1.5 bg-blue text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                {['Handle', 'Name', 'Email', 'Role', 'Joined', ''].map(h => (
                  <th key={h} className="text-left font-mono text-[9px] uppercase tracking-widest text-gray-400 pb-3 pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-6 font-mono text-sm text-gray-900 dark:text-white">@{u.handle}</td>
                  <td className="py-3 pr-6 text-gray-700 dark:text-white/70">{u.displayName}</td>
                  <td className="py-3 pr-6 font-mono text-xs text-gray-400">{u.email}</td>
                  <td className="py-3 pr-6">
                    <select value={u.role} onChange={e => setRole(u.id, e.target.value)}
                      className="font-mono text-xs bg-transparent border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 px-2 py-1 rounded outline-none cursor-pointer">
                      <option value="member">member</option>
                      <option value="moderator">moderator</option>
                    </select>
                  </td>
                  <td className="py-3 pr-6 font-mono text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <a href={`/community/@${u.handle}`} className="font-mono text-[10px] text-blue hover:underline">View</a>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center font-mono text-xs text-gray-400">No members yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Contributions queue */}
      {tab === 'contributions' && (
        <div className="space-y-2">
          {contribs.map(c => (
            <div key={c.id} className="flex items-center gap-4 bg-white dark:bg-[#13141A] border border-gray-200 dark:border-[#25272E] px-5 py-4 rounded-lg">
              <StatusDot status={c.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400">{c.type}</span>
                  <span className="font-mono text-[9px] text-gray-300 dark:text-white/20">· user #{c.userId}</span>
                </div>
                <p className="font-mono text-sm text-gray-900 dark:text-white truncate">{c.title}</p>
              </div>
              {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-blue hover:underline flex-shrink-0">Link</a>}
              {c.status === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approveContrib(c.id)}
                    className="flex items-center gap-1 font-mono text-[10px] text-green-600 hover:text-green-500 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => rejectContrib(c.id)}
                    className="flex items-center gap-1 font-mono text-[10px] text-red-500 hover:text-red-400 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {contribs.length === 0 && (
            <p className="text-center font-mono text-xs text-gray-400 py-12">No contributions yet</p>
          )}
        </div>
      )}

      {tab === 'avatars' && (
        <p className="font-mono text-xs text-gray-400 py-12 text-center">Avatar approval queue — uploads appear here pending moderation</p>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { pending: 'bg-yellow-400', approved: 'bg-green-400', rejected: 'bg-red-400' };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] ?? 'bg-gray-300'}`} />;
}
