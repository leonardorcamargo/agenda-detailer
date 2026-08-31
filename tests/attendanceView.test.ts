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
assert.match(html, /30\/08\/2026: Dia inteiro/);
assert.match(html, /29\/08\/2026: Sem trabalho registrado/);
assert.match(html, /Dia inteiro: 1/);
assert.match(html, /Registrar trabalho/);
assert.match(html, /Apagar registro deste dia/);
assert.ok(!html.includes('Registrar ocorrência'));
const readOnly = renderToStaticMarkup(React.createElement(StaffAttendance, { ...props, logs, canManage: false, canDelete: false }));
assert.ok(!readOnly.includes('Apagar registro deste dia'));
assert.ok(!readOnly.includes('>Falta</button>'));
assert.match(readOnly, /Ver calendário e dias trabalhados/);
const empty = renderToStaticMarkup(React.createElement(StaffAttendance, { ...props, logs: [] }));
assert.match(empty, /31\/08\/2026: Sem trabalho registrado/);
assert.ok(!empty.includes('Registro salvo'));
const fixed = renderToStaticMarkup(React.createElement(StaffAttendance, { ...props, staff: { ...staff, contractType: 'Fixo / CLT', workDays: [1], workScheduleFrom: '2026-08-01' }, logs: [] }));
assert.match(fixed, /Registrar ocorrência/);
assert.ok(!fixed.includes('Registrar trabalho'));
assert.match(fixed, /Ver calendário de ocorrências/);
assert.match(fixed, /31\/08\/2026: Sem ocorrência registrada/);
assert.match(fixed, /30\/08\/2026: Fora da escala/);
const timed = renderToStaticMarkup(React.createElement(StaffAttendance, { ...props, logs: [{ ...logs[0], status: 'Por horário', arrivalTime: '22:00', departureTime: '02:30', departureNextDay: true }] }));
assert.match(timed, /4h 30min de permanência/);
assert.match(timed, /dia seguinte/);
console.log('attendanceView: OK (markup, not mobile interaction)');
