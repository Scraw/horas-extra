// Tablas salariales y cálculo de horas extra. Sin dependencias del navegador para poder probarlo con Node.
// Las fechas son cadenas 'AAAA-MM-DD'; compararlas como texto equivale a compararlas como fechas.

export const COEF_LABORABLE = 1.6;
export const COEF_FESTIVO = 1.75;

// De momento solo se aplica el convenio de la provincia de A Coruña. Lugo y Vigo quedan preparados para el futuro:
// para activarlos, añade sus tablas en TABLAS_BASE y ponlos en LOCALIDADES_ACTIVAS.
export const LOCALIDADES = { CORUNA: 'A Coruña', LUGO: 'Lugo', VIGO: 'Vigo' };
export const LOCALIDADES_ACTIVAS = ['CORUNA'];
export const LOCALIDAD = 'CORUNA';
export const NOMBRE_PROVINCIA = LOCALIDADES[LOCALIDAD];

// Tablas 2026 del Convenio del Metal de la provincia de A Coruña 2026-2029 (ya incluyen la subida del 5 % de 2026).
// total = Retribución total anual (R.T.A.) en euros. Los ids son estables: es lo que se guarda en los datos.
const CORUNA_2026 = [
  { id: 'G1', grupo: '1', descripcion: 'Técnicos de Grado Superior', total: 36970.54 },
  { id: 'G2', grupo: '2', descripcion: 'Técnicos de Grado Medio', total: 35589.72 },
  { id: 'G3A', grupo: '3 A', descripcion: 'Jefe de Taller y Jefe Administ. de 1ª y 2ª', total: 32272.98 },
  { id: 'G3B', grupo: '3 B', descripcion: 'Jefe Organización de 1ª y 2ª, Delineante/Dibujante Proyectista y Técnicos Industriales', total: 31238.94 },
  { id: 'G3C', grupo: '3 C', descripcion: 'Maestro de Taller y Contramaestre', total: 30910.36 },
  { id: 'G4', grupo: '4', descripcion: 'Delineante de 1ª, Práctico en Topografía, Técnico Organización 1ª y 2ª, Encargado', total: 29169.46 },
  { id: 'G5A', grupo: '5 A', descripcion: 'Oficial Administración 1ª y 2ª, Viajante y Delineante 2ª', total: 28976.54 },
  { id: 'G5B', grupo: '5 B', descripcion: 'Profesional de Oficio y Siderúrgico de 1ª y 2ª, Chófer camión, grúa y turismo', total: 27295.56 },
  { id: 'G6', grupo: '6', descripcion: 'Almacenero, Aux. Admón. y Organización, Especialista, Telefonista, Profesional Oficio y Siderúrgico 3ª, Pesador-basculero', total: 26461.16 },
  { id: 'G7', grupo: '7', descripcion: 'Peón, Ordenanza, Portero y Vigilante', total: 25521.62 },
];

/**
 * Tablas publicadas en el BOP, con clave 'AÑO-LOCALIDAD'. Cuando se publique la de un año, se añade aquí con los
 * mismos ids y ese año deja de estar "pendiente de revisión salarial".
 */
const TABLAS_PUBLICADAS = {
  '2026-CORUNA': CORUNA_2026,
};

/**
 * Art. 38 (incremento pactado) y art. 39 (revisión si el IPC real estatal a 31 de diciembre supera el pactado,
 * con efectos del 1 de enero y atrasos en una paga en el primer trimestre del año siguiente).
 * ipcReal: rellénalo (en %) cuando se conozca. Si supera al pactado, ese año se recalcula con el IPC
 * y sirve de base para los siguientes.
 */
export const INCREMENTOS = {
  2026: { pactado: 5, ipcReal: null },
  2027: { pactado: 3, ipcReal: null },
  2028: { pactado: 3, ipcReal: null },
  2029: { pactado: 4, ipcReal: null },
};

// Jornada máxima anual (art. 28 del convenio).
const HORAS_ANUALES = { 2026: 1752, 2027: 1744, 2028: 1744, 2029: 1740 };

const ANIO_BASE = 2026;
const anioMax = Math.max(...Object.keys(INCREMENTOS).map(Number));

