// Ejecutar con: node --test test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tablaPara, valorHora, periodoDe, desglose, diaSemana, sumarDias, categoriaEn, cambiarCategoria, INCREMENTOS,
  aniosConHoras,
} from '../js/dominio.js';

const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const G7 = 25521.62;
const siempre = (categoria) => [{ desde: null, categoria }];

test('valor hora peón 2026 (tabla publicada)', () => {
  const t = tablaPara('G7', 2026);
  assert.equal(t.estado, 'publicada');
  cerca(valorHora(t, 2026, false), (G7 / 1752) * 1.6);
  cerca(valorHora(t, 2026, true), (G7 / 1752) * 1.75);
});

test('2027-2029 pendientes con subidas pactadas encadenadas y su jornada', () => {
  const t27 = tablaPara('G7', 2027);
  assert.equal(t27.estado, 'pendiente');
  assert.equal(t27.incremento, 3);
  cerca(t27.total, G7 * 1.03);
  cerca(t27.totalAnterior, G7);
  cerca(valorHora(t27, 2027, false), ((G7 * 1.03) / 1744) * 1.6);
  cerca(tablaPara('G7', 2028).total, G7 * 1.03 * 1.03);
  cerca(tablaPara('G7', 2029).total, G7 * 1.03 * 1.03 * 1.04);
  cerca(tablaPara('G7', 2031).total, G7 * 1.03 * 1.03 * 1.04); // sin convenio: sin más subidas
});

test('revisión por IPC: el exceso se aplica a ese año y sirve de base al siguiente', () => {
  INCREMENTOS[2026].ipcReal = 6;
  try {
    const t26 = tablaPara('G7', 2026);
    assert.equal(t26.estado, 'revisada');
    cerca(t26.total, (G7 / 1.05) * 1.06);
    cerca(tablaPara('G7', 2027).total, (G7 / 1.05) * 1.06 * 1.03);
  } finally {
    INCREMENTOS[2026].ipcReal = null;
  }
  INCREMENTOS[2026].ipcReal = 4; // por debajo de lo pactado: no cambia nada
  try { cerca(tablaPara('G7', 2026).total, G7); } finally { INCREMENTOS[2026].ipcReal = null; }
});

test('periodos con el ejemplo del usuario', () => {
  const cierres = ['2026-09-13', '2026-10-18'];
  const p = periodoDe('2026-10-01', cierres);
  assert.deepEqual(p, { inicio: '2026-09-14', fin: '2026-10-18' });
  assert.deepEqual(periodoDe('2026-10-18', cierres), p); // el día de cierre entra en la nómina que cierra
  assert.deepEqual(periodoDe('2026-10-19', cierres), { inicio: '2026-10-19', fin: null });
  assert.deepEqual(periodoDe('2026-01-01', cierres), { inicio: null, fin: '2026-09-13' });
});

test('fechas', () => {
  assert.equal(diaSemana('2026-10-18'), 0); // domingo
  assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(sumarDias('2026-03-29', 1), '2026-03-30'); // cambio de hora sin efecto
});

test('historial de categoría', () => {
  let h = siempre('G7');
  h = cambiarCategoria(h, 'G6', '2026-10-15');
  assert.deepEqual(h, [{ desde: null, categoria: 'G7' }, { desde: '2026-10-15', categoria: 'G6' }]);
  assert.equal(categoriaEn(h, '2026-10-14'), 'G7');
  assert.equal(categoriaEn(h, '2026-10-15'), 'G6');
  // Un cambio anterior borra los tramos posteriores
  h = cambiarCategoria(h, 'G5B', '2026-09-01');
  assert.deepEqual(h, [{ desde: null, categoria: 'G7' }, { desde: '2026-09-01', categoria: 'G5B' }]);
  assert.deepEqual(cambiarCategoria(h, 'G1'), siempre('G1'));
  assert.deepEqual(cambiarCategoria(siempre('G7'), 'G7', '2026-05-01'), siempre('G7'));
});

test('desglose: domingo festivo, cambio de categoría y año pendiente', () => {
  const regs = [
    { fecha: '2026-10-18', medias: 3, festivo: false }, // domingo, 1,5 h
    { fecha: '2026-10-16', medias: 2, festivo: false }, // viernes, 1 h
    { fecha: '2026-10-12', medias: 2, festivo: true }, // lunes festivo marcado
    { fecha: '2026-10-19', medias: 4, festivo: false }, // fuera del periodo
  ];
  const { lineas, totales } = desglose(regs, { inicio: '2026-09-14', fin: '2026-10-18' }, siempre('G7'));
  assert.deepEqual(lineas.map((l) => l.fecha), ['2026-10-12', '2026-10-16', '2026-10-18']);
  assert.equal(totales.horasLaborables, 1);
  assert.equal(totales.horasFestivas, 2.5);
  assert.equal(totales.horasPendientes, 0);
  cerca(totales.importeTotal, (G7 / 1752) * (1.6 + 2.5 * 1.75));

  const h = [{ desde: null, categoria: 'G7' }, { desde: '2026-10-16', categoria: 'G1' }];
  const d2 = desglose(regs, { inicio: '2026-09-14', fin: '2026-10-18' }, h);
  assert.deepEqual(d2.lineas.map((l) => l.categoria), ['G7', 'G1', 'G1']);
  assert.deepEqual(d2.totales.categorias, ['G7', 'G1']);

  const d3 = desglose([{ fecha: '2027-01-04', medias: 2, festivo: false }], { inicio: null, fin: null }, siempre('G7'));
  assert.equal(d3.totales.horasPendientes, 1);
  cerca(d3.totales.subidaEstimada, ((G7 * 0.03) / 1744) * 1.6);
  assert.deepEqual(d3.totales.aniosPendientes, [{ anio: 2027, incremento: 3 }]);
  assert.deepEqual(aniosConHoras([...regs, { fecha: '2027-01-04', medias: 2 }]), [2027, 2026]);
});
