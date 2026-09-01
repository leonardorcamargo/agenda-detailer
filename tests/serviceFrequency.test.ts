import assert from 'node:assert/strict';
import test from 'node:test';
import { buildServiceUsage, mostUsedServiceKeys, serviceUsageKey, sortServicesByUsage } from '../src/lib/serviceFrequency';

const services: any[] = [
  { id: '1', name: 'Polimento', defaultPrice: 100 },
  { id: '2', name: 'Lavagem Simples', defaultPrice: 50 },
  { id: '3', name: 'Higienização', defaultPrice: 200 },
];

const order = (createdAt: string, names: string[]) => ({
  createdAt,
  services: names.map((name) => ({ serviceId: name, name, price: 1 })),
});

test('ordena por quantidade de OS e usa recência no empate', () => {
  const usage = buildServiceUsage([
    order('2026-08-01T10:00:00Z', ['Lavagem Simples']),
    order('2026-08-02T10:00:00Z', ['Polimento']),
    order('2026-08-03T10:00:00Z', ['Lavagem Simples']),
  ] as any);
  assert.deepEqual(sortServicesByUsage(services as any, usage).map((item) => item.name), [
    'Lavagem Simples', 'Polimento', 'Higienização',
  ]);
});

test('conta o serviço somente uma vez em cada OS e normaliza acentos', () => {
  const usage = buildServiceUsage([
    order('2026-08-01T10:00:00Z', ['Higienização', 'Higienizacao']),
  ] as any);
  assert.equal(usage[serviceUsageKey('Higienização')].count, 1);
});

test('destaca serviços desde a primeira utilização', () => {
  const usage = buildServiceUsage([order('2026-08-01T10:00:00Z', ['Polimento'])] as any);
  assert.equal(mostUsedServiceKeys(usage).has(serviceUsageKey('Polimento')), true);
});
