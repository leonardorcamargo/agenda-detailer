import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
export const AuthView: React.FC = () => {
  const [clockAccess, setClockAccess] = useState(false);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  async function activateClock(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      const normalized = code.toLowerCase().replace(/[^0-9a-f]/g, '');
      const { error } = await supabase.rpc('employee_clock', { p_action: 'activate', p_data: { code: normalized } });
      if (error) throw error;
    } catch (error: any) {
      await supabase.auth.signOut();
      setMessage(error.message || 'Não foi possível ativar este aparelho.');
    } finally { setBusy(false); }
  }
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
      <h2>{clockAccess ? 'Ativar ponto neste celular' : signup ? 'Criar acesso de funcionário' : 'Entrar'}</h2>
      {clockAccess ? <form onSubmit={activateClock} className="space-y-4">
        <p className="text-sm text-slate-300">Digite uma única vez o código mostrado pelo administrador. Depois, este celular abrirá diretamente os botões do seu ponto.</p>
        <label className="block text-sm">Código do funcionário<input inputMode="text" autoCapitalize="characters" autoComplete="one-time-code" required minLength={16} maxLength={19} disabled={busy} value={code} onChange={e => setCode(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-center font-mono text-lg uppercase tracking-wider" /></label>
        <button disabled={busy} className="w-full rounded-lg bg-blue-600 p-3 font-bold">{busy ? 'Ativando…' : 'Ativar meu ponto'}</button>
      </form> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">E-mail<input type="email" autoComplete="username" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-base" /></label>
        <label className="block text-sm">Senha<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 12 : undefined} required disabled={busy} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-base" /></label>
        {signup && <p className="text-xs text-slate-300">Use o mesmo e-mail indicado ao administrador e uma senha própria de pelo menos 12 caracteres. Nunca compartilhe sua senha.</p>}
        <button disabled={busy} className="w-full rounded-lg bg-blue-600 p-3 font-bold">{busy ? 'Aguarde…' : signup ? 'Criar meu acesso' : 'Entrar'}</button>
      </form>}
      {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
      <button disabled={busy} onClick={() => { setClockAccess(!clockAccess); setSignup(false); setMessage(''); }} className="block text-sm text-blue-300 underline">{clockAccess ? 'Voltar para a entrada da gestão' : 'Sou funcionário: registrar meu ponto'}</button>
      {!clockAccess && <button disabled={busy} onClick={() => { setSignup(!signup); setMessage(''); }} className="text-sm text-slate-400 underline">{signup ? 'Já tenho conta' : 'Acesso antigo por e-mail'}</button>}
      <p className="text-xs text-slate-400">O cadastro de novas empresas ainda não está disponível. Acesso demonstrativo desativado.</p>
    </section>
  </main>;
};
