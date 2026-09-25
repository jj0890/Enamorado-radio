import { useState, FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { refresh } = useUser();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'Login failed');
      await refresh();
      setLocation('/settings');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#090909] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3">Enamorado Radio</p>
          <h1 className="font-display font-black uppercase text-white text-4xl leading-none">Sign in</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-1.5">Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} required
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-[#13141A] border border-[#25272E] focus:border-blue/60 text-white font-mono text-sm px-3 py-3 outline-none placeholder:text-white/20 transition-colors" />
          </div>
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-1.5">Password</label>
            <input type="password" placeholder="••••••••" value={form.password} required
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-[#13141A] border border-[#25272E] focus:border-blue/60 text-white font-mono text-sm px-3 py-3 outline-none placeholder:text-white/20 transition-colors" />
          </div>

          {error && <p className="font-mono text-[11px] text-red-400 text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue hover:bg-blue-dark text-white font-display font-black uppercase tracking-[0.06em] text-sm py-3 transition-colors disabled:opacity-50 mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="font-mono text-[10px] text-white/30 text-center mt-6">
          New here?{' '}
          <Link href="/signup" className="text-blue hover:text-white transition-colors">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
