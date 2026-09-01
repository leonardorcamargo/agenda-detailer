import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
export const AuthView: React.FC = () => {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const inviteCode = new URLSearchParams(window.location.search).get('clockInvite');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const response = signup
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.href } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (response.error) throw response.error;
      if (signup) setMessage('Confira seu e-mail para confirmar a conta. A autorização recebida será vinculada depois que você entrar.');
    } catch (error: any) { setMessage(error.message || 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-dvh bg-[#0d121f] p-5 text-white flex items-center justify-center">
    <section className="w-full max-w-md space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h1 className="text-2xl font-bold">Agenda Detailer</h1>
      <h2>{signup ? 'Criar conta' : 'Entrar'}</h2>
      {inviteCode && <p className="rounded-lg bg-blue-950 p-3 text-sm text-blue-200">Convite identificado. Entre ou crie a conta usando o mesmo e-mail autorizado pelo administrador.</p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">E-mail<input type="email" autoComplete="username" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-base" /></label>
        <label className="block text-sm">Senha<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : undefined} required disabled={busy} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-base" /></label>
        {signup && <p className="text-xs text-slate-300">Use uma senha própria de pelo menos 12 caracteres. Se recebeu um convite, informe exatamente o e-mail autorizado.</p>}
        <button disabled={busy} className="w-full rounded-lg bg-blue-600 p-3 font-bold">{busy ? 'Aguarde…' : signup ? 'Criar meu acesso' : 'Entrar'}</button>
      </form>
      <div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-700" />ou<span className="h-px flex-1 bg-slate-700" /></div>
      <button disabled={busy} onClick={async () => {
        setBusy(true); setMessage('');
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
        if (error) { setMessage(error.message || 'Não foi possível entrar com o Google.'); setBusy(false); }
      }} className="w-full rounded-lg border border-slate-600 bg-white p-3 font-bold text-slate-900 disabled:opacity-60">Continuar com Google</button>
      {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
      <button disabled={busy} onClick={() => { setSignup(!signup); setMessage(''); }} className="text-sm text-blue-300 underline">{signup ? 'Já tenho conta' : 'Criar uma conta'}</button>
      <p className="text-xs text-slate-400">O cadastro de novas empresas ainda não está disponível. Acesso demonstrativo desativado.</p>
    </section>
  </main>;
};
