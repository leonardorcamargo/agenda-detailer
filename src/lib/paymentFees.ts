export interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  paid_at: string | null;
  source_type: string | null;
  appointment_id: string | null;
  service_order_id: string | null;
  processor_id: string | null;
  processor_name: string | null;
  installments: number | null;
  fee_percentage: number | null;
  fee_fixed: number | null;
  fee_amount: number | null;
  net_amount: number | null;
  fee_basis: 'configured' | 'statement' | 'cash' | null;
  settlement_confirmed: boolean;
  settled_at: string | null;
}
export interface PaymentProcessor { id: string; company_id: string; name: string; active: boolean }
export interface ProcessorRate {
  id: string; company_id: string; processor_id: string;
  payment_method: string; installments: number; percentage: number; fixed_fee: number;
}
export const rateMethods = ['Cartão de Débito', 'Cartão de Crédito', 'Crédito Parcelado', 'Pix'];
export const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const cents = (value: number) => Math.round(Number(value) * 100);

// Inputs are stored as numeric(...,2). Round half up in integer space, matching Postgres.
export function calculateFee(amount: number, percentage: number, fixedFee: number) {
  if (![amount, percentage, fixedFee].every(Number.isFinite) || amount <= 0 || percentage < 0 || percentage > 100 || fixedFee < 0) throw new Error('Valores de taxa inválidos.');
  const gross = BigInt(cents(amount));
  const fee = (gross * BigInt(cents(percentage)) + 5000n) / 10000n + BigInt(cents(fixedFee));
  if (fee > gross) throw new Error('A taxa supera o valor do pagamento.');
  return { fee: Number(fee) / 100, net: Number(gross - fee) / 100 };
}

export function summarizePayments(payments: PaymentRecord[], expenses: number) {
  const paid = payments.filter(p => p.status === 'Pago');
  const gross = paid.reduce((sum, p) => sum + cents(p.amount), 0);
  const known = paid.filter(p => p.fee_amount !== null && p.net_amount !== null);
  const fees = known.reduce((sum, p) => sum + cents(p.fee_amount!), 0);
  const net = known.reduce((sum, p) => sum + cents(p.net_amount!), 0);
  const credited = known.filter(p => p.settlement_confirmed).reduce((sum, p) => sum + cents(p.net_amount!), 0);
  const unresolved = paid.length - known.length;
  return { gross: gross / 100, fees: fees / 100, knownNet: net / 100, credited: credited / 100,
    unresolved, unconfirmed: known.filter(p => !p.settlement_confirmed).length,
    result: unresolved ? null : (net - cents(expenses)) / 100 };
}