/** Subida efectiva de un año en tanto por uno: la pactada o el IPC real si es mayor. */
function subida(anio) {
  const inc = INCREMENTOS[anio];
  if (!inc) return 0;
  return Math.max(inc.pactado, inc.ipcReal ?? 0) / 100;
}

/** Categorías a mostrar en la selección. */
export function categorias() {
  return CORUNA_2026;
}

export function categoria(id) {
  return categorias().find((c) => c.id === id) ?? null;
}

/**
 * R.T.A. aplicable a un día del año `anio`:
 * - Año con tabla publicada: la tabla, ajustada si el IPC real de ese año superó lo pactado (revisión del art. 39).
 * - Año sin tabla publicada: la del año anterior más la subida pactada. Es una estimación "pendiente de revisión salarial".
 * Fuera de la vigencia del convenio (después de 2029) se mantiene la última estimación sin más subidas.
 * Devuelve { categoria, total, totalAnterior, anio, estado: 'publicada' | 'revisada' | 'pendiente', incremento } o null.
 */
export function tablaPara(idCategoria, anio, localidad = LOCALIDAD) {
  const base = TABLAS_PUBLICADAS[`${ANIO_BASE}-${localidad}`]?.find((c) => c.id === idCategoria);
  if (!base) return null;
  const a = Math.max(ANIO_BASE, Math.min(anio, anioMax + 1));
  const rta = (y) => {
    const publicada = TABLAS_PUBLICADAS[`${y}-${localidad}`]?.find((c) => c.id === idCategoria);
    const inc = INCREMENTOS[y];
    if (publicada) {
      // La tabla publicada lleva la subida pactada; si el IPC la supera, se revisa por el exceso.
      const factor = inc ? (1 + subida(y)) / (1 + inc.pactado / 100) : 1;
      return publicada.total * factor;
    }
    return rta(y - 1) * (1 + subida(y));
  };
  const publicada = !!TABLAS_PUBLICADAS[`${a}-${localidad}`];
  const inc = INCREMENTOS[a];
  const revisada = !!inc && inc.ipcReal !== null && inc.ipcReal > inc.pactado;
  return {
    categoria: base,
    total: rta(a),
    totalAnterior: a > ANIO_BASE ? rta(a - 1) : null,
    anio: a,
    estado: publicada ? (revisada ? 'revisada' : 'publicada') : 'pendiente',
    incremento: publicada ? (revisada ? inc.ipcReal : inc?.pactado ?? 0) : subida(a) * 100,
  };
}

/** Horas efectivas anuales (H). Fuera de 2026-2029 usa el año más cercano. */
export function horasAnuales(anio) {
  if (HORAS_ANUALES[anio]) return HORAS_ANUALES[anio];
  const anios = Object.keys(HORAS_ANUALES).map(Number);
  return HORAS_ANUALES[anio < Math.min(...anios) ? Math.min(...anios) : Math.max(...anios)];
}

/** Redondea a céntimos (la mitad hacia arriba), corrigiendo el error de coma flotante (p. ej. 1,005 → 1,01). */
export function aCentimos(n) {
  return Math.round(Number((n * 100).toPrecision(15))) / 100;
}

/**
 * Valor de la hora extra: R.T.A. / H x coeficiente, redondeado a 2 decimales antes de multiplicarlo por las horas.
 * `total` permite valorar con otra R.T.A.
 */
export function valorHora(tabla, anio, festivo, total = tabla.total) {
  return aCentimos((total / horasAnuales(anio)) * (festivo ? COEF_FESTIVO : COEF_LABORABLE));
}

// ---- Fechas ----

const aUTC = (f) => Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10));
const deUTC = (ms) => new Date(ms).toISOString().slice(0, 10);

export function sumarDias(fecha, n) {
  return deUTC(aUTC(fecha) + n * 86400000);
}

/** 0 = domingo ... 6 = sábado. */
export function diaSemana(fecha) {
  return new Date(aUTC(fecha)).getUTCDay();
}

export function anioDe(fecha) {
  return +fecha.slice(0, 4);
}

