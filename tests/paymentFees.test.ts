import assert from 'node:assert/strict';
import { calculateFee, PaymentRecord, summarizePayments } from '../src/lib/paymentFees';
assert.deepEqual(calculateFee(100, 2.5, 0), { fee: 2.5, net: 97.5 });
assert.deepEqual(calculateFee(199.99, 3.49, 0.39), { fee: 7.37, net: 192.62 });
assert.deepEqual(calculateFee(0.50, 1, 0), { fee: 0.01, net: 0.49 });
assert.deepEqual(calculateFee(0.10, 5, 0), { fee: 0.01, net: 0.09 });
assert.deepEqual(calculateFee(100, 0, 0), { fee: 0, net: 100 });
assert.throws(() => calculateFee(1, 99, 1));
assert.throws(() => calculateFee(100, -1, 0));
const record = (amount: number, fee: number | null, confirmed=false) => ({
 amount, fee_amount: fee, net_amount: fee===null ? null : amount-fee, settlement_confirmed: confirmed, status: 'Pago',
}) as PaymentRecord;
let totals=summarizePayments([record(100, 3, true),record(200,null)],20);
assert.equal(totals.gross,300); assert.equal(totals.credited,97); assert.equal(totals.result,null);assert.equal(totals.unresolved,1);
totals=summarizePayments([record(100,3,true),record(200,10)],20);
assert.equal(totals.result,267);assert.equal(totals.fees,13);assert.equal(totals.knownNet,287);assert.equal(totals.unconfirmed,1);
assert.equal(summarizePayments([record(0.1,0),record(0.2,0)],0).gross,0.3);
assert.equal(summarizePayments([{...record(100,3),status:'Cancelado'}],0).gross,0);
console.log('PASS: rounding, fee bounds, unknown legacy fees, settlement distinction and no double fee deduction');
