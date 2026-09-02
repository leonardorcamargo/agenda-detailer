import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTermSnapshot, requiresEngineTerm } from '../src/legal/legalContent';

test('exige termo para lavagem, limpeza ou higienização de motor', () => {
  assert.equal(requiresEngineTerm(['Lavagem Técnica de Motor']), true);
  assert.equal(requiresEngineTerm(['Limpeza do motor']), true);
  assert.equal(requiresEngineTerm(['Polimento Comercial']), false);
});

test('registra responsável e versão no snapshot aceito', () => {
  const snapshot = buildTermSnapshot({
    generalAccepted: true,
    engineAccepted: true,
    responsibleName: 'Cliente Teste',
  });

  assert.match(snapshot, /Cliente Teste/);
  assert.match(snapshot, /Termo de responsabilidade do serviço/);
  assert.match(snapshot, /Termo obrigatório para limpeza ou lavagem de motor/);
});