export function hoyLocal(ahora = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${p(ahora.getMonth() + 1)}-${p(ahora.getDate())}`;
}

// ---- Categoría a lo largo del tiempo ----

/**
 * Historial de categorías: [{ desde: 'AAAA-MM-DD' | null, categoria }], ordenado; desde null = desde siempre.
 * Devuelve la categoría que tenía el usuario en `fecha`.
 */
export function categoriaEn(historial, fecha) {
  let actual = historial[0]?.categoria ?? null;
  for (const t of historial) if (t.desde === null || t.desde <= fecha) actual = t.categoria;
  return actual;
}

/** Cambia la categoría para todo el histórico (desde = null) o a partir de una fecha. Devuelve un historial nuevo. */
export function cambiarCategoria(historial, categoria, desde = null) {
  if (desde === null) return [{ desde: null, categoria }];
  const previo = historial.filter((t) => t.desde === null || t.desde < desde);
  const nuevo = [...previo, { desde, categoria }];
  // Quita tramos que no cambian nada (misma categoría que el anterior).
  return nuevo.filter((t, i) => i === 0 || t.categoria !== nuevo[i - 1].categoria);
}

// ---- Registros y periodos ----

/** Un día registrado: { fecha, medias (horas x 2), festivo (marcado a mano) }. El domingo siempre es festivo. */
export function esFestivo(registro) {
  return registro.festivo || diaSemana(registro.fecha) === 0;
}

/**
 * Periodo de nómina que contiene `fecha`: termina en el primer cierre >= fecha (el día de cierre pertenece
 * al periodo que cierra) y empieza el día siguiente al cierre anterior. inicio/fin null = sin límite.
 */
export function periodoDe(fecha, cierres) {
  const ord = [...cierres].sort();
  const fin = ord.find((c) => c >= fecha) ?? null;
  const anterior = ord.filter((c) => c < fecha).at(-1);
  return { inicio: anterior ? sumarDias(anterior, 1) : null, fin };
}

export function periodoAnual(anio) {
  return { inicio: `${anio}-01-01`, fin: `${anio}-12-31` };
}

export function contiene(periodo, fecha) {
  return (periodo.inicio === null || fecha >= periodo.inicio) && (periodo.fin === null || fecha <= periodo.fin);
}

/**
 * Desglose de un periodo. Cada día se valora con la categoría que tenía el usuario ese día y con la tabla y la
 * jornada anual del año en que se trabajó. En los años pendientes de revisión salarial, `subidaEstimada` es lo que
 * aporta la subida pactada frente a la tabla del año anterior. La tarifa va redondeada a céntimos; los importes no.
 */
export function desglose(registros, periodo, historial) {
  const lineas = [];
  const t = {
    horasLaborables: 0, horasFestivas: 0, importeLaborable: 0, importeFestivo: 0,
    horasPendientes: 0, subidaEstimada: 0, aniosPendientes: [], categorias: [],
  };
  for (const r of [...registros].sort((a, b) => (a.fecha < b.fecha ? -1 : 1))) {
    if (r.medias <= 0 || !contiene(periodo, r.fecha)) continue;
    const idCat = categoriaEn(historial, r.fecha);
    const anio = anioDe(r.fecha);
    const tabla = tablaPara(idCat, anio);
    if (!tabla) continue;
    const festivo = esFestivo(r);
    const horas = r.medias / 2;
    const tarifa = valorHora(tabla, anio, festivo);
    const importe = horas * tarifa;
    const pendiente = tabla.estado === 'pendiente';
    if (festivo) { t.horasFestivas += horas; t.importeFestivo += importe; }
    else { t.horasLaborables += horas; t.importeLaborable += importe; }
    if (pendiente) {
      t.horasPendientes += horas;
      t.subidaEstimada += importe - horas * valorHora(tabla, anio, festivo, tabla.totalAnterior);
      if (!t.aniosPendientes.some((p) => p.anio === tabla.anio)) t.aniosPendientes.push({ anio: tabla.anio, incremento: tabla.incremento });
    }
    if (!t.categorias.includes(idCat)) t.categorias.push(idCat);
    lineas.push({ fecha: r.fecha, festivo, horas, tarifa, importe, pendiente, categoria: idCat });
  }
  t.horasTotales = t.horasLaborables + t.horasFestivas;
  t.importeTotal = t.importeLaborable + t.importeFestivo;
  return { lineas, totales: t };
}

/** Años con horas registradas, del más reciente al más antiguo. */
export function aniosConHoras(registros) {
  return [...new Set(registros.filter((r) => r.medias > 0).map((r) => anioDe(r.fecha)))].sort((a, b) => b - a);
}
