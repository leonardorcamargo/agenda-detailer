import assert from 'node:assert/strict';
import { escapeIlikeTerm, normalizePlate, resolveVehicleCustomer } from '../src/lib/customerVehicleSelection';

assert.equal(normalizePlate(' abc-1d23 '), 'ABC1D23');
assert.equal(normalizePlate(''), '');
assert.equal(escapeIlikeTerm('  João_100% \\ '), 'João\\_100\\% \\\\');
assert.deepEqual(resolveVehicleCustomer('cliente-a', 'cliente-a'), { customerId: 'cliente-a', conflict: false });
assert.deepEqual(resolveVehicleCustomer('cliente-a', null), { customerId: 'cliente-a', conflict: false });
assert.deepEqual(resolveVehicleCustomer(null, 'cliente-b'), { customerId: 'cliente-b', conflict: false });
assert.deepEqual(resolveVehicleCustomer('cliente-a', 'cliente-b'), { customerId: 'cliente-a', conflict: true });
assert.deepEqual(resolveVehicleCustomer(null, null), { customerId: null, conflict: false });

console.log('customerVehicleSelection: PASS — placa, busca literal, escolha de cliente e conflito de proprietário');
