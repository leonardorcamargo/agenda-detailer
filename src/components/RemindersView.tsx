import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, RefreshCw, StickyNote, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { brazilDate } from '../lib/financialPeriod';

const categories = ['Geral', 'Pátio', 'Insumos', 'Cliente VIP', 'Aviso'] as const;
type Category = typeof categories[number];
interface Reminder {
  id: string;
  note_date: string;
  note: string;
  category: Category | null;
  created_at: string;
}
const fields = 'id,note_date,note,category,created_at';
const colors: Record<Category, string> = {
  Geral: 'bg-amber-100 border-amber-300',
  Pátio: 'bg-sky-100 border-sky-300',
  Insumos: 'bg-emerald-100 border-emerald-300',
  'Cliente VIP': 'bg-violet-100 border-violet-300',
  Aviso: 'bg-rose-100 border-rose-300',
};
const newForm = () => ({ note: '', note_date: brazilDate(new Date())!, category: 'Geral' as Category });
const displayDate = (value: string) => value.split('-').reverse().join('/');

export const RemindersView: React.FC<{ companyId: string; role: string | null }> = ({ companyId, role }) => {
  const [notes, setNotes] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(newForm);
  const [deleting, setDeleting] = useState<string | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const pending = useRef(false);
  const canDelete = ['owner', 'admin', 'manager'].includes(role || '');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const all: Reminder[] = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error: readError } = await supabase.from('daily_notes')
            .select(fields).eq('company_id', companyId)
            .order('note_date', { ascending: false }).order('id')
            .range(offset, offset + 499).abortSignal(controller.signal);
          if (readError) throw readError;
          all.push(...(data as Reminder[]));
          if (data.length < 500) break;
        }
        if (!controller.signal.aborted) setNotes(all);
      } catch {
        if (!controller.signal.aborted) setError('Não foi possível carregar os lembretes. Tente atualizar.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [companyId, refresh]);

  useEffect(() => {
    if (showForm) editor.current?.focus();
  }, [showForm, editing]);

  function openEditor(note?: Reminder) {
    setEditing(note?.id ?? null);
    setForm(note ? { note: note.note, note_date: note.note_date, category: note.category || 'Geral' } : newForm());
    setNotice('');
    setShowForm(true);
    setDeleting(null);
    requestAnimationFrame(() => editor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current || !form.note.trim()) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = { note: form.note.trim(), note_date: form.note_date, category: form.category };
      const query = editing
        ? supabase.from('daily_notes').update(payload).eq('company_id', companyId).eq('id', editing)
        : supabase.from('daily_notes').insert({ ...payload, company_id: companyId });
      const { data, error: saveError } = await query.select(fields).single();
      if (saveError) throw saveError;
      setNotes(previous => [data as Reminder, ...previous.filter(note => note.id !== data.id)]
        .sort((a, b) => b.note_date.localeCompare(a.note_date) || b.created_at.localeCompare(a.created_at)));
      setShowForm(false);
      setEditing(null);
      setForm(newForm());
      setNotice('Lembrete salvo.');
    } catch {
      setError('Não foi possível salvar. Seu texto foi mantido; confira a conexão e tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (pending.current || !canDelete) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: deleteError } = await supabase.from('daily_notes').delete()
        .eq('company_id', companyId).eq('id', id).select('id').single();
      if (deleteError) throw deleteError;
      setNotes(previous => previous.filter(note => note.id !== id));
      setDeleting(null);
      setNotice('Lembrete excluído.');
    } catch {
      setError('Não foi possível excluir. Confira sua conexão e permissão de gestão.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="w-full min-w-0 max-w-full space-y-5 p-3 sm:p-6" aria-label="Lembretes da empresa">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Post-its compartilhados com a equipe. Não enviam notificações.</p>
        <div className="flex gap-2">
          <button type="button" disabled={busy || loading} onClick={() => setRefresh(value => value + 1)}
            className="p-3 rounded-xl bg-slate-800 text-slate-300 disabled:opacity-50" aria-label="Atualizar lembretes">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button type="button" disabled={busy || loading || showForm} onClick={() => openEditor()}
            className="flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-bold text-slate-900 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Novo lembrete
          </button>
        </div>
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
      {showForm && (
        <form onSubmit={save} className="min-w-0 space-y-4 rounded-2xl border border-amber-300/40 bg-[#151e30] p-4 sm:p-5">
          <h2 className="font-semibold text-white">{editing ? 'Editar lembrete' : 'Novo lembrete'}</h2>
          <label className="block text-sm text-slate-300">O que precisa lembrar?
            <textarea ref={editor} required maxLength={4000} rows={4} value={form.note} disabled={busy}
              onChange={event => setForm({ ...form, note: event.target.value })}
              placeholder="Ex.: comprar shampoo automotivo ou ligar para o fornecedor"
              className="mt-2 block w-full min-w-0 max-w-full resize-y rounded-xl border border-slate-600 bg-slate-900 p-3 text-base sm:text-sm text-white focus:border-amber-300" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="min-w-0 text-sm text-slate-300">Data do lembrete
              <input type="date" required value={form.note_date} disabled={busy}
                onChange={event => setForm({ ...form, note_date: event.target.value })}
                className="mt-2 block w-full min-w-0 max-w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-base sm:text-sm text-white" />
            </label>
            <label className="min-w-0 text-sm text-slate-300">Categoria
              <select value={form.category} disabled={busy} onChange={event => setForm({ ...form, category: event.target.value as Category })}
                className="mt-2 block w-full min-w-0 max-w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-base sm:text-sm text-white">
                {categories.map(category => <option key={category}>{category}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            <button type="button" disabled={busy} onClick={() => setShowForm(false)} className="px-4 py-3 text-sm text-slate-300">Cancelar</button>
            <button type="submit" disabled={busy || !form.note.trim()} className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-slate-900 disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar lembrete'}</button>
          </div>
        </form>
      )}
      {loading ? <p role="status" className="text-slate-400">Carregando lembretes…</p> : (
        notes.length === 0 && !error ? <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          <StickyNote className="mx-auto mb-3 h-9 w-9 text-amber-300" />
          <p>Nenhum lembrete ainda. Use “Novo lembrete” para criar seu primeiro post-it.</p>
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map(note => (
            <article key={note.id} className={`relative flex min-w-0 flex-col rounded-2xl rounded-tr-none border p-5 shadow-md text-slate-900 ${colors[note.category || 'Geral'] || colors.Geral}`}>
              <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs font-semibold">
                <span>{note.category || 'Geral'}</span><time dateTime={note.note_date}>{displayDate(note.note_date)}</time>
              </div>
              <p className="flex-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed">{note.note}</p>
              <div className="mt-5 flex justify-end gap-2 border-t border-black/10 pt-2">
                <button type="button" disabled={busy || showForm} onClick={() => openEditor(note)} className="flex items-center gap-1 rounded-lg p-2 text-xs hover:bg-black/10 disabled:opacity-50"><Pencil className="w-4 h-4" /> Editar</button>
                {canDelete && <button type="button" disabled={busy || showForm} onClick={() => setDeleting(note.id)} className="flex items-center gap-1 rounded-lg p-2 text-xs hover:bg-black/10 disabled:opacity-50"><Trash2 className="w-4 h-4" /> Excluir</button>}
              </div>
              {deleting === note.id && <div className="mt-2 rounded-xl bg-white/60 p-3 text-sm">
                <p>Excluir este lembrete da equipe?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => void remove(note.id)} className="rounded-lg bg-rose-700 p-2 text-white">Sim, excluir</button>
                  <button type="button" disabled={busy} onClick={() => setDeleting(null)} className="rounded-lg p-2">Cancelar</button>
                </div>
              </div>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
