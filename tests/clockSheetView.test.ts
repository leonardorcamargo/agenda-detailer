import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../src/components/ClockSheet.tsx',import.meta.url),'utf8');
assert.match(source,/aria-label="Folha de ponto"/);
assert.match(source,/type="month"/);
assert.match(source,/lg:hidden/);assert.match(source,/hidden min-w-0 overflow-x-auto.*lg:block/);
assert.match(source,/Horas validadas/);assert.match(source,/Horas pendentes/);
assert.match(source,/cancelled=true/);assert.match(source,/state\?\.key===key/);
assert.match(source,/p_company_id:companyId,p_staff_id:staffId/);
// Os cálculos são cobertos por clockSheet.test.ts; estas são guardas estáticas,
// não teste de interação nem comprovação visual em iPhone.
console.log('clockSheetView: PASS — guardas estáticas de filtros, layout e resposta obsoleta');
