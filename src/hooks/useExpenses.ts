import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShopExpense } from '../types';

export interface ExpenseRow {
  id: string;
  company_id: string;
  description: string;
  category: ShopExpense['category'];
  value: number;
  expense_date: string;
  recurring_expense_id: string | null;
  recurrence_month: string | null;
}
export interface RecurringExpense {
  id: string;
  company_id: string;
  description: string;
  category: ShopExpense['category'];
  value: number;
  due_day: number;
  active: boolean;
}
export type ExpenseInput = Pick<ExpenseRow, 'description' | 'category' | 'value' | 'expense_date' | 'recurring_expense_id' | 'recurrence_month'>;
export type RecurringInput = Pick<RecurringExpense, 'description' | 'category' | 'value' | 'due_day'>;

export function useExpenses(companyId: string) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError('');
    if (!companyId) { setExpenses([]); setRecurring([]); setLoading(false); return; }
    try {
      // Read all pages so totals and duplicate indicators are not capped at 1,000 rows.
      const readAll = async (table: string) => {
        const rows: any[] = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error: queryError } = await supabase.from(table).select('*')
            .eq('company_id', companyId).order('id').range(offset, offset + 499);
          if (queryError) throw queryError;
          rows.push(...(data ?? []));
          if (!data || data.length < 500) return rows;
        }
      };
      const [records, templates] = await Promise.all([readAll('expenses'), readAll('recurring_expenses')]);
      if (request !== generation.current) return;
      setExpenses(records.map(row => ({ ...row, value: Number(row.value) })).sort((a, b) => b.expense_date.localeCompare(a.expense_date)));
      setRecurring(templates.map(row => ({ ...row, value: Number(row.value) })).sort((a, b) => a.description.localeCompare(b.description)));
    } catch {
      if (request === generation.current) setError('Não foi possível carregar as despesas. Tente atualizar a lista.');
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { void load(); return () => { generation.current++; }; }, [load]);

  const mutate = async (action: () => PromiseLike<{ error: any; data: any }>) => {
    if (lock.current || !companyId || loading) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await action();
      if (result.error) throw result.error;
      if (!result.data?.length) throw new Error('Registro não encontrado ou sem permissão.');
      await load();
      return true;
    } catch (failure: any) {
      setError(failure?.code === '23505'
        ? 'Esta despesa recorrente já foi lançada neste mês. Atualize a lista para conferir.'
        : failure?.code === '42501'
          ? 'Seu usuário não tem permissão para esta operação.'
          : 'Não foi possível salvar a alteração. Confira sua conexão e tente novamente.');
      return false;
    } finally { lock.current = false; setBusy(false); }
  };

  return { expenses, recurring, loading, busy, error, reload: load,
    saveExpense: (input: ExpenseInput, id?: string) => mutate(() => id
      ? supabase.from('expenses').update(input).eq('id', id).eq('company_id', companyId).select('id')
      : supabase.from('expenses').insert({ ...input, company_id: companyId }).select('id')),
    saveRecurring: (input: RecurringInput, id?: string) => mutate(() => id
      ? supabase.from('recurring_expenses').update(input).eq('id', id).eq('company_id', companyId).select('id')
      : supabase.from('recurring_expenses').insert({ ...input, company_id: companyId }).select('id')),
    setActive: (id: string, active: boolean) => mutate(() => supabase.from('recurring_expenses').update({ active }).eq('id', id).eq('company_id', companyId).select('id')),
    removeExpense: (id: string) => mutate(() => supabase.from('expenses').delete().eq('id', id).eq('company_id', companyId).select('id')),
  };
}
