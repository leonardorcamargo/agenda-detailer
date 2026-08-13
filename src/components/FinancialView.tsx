import React, { useState } from 'react';
import { ServiceOrder, ShopExpense } from '../types';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock,
  PieChart as PieChartIcon
} from 'lucide-react';

interface FinancialViewProps {
  orders: ServiceOrder[];
  expenses: ShopExpense[];
  onAddExpense: (expense: ShopExpense) => void;
  onRemoveExpense: (id: string) => void;
  onUpdatePaymentStatus: (orderId: string, status: 'Pago' | 'Pendente' | 'Parcial' | 'Fiado') => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  orders,
  expenses,
  onAddExpense,
  onRemoveExpense,
  onUpdatePaymentStatus,
}) => {
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Produtos' | 'Equipamentos' | 'Contas / Fixo' | 'Comissão' | 'Outros'>('Produtos');
  const [expenseValue, setExpenseValue] = useState('');

  // Financial calculations
  const totalReceived = orders
    .filter((o) => o.paymentStatus === 'Pago')
    .reduce((sum, o) => sum + o.totalValue, 0);

  const totalPending = orders
    .filter((o) => o.paymentStatus === 'Pendente')
    .reduce((sum, o) => sum + o.totalValue, 0);

  const totalFiado = orders
    .filter((o) => o.paymentStatus === 'Fiado' || o.paymentMethod === 'Fiado')
    .reduce((sum, o) => sum + o.totalValue, 0);

  const totalExpensesValue = expenses.reduce((sum, e) => sum + e.value, 0);
  const netProfit = totalReceived - totalExpensesValue;

  // Payment Breakdown
  const paymentMethodStats = {
    'Pix': 0,
    'Cartão de Crédito': 0,
    'Cartão de Débito': 0,
    'Dinheiro': 0,
    'Fiado': 0,
    'Pendente': 0,
  };

  orders.forEach((o) => {
    if (o.paymentMethod in paymentMethodStats) {
      paymentMethodStats[o.paymentMethod as keyof typeof paymentMethodStats] += o.totalValue;
    }
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseValue) return;

    const newExpense: ShopExpense = {
      id: 'exp_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: expenseDesc,
      category: expenseCategory,
      value: parseFloat(expenseValue) || 0,
    };

    onAddExpense(newExpense);
    setExpenseDesc('');
    setExpenseValue('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Financeiro</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Controle de entradas, contas a receber, faturamento por forma de pagamento e despesas da oficina.
        </p>
      </div>

      {/* Top Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Recebido */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Recebido</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-emerald-400">
              R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">OS pagas</p>
          </div>
        </div>

        {/* Card 2: A Receber (Pendente) */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">A Receber</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-amber-400">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Pendentes</p>
          </div>
        </div>

        {/* Card 3: Total Fiado / A Prazo */}
        <div className="bg-[#141c2b] border border-purple-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-purple-300">Fiado / A Prazo</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-purple-400">
              R$ {totalFiado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-purple-300/70 mt-1">Conta de Clientes</p>
          </div>
        </div>

        {/* Card 4: Despesas da Oficina */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Despesas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-rose-400">
              R$ {totalExpensesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Custos fixos e insumos</p>
          </div>
        </div>

        {/* Card 5: Lucro Estimado */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Lucro Estimado</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-blue-400">
              R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Recebido (-) Despesas</p>
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-blue-400" />
          Faturamento por Forma de Pagamento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(paymentMethodStats).map(([method, val]) => (
            <div key={method} className="bg-[#182338] border border-[#263757] p-3.5 rounded-xl">
              <span className="text-xs text-slate-400 block font-medium">{method}</span>
              <div className="text-lg font-bold text-white mt-1">
                R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses & OS Payment Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Register & Manage Expenses */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight">Registrar Despesa / Custo</h3>

          <form onSubmit={handleCreateExpense} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="Ex: Compra de Polidores Vonixx"
                className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
                <select
                  value={expenseCategory}
                  onChange={(e: any) => setExpenseCategory(e.target.value)}
                  className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Produtos">Produtos / Insumos</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Contas / Fixo">Contas / Fixo</option>
                  <option value="Comissão">Comissão de Staff</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  value={expenseValue}
                  onChange={(e) => setExpenseValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-right"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Lançar Despesa
            </button>
          </form>

          {/* Expenses List */}
          <div className="space-y-2 pt-2 border-t border-[#23314a]">
            <span className="text-xs font-medium text-slate-400">Histórico de Lançamentos:</span>
            {expenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between bg-[#182338] border border-[#263757] px-3 py-2 rounded-xl text-xs"
              >
                <div>
                  <div className="font-semibold text-white">{e.description}</div>
                  <span className="text-[10px] text-slate-400">{e.date} • {e.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-rose-400">- R$ {e.value.toFixed(2)}</span>
                  <button
                    onClick={() => onRemoveExpense(e.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Manage OS Payment Statuses */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight">Status de Recebimento de OS</h3>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-[#182338] border border-[#263757] p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>#{o.osNumber} - {o.plate}</span>
                    <span className="text-[10px] font-mono text-slate-400">({o.brand} {o.model})</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cliente: {o.clientName} • Forma: {o.paymentMethod}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-400">R$ {o.totalValue.toFixed(2)}</span>

                  <select
                    value={o.paymentStatus}
                    onChange={(e: any) => onUpdatePaymentStatus(o.id, e.target.value)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                      o.paymentStatus === 'Pago'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : o.paymentStatus === 'Fiado'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    <option value="Pago" className="bg-[#121929] text-emerald-400">Pago</option>
                    <option value="Pendente" className="bg-[#121929] text-amber-400">Pendente</option>
                    <option value="Parcial" className="bg-[#121929] text-blue-400">Parcial</option>
                    <option value="Fiado" className="bg-[#121929] text-purple-300">Fiado / A Prazo</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
