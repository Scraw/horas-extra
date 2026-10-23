// Datos del usuario en localStorage, solo en este dispositivo. Formato de la copia de seguridad = este mismo objeto.

const CLAVE = 'rhe-datos';
const CLAVE_AVISO = 'rhe-aviso-version';
export const FORMATO = 2;

const vacio = () => ({
  formato: FORMATO,
  ajustes: null, // { categorias: [{ desde: 'AAAA-MM-DD' | null, categoria }] }, ver categoriaEn() en dominio.js
  tema: 'auto', // 'auto' | 'claro' | 'oscuro'
  dias: {}, // { 'AAAA-MM-DD': { medias, festivo } }
  cierres: [], // ['AAAA-MM-DD'], último día que entra en cada nómina
  ultimaCopia: null, // fecha ISO de la última copia exportada
});

function leerLS(clave) {
  try { return localStorage.getItem(clave); } catch { return null; }
}
function escribirLS(clave, valor) {
  try { localStorage.setItem(clave, valor); return true; } catch { return false; }
}

export function cargar() {
  const texto = leerLS(CLAVE);
  if (!texto) return vacio();
  try { return validar(JSON.parse(texto)); } catch { return vacio(); }
}

/** Devuelve false si el navegador no deja guardar (modo privado, almacenamiento lleno...). */
export function guardar(datos) {
  return escribirLS(CLAVE, JSON.stringify(datos));
}

export function registros(datos) {
  return Object.entries(datos.dias).map(([fecha, d]) => ({ fecha, medias: d.medias, festivo: d.festivo }));
}

export function avisoAceptado(version) {
  return leerLS(CLAVE_AVISO) === version;
}
export function versionAvisoAnterior() {
  return leerLS(CLAVE_AVISO);
}
export function aceptarAviso(version) {
  escribirLS(CLAVE_AVISO, version);
}

/** Pide al navegador que no borre los datos por falta de espacio o inactividad (no siempre lo concede). */
export async function pedirPersistencia() {
  try { return (await navigator.storage?.persist?.()) ?? false; } catch { return false; }
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Comprueba y normaliza un objeto de datos (también el de una copia importada). Lanza Error si no es válido. */
export function validar(obj) {
  if (!obj || typeof obj !== 'object' || typeof obj.dias !== 'object' || !Array.isArray(obj.cierres)) {
    throw new Error('El archivo no es una copia de Registrador de horas extra.');
  }
  if (obj.formato > FORMATO) {
    throw new Error('La copia es de una versión más nueva de la app. Actualiza la app e inténtalo de nuevo.');
  }
  const datos = vacio();
  if (Array.isArray(obj.ajustes?.categorias)) {
    const tramos = obj.ajustes.categorias
      .filter((t) => t && typeof t.categoria === 'string' && (t.desde === null || FECHA.test(t.desde)))
      .map((t) => ({ desde: t.desde, categoria: t.categoria }))
      .sort((a, b) => (a.desde === null ? -1 : b.desde === null ? 1 : a.desde < b.desde ? -1 : 1));
    if (tramos.length) {
      tramos[0].desde = null;
      datos.ajustes = { categorias: tramos };
    }
  } else if (typeof obj.ajustes?.categoria === 'string') {
    // Formato 1 (v0.2.0): una sola categoría para todo y una localidad que ya no se usa.
    datos.ajustes = { categorias: [{ desde: null, categoria: obj.ajustes.categoria }] };
  }
  if (['auto', 'claro', 'oscuro'].includes(obj.tema)) datos.tema = obj.tema;
  for (const [fecha, d] of Object.entries(obj.dias)) {
    if (!FECHA.test(fecha) || !d) continue;
    const medias = Math.max(0, Math.min(48, Math.round(Number(d.medias) || 0)));
    if (medias > 0 || d.festivo) datos.dias[fecha] = { medias, festivo: !!d.festivo };
  }
  datos.cierres = [...new Set(obj.cierres.filter((c) => typeof c === 'string' && FECHA.test(c)))].sort();
  if (typeof obj.ultimaCopia === 'string') datos.ultimaCopia = obj.ultimaCopia;
  return datos;
}
