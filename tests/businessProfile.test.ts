import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_BUSINESS_MODULES, isTabEnabled, normalizeBusinessAreas, normalizeBusinessModules } from '../src/lib/businessProfile';

test('mantém todos os módulos para empresas antigas', () => {
  assert.deepEqual(normalizeBusinessModules(undefined), DEFAULT_BUSINESS_MODULES);
});

test('dashboard e configurações permanecem disponíveis', () => {
  assert.equal(isTabEnabled([], 'financeiro'), false);
  assert.equal(isTabEnabled([], 'dashboard'), true);
  assert.equal(isTabEnabled([], 'configuracoes'), true);
});

test('normaliza, remove duplicatas e limita áreas', () => {
  const areas = normalizeBusinessAreas([' Centro automotivo ', 'Centro automotivo', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  assert.deepEqual(areas.slice(0, 2), ['Centro automotivo', 'A']);
  assert.equal(areas.length, 8);
});
