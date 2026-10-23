// Formato de números y fechas en español de España.

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const tarifa = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const horas = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

const fecha = (opciones) => new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...opciones });
const fLarga = fecha({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fCorta = fecha({ weekday: 'short', day: 'numeric', month: 'short' });
const fNum = fecha({ day: '2-digit', month: '2-digit', year: 'numeric' });
const fMes = fecha({ month: 'long', year: 'numeric' });
const fDia = fecha({ weekday: 'long' });

const aDate = (f) => new Date(f + 'T00:00:00Z');
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const fmtEuros = (n) => euros.format(n);
export const fmtTarifa = (n) => tarifa.format(n) + ' €/h';
export const fmtHoras = (n) => horas.format(n) + ' h';
export const fmtLarga = (f) => mayus(fLarga.format(aDate(f)));
export const fmtCorta = (f) => fCorta.format(aDate(f));
export const fmtNum = (f) => fNum.format(aDate(f));
export const fmtMes = (f) => fMes.format(aDate(f));
export const fmtDia = (f) => mayus(fDia.format(aDate(f)));

export const tituloPeriodo = (p) => (p.fin ? 'Nómina de ' + fmtMes(p.fin) : 'Periodo abierto');
export const rangoPeriodo = (p) =>
  `Del ${p.inicio ? fmtNum(p.inicio) : 'primer registro'} al ${p.fin ? fmtNum(p.fin) : 'próximo cierre'}, ambos incluidos`;
