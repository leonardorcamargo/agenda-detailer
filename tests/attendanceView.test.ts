import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaffAttendance } from '../src/components/StaffAttendance';
import type { StaffMember, StaffWorkLog } from '../src/types';
const staff = { id: 'p1', name: 'Pessoa Teste', commissionType: 'Diária Fixa', dailyRate: 180 } as StaffMember;
const props = { staff, date: '2026-08-31', busy: false, canManage: true, canDelete: true,
  onSave: async () => true, onDelete: async () => true };
const logs: StaffWorkLog[] = [
  { id: '1', staffId: 'p1', staffName: staff.name, date: '2026-08-31', status: 'Falta', dailyRateCharged: 0 },
  { id: '2', staffId: 'p1', staffName: staff.name, date: '2026-08-30', status: 'Presente', dailyRateCharged: 180 },
  { id: '3', staffId: 'other', staffName: staff.name, date: '2026-08-29', status: 'Presente' },
];
const html = renderToStaticMarkup(React.createElement(StaffAttendance, { ...props, logs }));
assert.match(html, /Ver calendário e dias trabalhados/);
assert.match(html, /31\/08\/2026: Falta/);
assert.match(html, /30\/08\/2026: Presente/);
assert.match(html, /29\/08\/2026: Sem registro/);
assert.match(html, /Presente: 1/);
assert.match(html, /Falta: 1/);
assert.match(html, /Apagar registro deste dia/);
for (const status of ['Presente', 'Meio Período', 'Falta', 'Folga']) assert.ok(html.includes('>' + status + '</button>'));
const readOnly = renderToStaticMarkup(React.createElement(StaffAttendance, { ...props, logs, canManage: false, canDelete: false }));
assert.ok(!readOnly.includes('Apagar registro deste dia'));
assert.ok(!readOnly.includes('>Falta</button>'));
assert.match(readOnly, /Ver calendário e dias trabalhados/);
const empty = renderToStaticMarkup(React.createElement(StaffAttendance, { ...props, logs: [] }));
assert.match(empty, /31\/08\/2026: Sem registro/);
assert.ok(!empty.includes('Registro salvo'));
console.log('attendanceView: OK (markup; not browser interaction or mobile layout)');
