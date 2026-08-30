import React, { useRef, useState } from 'react';
import { Repeat2, Pencil, Trash2 } from 'lucide-react';
import { useExpenses, ExpenseRow, RecurringExpense } from '../hooks/useExpenses';
import { localDate, monthlyDueDate } from '../lib/expenseDates';
import { ShopExpense } from '../types';

const categories: ShopExpense['category'][] = ['Produtos', 'Equipamentos', 'Contas / Fixo', 'Comissão', 'Outros'];
const field = 'w-full bg-[#182338] border border-[#283854] text-white px-3 py-2 rounded-xl text-xs';
const button = 'rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 disabled:opacity-40';
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ExpenseManager({ model, role }: { model: ReturnType<typeof useExpenses>; role: string | null }) {
  const { expenses, recurring, loading, busy, error } = model;
  const canManage = ['owner', 'admin', 'manager'].includes(role ?? '');
  const canDelete = ['owner', 'admin'].includes(role ?? '');
  const [mode, setMode] = useState<'once' | 'template'>('once');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ShopExpense['category']>('Contas / Fixo');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(localDate);
  const [day, setDay] = useState('10');
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  const [editing, setEditing] = useState<string>();
  const [source, setSource] = useState<string | null>(null);
  const [recordMonth, setRecordMonth] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const disabled = busy || loading || !canManage;

  const reset = (next: 'once' | 'template' = 'once') => {
    setMode(next); setDescription(''); setValue(''); setCategory('Contas / Fixo');
    setDate(localDate()); setDay('10'); setEditing(undefined); setSource(null); setRecordMonth(null); setValidation('');
  };
  const focusForm = () => form.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const useTemplate = (item: RecurringExpense, edit = false) => {
    try {
      const due = edit ? '' : monthlyDueDate(month, item.due_day);
      reset(edit ? 'template' : 'once'); setDescription(item.description); setCategory(item.category);
      setValue(item.value.toFixed(2)); setDay(String(item.due_day));
      if (edit) setEditing(item.id);
      else { setSource(item.id); setRecordMonth(`${month}-01`); setDate(due); }
      setMessage(''); focusForm();
    } catch (err) { setValidation((err as Error).message); }
  };
  const editExpense = (item: ExpenseRow) => {
    reset(); setEditing(item.id); setDescription(item.description); setCategory(item.category);
    setValue(item.value.toFixed(2)); setDate(item.expense_date); setSource(item.recurring_expense_id);
    setRecordMonth(item.recurrence_month); setMessage(''); focusForm();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(''); setValidation('');
    const amount = Number(value);
    if (!description.trim() || !Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99) {
      setValidation('Informe a descrição e um valor positivo válido.'); return;
    }
    if (recordMonth && date.slice(0, 7) !== recordMonth.slice(0, 7)) {
      setValidation('O vencimento deve ficar dentro do mês selecionado para esta recorrência.'); return;
    }
    const input = { description: description.trim(), category, value: Math.round(amount * 100) / 100 };
    if (mode === 'template' && (!Number.isInteger(Number(day)) || Number(day) < 1 || Number(day) > 31)) {
      setValidation('Informe um dia de vencimento entre 1 e 31.'); return;
    }
    const ok = mode === 'template'
      ? await model.saveRecurring({ ...input, due_day: Number(day) }, editing)
      : await model.saveExpense({ ...input, expense_date: date, recurring_expense_id: source, recurrence_month: recordMonth }, editing);
    if (ok) {
      setMessage(mode === 'template' ? 'Despesa fixa salva. Use “Lançar mês” para conferir e registrar cada competência.' : 'Lançamento salvo.');
      reset();
    }
  };

  return <section className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 sm:p-5 space-y-4 min-w-0">
    <h3 className="text-sm font-bold text-white">Registrar Despesa / Custo</h3>
    {error && <div role="alert" className="text-xs text-rose-300">{error} <button type="button" disabled={busy || loading} onClick={() => void model.reload()} className="underline">Atualizar lista</button></div>}
    {validation && <p role="alert" className="text-xs text-rose-300">{validation}</p>}
    {message && <p role="status" className="text-xs text-emerald-300">{message}</p>}
    {loading && <p role="status" className="text-xs text-slate-400">Carregando despesas…</p>}
    {!canManage && <p className="text-xs text-slate-400">Somente o proprietário, administrador ou gerente pode registrar e editar despesas.</p>}
    {canManage && <>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} aria-pressed={mode === 'once'} className={`${button} ${mode === 'once' ? 'bg-blue-600/20 border-blue-400' : ''}`} onClick={() => reset()}>Despesa avulsa</button>
        <button type="button" disabled={busy} aria-pressed={mode === 'template'} className={`${button} ${mode === 'template' ? 'bg-blue-600/20 border-blue-400' : ''}`} onClick={() => reset('template')}>Fixa mensal</button>
      </div>
      <form ref={form} onSubmit={submit} className="space-y-3">
        <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60">
          {source && <p className="text-xs text-blue-300">Recorrência • {recordMonth?.slice(0, 7).split('-').reverse().join('/')} — ajuste o valor deste mês antes de confirmar.</p>}
          {mode === 'template' && <>
            <p className="text-xs text-slate-400">Cadastre uma vez e reutilize todo mês. O valor padrão pode ser alterado sem modificar o histórico.</p>
            <div className="flex flex-wrap gap-1.5">{['Aluguel', 'Internet', 'Energia elétrica', 'Água', 'Contabilidade', 'Sistema / Assinatura'].map(label => <button key={label} type="button" className="rounded-full bg-slate-700/50 px-2.5 py-1.5 text-[11px] text-slate-300" onClick={() => { setDescription(label); setCategory('Contas / Fixo'); }}>{label}</button>)}</div>
          </>}
          <label className="block text-xs text-slate-300">Descrição<input required maxLength={200} value={description} onChange={e => setDescription(e.target.value)} className={`${field} mt-1`} placeholder="Ex.: Aluguel da oficina" /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs text-slate-300">Categoria<select value={category} onChange={e => setCategory(e.target.value as ShopExpense['category'])} className={`${field} mt-1`}>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="block text-xs text-slate-300">{mode === 'template' ? 'Valor padrão (R$)' : 'Valor (R$)'}<input required type="number" min="0.01" max="9999999999.99" step="0.01" value={value} onChange={e => setValue(e.target.value)} className={`${field} mt-1`} /></label>
          </div>
          {mode === 'template'
            ? <label className="block text-xs text-slate-300">Dia do vencimento<input required type="number" min="1" max="31" step="1" value={day} onChange={e => setDay(e.target.value)} className={`${field} mt-1`} /><span className="block mt-1 text-[11px] text-slate-400">Em meses mais curtos, será usado o último dia do mês.</span></label>
            : <label className="block text-xs text-slate-300">Data da despesa / vencimento<input required type="date" value={date} onChange={e => setDate(e.target.value)} className={`${field} mt-1`} /></label>}
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white">{busy ? 'Salvando…' : editing ? 'Salvar alterações' : mode === 'template' ? 'Salvar despesa fixa' : 'Confirmar lançamento'}</button>
          {(editing || source) && <button type="button" className={button} onClick={() => reset()}>Cancelar edição</button>}
        </fieldset>
      </form>
    </>}

    <div className="border-t border-[#23314a] pt-4 space-y-3">
      <h4 className="flex gap-2 items-center text-sm font-semibold text-white"><Repeat2 className="w-4 h-4 text-blue-400" /> Despesas fixas mensais</h4>
      <p className="text-[11px] text-slate-400">Escolha o mês e confirme o lançamento. Não há cobrança nem pagamento automático.</p>
      <label className="block text-xs text-slate-300">Mês de referência<input type="month" required value={month} onChange={e => setMonth(e.target.value)} className={`${field} mt-1`} /></label>
      {!loading && recurring.length === 0 && <p className="text-xs text-slate-500">Nenhuma despesa fixa cadastrada.</p>}
      {recurring.map(item => {
        const existing = expenses.find(expense => expense.recurring_expense_id === item.id && expense.recurrence_month === `${month}-01`);
        return <div key={item.id} className="bg-[#182338] rounded-xl border border-[#263757] p-3 space-y-2">
          <div className="flex justify-between gap-2 text-xs"><span className="font-semibold text-white break-words min-w-0">{item.description}</span><span className="shrink-0 text-slate-200">{money(item.value)}</span></div>
          <p className="text-[11px] text-slate-400">Dia {item.due_day} • {item.active ? 'Ativa' : 'Pausada'}{existing ? ' • Já lançada neste mês' : ''}</p>
          {canManage && <div className="flex flex-wrap gap-2">
            <button type="button" disabled={disabled || !item.active || !!existing || !month} className={button} onClick={() => useTemplate(item)}>Lançar mês</button>
            <button type="button" disabled={disabled} className={button} onClick={() => useTemplate(item, true)}>Editar padrão</button>
            <button type="button" disabled={disabled} className={button} onClick={() => void model.setActive(item.id, !item.active)}>{item.active ? 'Pausar' : 'Reativar'}</button>
          </div>}
        </div>;
      })}
    </div>
    <div className="border-t border-[#23314a] pt-4 space-y-2">
      <h4 className="text-xs font-medium text-slate-400">Histórico de lançamentos</h4>
      {!loading && expenses.length === 0 && <p className="text-xs text-slate-500">Nenhuma despesa registrada.</p>}
      {expenses.map(item => <div key={item.id} className="bg-[#182338] border border-[#263757] p-3 rounded-xl text-xs space-y-2">
        <div className="flex justify-between gap-2"><span className="font-semibold text-white break-words min-w-0">{item.description}</span><span className="shrink-0 font-semibold text-rose-300">{money(item.value)}</span></div>
        <p className="text-[11px] text-slate-400">{item.expense_date.split('-').reverse().join('/')} • {item.category}{item.recurring_expense_id ? ' • Recorrente' : ''}</p>
        <div className="flex gap-2">
          {canManage && <button type="button" disabled={disabled} className={button} aria-label={`Editar ${item.description}`} onClick={() => editExpense(item)}><Pencil className="w-3.5 h-3.5" /></button>}
          {canDelete && <button type="button" disabled={disabled} className={button} aria-label={`Excluir ${item.description}`} onClick={() => { if (window.confirm(`Excluir o lançamento “${item.description}”? A despesa fixa, se houver, será mantida.`)) void model.removeExpense(item.id); }}><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>
      </div>)}
    </div>
  </section>;
}
