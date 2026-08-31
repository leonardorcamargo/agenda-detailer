import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
export const AuthView: React.FC = () => {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const response = signup
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (response.error) throw response.error;
      if (signup) setMessage('Confira seu e-mail para confirmar o acesso. Depois entre e use o código entregue pelo administrador. Criar a conta não libera acesso à empresa.');
    } catch (error: any) { setMessage(error.message || 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-dvh bg-[#0d121f] p-5 text-white flex items-center justify-center">
    <section className="w-full max-w-md space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h1 className="text-2xl font-bold">Agenda Detailer</h1>
      <h2>{signup ? 'Criar acesso de funcionário' : 'Entrar'}</h2>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">E-mail<input type="email" autoComplete="username" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-base" /></label>
        <label className="block text-sm">Senha<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : undefined} required disabled={busy} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-base" /></label>
        {signup && <p className="text-xs text-slate-300">Use o mesmo e-mail indicado ao administrador e uma senha própria de pelo menos 12 caracteres. Nunca compartilhe sua senha.</p>}
        <button disabled={busy} className="w-full rounded-lg bg-blue-600 p-3 font-bold">{busy ? 'Aguarde…' : signup ? 'Criar meu acesso' : 'Entrar'}</button>
      </form>
      {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
      <button disabled={busy} onClick={() => { setSignup(!signup); setMessage(''); }} className="text-sm text-blue-300 underline">{signup ? 'Já tenho conta' : 'Sou funcionário e ainda não tenho acesso'}</button>
      <p className="text-xs text-slate-400">O cadastro de novas empresas ainda não está disponível. Acesso demonstrativo desativado.</p>
    </section>
  </main>;
};
