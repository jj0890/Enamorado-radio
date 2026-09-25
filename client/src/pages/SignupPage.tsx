import { useState, FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { refresh } = useUser();
  const [form, setForm] = useState({ email: '', password: '', handle: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'Signup failed');
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
          <h1 className="font-display font-black uppercase text-white text-4xl leading-none">Join</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Display name" type="text" placeholder="Your name"
            value={form.displayName} onChange={v => setForm(f => ({ ...f, displayName: v }))} />
          <Field label="Handle" type="text" placeholder="@yourhandle"
            value={form.handle} onChange={v => setForm(f => ({ ...f, handle: v.replace(/^@/, '') }))}
            prefix="@" />
          <Field label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
          <Field label="Password" type="password" placeholder="8+ characters"
            value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />

          {error && <p className="font-mono text-[11px] text-red-400 text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue hover:bg-blue-dark text-white font-display font-black uppercase tracking-[0.06em] text-sm py-3 transition-colors disabled:opacity-50 mt-2">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="font-mono text-[10px] text-white/30 text-center mt-6">
          Already a member?{' '}
          <Link href="/login" className="text-blue hover:text-white transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type, placeholder, value, onChange, prefix }: {
  label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; prefix?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-1.5">{label}</label>
      <div className="flex items-center bg-[#13141A] border border-[#25272E] focus-within:border-blue/60 transition-colors">
        {prefix && <span className="font-mono text-sm text-white/30 pl-3">{prefix}</span>}
        <input type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} required
          className="w-full bg-transparent text-white font-mono text-sm px-3 py-3 outline-none placeholder:text-white/20" />
      </div>
    </div>
  );
}
