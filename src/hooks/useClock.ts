import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { brazilDate } from '../lib/financialPeriod';
import type { ClockSnapshot, ClockEvent, ClockKind } from '../lib/clock';

export function useClock(userId: string, companyId: string, enabled = true) {
  const key = userId + ':' + companyId;
  const keyRef = useRef(key); keyRef.current = key;
  const [day, setDay] = useState(() => brazilDate(new Date())!);
  const [state, setState] = useState<{ key: string; data: ClockSnapshot } | null>(null);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [alerts, setAlerts] = useState<ClockEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const pending = useRef(false);
  const reading = useRef(0);
  const version = useRef(0);
  const queryKey = key + ':' + day + ':' + enabled;
  const queryRef = useRef(queryKey); queryRef.current = queryKey;
  const seen = useRef<{ key: string; lastId: number } | null>(null);
  const retry = useRef<{ key: string; kind: ClockKind; account: string; previous: number | null; requestId: string } | null>(null);
  const refresh = useCallback(async (force = false) => {
    if (!userId || !enabled || (reading.current && !force)) return;
    const ticket = ++version.current;
    reading.current = ticket;
    try {
      const { data, error } = await supabase.rpc('employee_clock', { p_action: 'snapshot', p_data: { company_id: companyId || null, day } });
      if (error) throw error;
      if (queryRef.current !== queryKey || version.current !== ticket) return;
      const snapshot = data as ClockSnapshot;
      const latest = Math.max(0, ...snapshot.recent.map(e => Number(e.id)));
      if (seen.current?.key === key) {
        const fresh = snapshot.recent.filter(e => Number(e.id) > seen.current!.lastId);
        if (fresh.length) setAlerts(old => [...fresh, ...old].slice(0, 10));
      }
      seen.current = { key, lastId: latest };
      setState({ key: queryKey, data: snapshot }); setConnected(true); setReadError('');
    } catch {
      if (queryRef.current === queryKey && version.current === ticket) { setConnected(false); setReadError('Não foi possível atualizar o ponto. Confira a conexão e sua sessão.'); }
    } finally { if (reading.current === ticket) reading.current = 0; }
  }, [userId, companyId, key, queryKey, day, enabled]);
  useEffect(() => { setAlerts([]); setConnected(false); setError(''); setReadError(''); }, [key]);
  useEffect(() => {
    void refresh(true);
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 5000);
    const wake = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', wake);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', wake); };
  }, [refresh]);
  async function act(action: string, data: Record<string, unknown>) {
    if (pending.current || !userId || !enabled) return null;
    pending.current = true; setBusy(true); setError('');
    try {
      const response = await supabase.rpc('employee_clock', { p_action: action, p_data: data });
      if (response.error) throw response.error;
      if (keyRef.current !== key) return null;
      await refresh(true);
      return response.data || { ok: true };
    } catch (cause: any) {
      if (keyRef.current === key) setError(cause?.message || 'A operação não foi confirmada. Atualize antes de tentar novamente.');
      return null;
    } finally { pending.current = false; setBusy(false); }
  }
  async function record(account: string, kind: ClockKind, previous: number | null) {
    // Mantém a mesma chave ao repetir após falha de rede: servidor retorna o original.
    if (!retry.current || retry.current.key !== key || retry.current.account !== account || retry.current.kind !== kind || retry.current.previous !== previous)
      retry.current = { key, kind, account, previous, requestId: crypto.randomUUID() };
    const response = await act('record', { account_id: account, kind, previous_id: previous, request_id: retry.current.requestId });
    if (response) retry.current = null;
    return response;
  }
  return { data: state?.key === queryKey && enabled ? state.data : null, day, setDay, error: error || readError, busy, connected: connected && state?.key === queryKey && enabled,
    alerts: state?.key === queryKey && enabled ? alerts : [], dismissAlerts: () => setAlerts([]), refresh, act, record };
}
