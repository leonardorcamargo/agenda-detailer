import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClockView, ClockAlerts } from '../src/components/ClockView';
const fixture: any = {
  data: { accounts: [{ id: 'a1', staff_id: 's1', name: 'Funcionário <script>', company_name: 'Empresa', own: true, active: true }],
    events: [], corrections: [], recent: [], manager: false, admin: false, server_now: '2026-08-31T12:00:00Z' },
  day: '2026-08-31', setDay() {}, error: '', busy: false, connected: true,
  alerts: [], dismissAlerts() {}, refresh: async () => {}, act: async () => null, record: async () => null,
};
const render = (clock: any) => renderToStaticMarkup(React.createElement(ClockView, { clock, staffList: [] }));
const own = render(fixture);
assert.match(own, /Meu ponto/);
assert.match(own, /Entrada<\/button>/);
assert.ok(!own.includes('Liberar acesso de funcionário'));
assert.ok(!own.includes('Conferir ponto da equipe'));
assert.ok(own.includes('Funcionário &lt;script&gt;'));
assert.ok(!own.includes('<script>'));
const disconnected = render({ ...fixture, connected: false });
assert.match(disconnected, /disabled=""[^>]*>Entrada<\/button>/);
const breakClock = { ...fixture, data: { ...fixture.data, accounts: [{ ...fixture.data.accounts[0], last_event: { id: 1, kind: 'break_start', recorded_at: '2026-08-31T12:00:00Z' } }] } };
assert.match(render(breakClock), /Volta do intervalo<\/button>/);
assert.ok(!render(breakClock).includes('Entrada</button>'));
const manager = { ...fixture, data: { ...fixture.data, manager: true, admin: true } };
assert.match(render(manager), /Liberar acesso de funcionário/);
assert.match(render(manager), /Conferir ponto da equipe/);
const notification = { ...manager, alerts: [{ id: 1, kind: 'entry', name: 'Pessoa', recorded_at: '2026-08-31T12:15:30Z' }] };
const popup = renderToStaticMarkup(React.createElement(ClockAlerts, { clock: notification, onOpen() {} }));
assert.match(popup, /Ponto registrado/); assert.match(popup, /Pessoa/); assert.match(popup, /09:15:30/);
assert.match(popup, /role="status"/);
assert.equal(renderToStaticMarkup(React.createElement(ClockAlerts, { clock: { ...notification, data: fixture.data }, onOpen() {} })), '');
assert.equal(renderToStaticMarkup(React.createElement(ClockAlerts, { clock: { ...notification, data: null }, onOpen() {} })), '');
console.log('clockView: PASS — role-specific markup, offline button, server-time popup (not browser interaction)');
