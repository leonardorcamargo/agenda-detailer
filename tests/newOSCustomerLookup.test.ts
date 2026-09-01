import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/NewOSView.tsx', import.meta.url), 'utf8');
assert.match(source, /Consultar cliente pelo nome/);
assert.match(source, /\.from\('customers'\)[\s\S]*?\.eq\('company_id', companyId\)[\s\S]*?\.ilike\('name'/);
assert.match(source, /\.from\('vehicles'\)[\s\S]*?\.eq\('company_id', companyId\)[\s\S]*?\.eq\('customer_id', customerId\)/);
assert.match(source, /Usar outro veículo/);
assert.match(source, /setSelectedCustomerId\(customer\.id\)/);
assert.match(source, /resolveVehicleCustomer\(customerId, vehicleOwnerLookup\?\.customer_id/);
assert.match(source, /Esta placa já está cadastrada[\s\S]*Consultar placa/);
assert.match(source, /customerRequest\.current !== request/);
assert.match(source, /limit\(10\)/);
assert.match(source, /type="search"/);
assert.match(source, /text-base sm:text-sm/);

console.log('newOSCustomerLookup: PASS — empresa, busca, seleção, outro veículo, conflito, limite e resposta obsoleta');
