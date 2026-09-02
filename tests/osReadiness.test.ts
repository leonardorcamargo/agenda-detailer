import test from 'node:test';
import assert from 'node:assert/strict';
import { getOsReadiness, pendingOsReadiness } from '../src/lib/osReadiness';

test('lista os dados que faltam para concluir uma OS', () => {
  const items = getOsReadiness({
    companyId: 'company-1',
    clientName: '',
    plate: '',
    serviceCount: 0,
    engineTermRequired: false,
    engineTermAccepted: false,
    anyTermAccepted: false,
    termResponsibleName: '',
  });

  assert.deepEqual(pendingOsReadiness(items).map((item) => item.id), ['customer', 'vehicle', 'services']);
});

test('exige termo e responsável quando há limpeza de motor', () => {
  const items = getOsReadiness({
    companyId: 'company-1',
    clientName: 'Cliente',
    plate: 'ABC1D23',
    serviceCount: 1,
    engineTermRequired: true,
    engineTermAccepted: false,
    anyTermAccepted: true,
    termResponsibleName: '',
  });

  assert.deepEqual(pendingOsReadiness(items).map((item) => item.id), ['engine-term', 'responsible']);
});
