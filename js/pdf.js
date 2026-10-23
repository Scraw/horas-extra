// Desglose en PDF (por nómina o por año), generado en el navegador con jsPDF (vendor/). Se carga al pedir un PDF.
import { NOMBRE_PROVINCIA, categoria, desglose, categoriaEn, periodoDe, sumarDias } from './dominio.js';
import { fmtEuros, fmtTarifa, fmtHoras, fmtNum, fmtDia, tituloPeriodo, rangoPeriodo } from './formato.js';
import { AVISO_PDF } from './textos.js';

let cargando = null;
function cargarScript(src) {
  return new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => mal(new Error('No se pudo cargar ' + src));
    document.head.append(s);
  });
}
function cargarJsPDF() {
  cargando ??= cargarScript('vendor/jspdf.umd.min.js').then(() => cargarScript('vendor/jspdf.plugin.autotable.min.js'));
  return cargando;
}

export const precargar = () => cargarJsPDF();

const nombreCat = (id) => {
  const c = categoria(id);
  return c ? `Grupo ${c.grupo}: ${c.descripcion}` : id;
};

/** Texto de la categoría del periodo; si cambió dentro de él, indica desde cuándo rige cada una. */
function textoCategorias(historial, periodo, idsUsados) {
  if (idsUsados.length <= 1) {
    return nombreCat(idsUsados[0] ?? categoriaEn(historial, periodo.fin ?? periodo.inicio ?? '9999-12-31'));
  }
  return historial
    .filter((t) => idsUsados.includes(t.categoria))
    .map((t) => `${nombreCat(t.categoria)}${t.desde ? ` (desde el ${fmtNum(t.desde)})` : ''}`)
    .join('\n');
}

/**
 * Devuelve { blob, nombre } con el desglose.
 * tipo 'nomina': periodo de una nómina. tipo 'anual': periodo = año natural completo; añade el total de cada nómina.
 */
export async function generarPDF({ tipo = 'nomina', registros, periodo, historial, cierres = [], version, hoy }) {
  await cargarJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { lineas, totales } = desglose(registros, periodo, historial);
  const anual = tipo === 'anual';
  const anio = periodo.inicio?.slice(0, 4);
  const margen = 15;
  const ancho = doc.internal.pageSize.getWidth();
  const verde = [74, 119, 41]; // #4A7729
  const azul = [13, 65, 84]; // #0D4154

  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...azul);
  doc.text(anual ? `Resumen anual de horas extra ${anio}` : 'Desglose de horas extra', margen, 20);
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90);
  doc.text(`Registrador de horas extra · versión ${version}`, margen, 26);
  doc.setTextColor(0);

  const datos = [
    anual ? ['Año', `${anio}${hoy < periodo.fin ? ' (en curso)' : ''}`] : ['Nómina', tituloPeriodo(periodo).replace('Nómina de ', '')],
    ['Periodo', rangoPeriodo(periodo).replace('Del ', 'del ')],
    ['Provincia (convenio)', NOMBRE_PROVINCIA],
    ['Categoría profesional', textoCategorias(historial, periodo, totales.categorias)],
    ['Generado el', fmtNum(hoy)],
  ];
  doc.autoTable({
    startY: 31,
    body: datos,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: { top: 0.8, bottom: 0.8, left: 0, right: 2 } },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    margin: { left: margen, right: margen },
  });

  const variasCat = totales.categorias.length > 1;
  const derecha = { halign: 'right' };
  const cabecera = ['Fecha', 'Día', 'Tipo', ...(variasCat ? ['Grupo'] : []), 'Horas', 'Tarifa', 'Importe'];
  const nCol = cabecera.length;
  const filas = lineas.map((l) => [
    fmtNum(l.fecha),
    fmtDia(l.fecha),
    l.festivo ? 'Festivo' : 'Laborable',
    ...(variasCat ? [categoria(l.categoria)?.grupo ?? l.categoria] : []),
    fmtHoras(l.horas),
    fmtTarifa(l.tarifa) + (l.pendiente ? ' *' : ''),
    fmtEuros(l.importe),
  ]);
  const pie = (txt, h, imp) => [txt, ...Array(nCol - 4).fill(''), h, '', imp];
  const derechaDesde = nCol - 3;

  const tablaConEstilo = (opciones) => doc.autoTable({
    theme: 'striped',
    headStyles: { fillColor: azul },
    footStyles: { fillColor: [234, 245, 214], textColor: 20 },
    styles: { fontSize: 9.5 },
    margin: { left: margen, right: margen, bottom: 34 },
    ...opciones,
  });

  tablaConEstilo({
    startY: doc.lastAutoTable.finalY + 6,
    head: [cabecera],
    body: filas.length ? filas : [[{ content: 'Sin horas extra en este periodo', colSpan: nCol }]],
    foot: [
      pie('Laborables', fmtHoras(totales.horasLaborables), fmtEuros(totales.importeLaborable)),
      pie('Festivos', fmtHoras(totales.horasFestivas), fmtEuros(totales.importeFestivo)),
      pie(anual ? 'Total bruto del año' : 'Total bruto', fmtHoras(totales.horasTotales), fmtEuros(totales.importeTotal)),
    ],
    showFoot: 'lastPage',
    columnStyles: Object.fromEntries([derechaDesde, derechaDesde + 1, derechaDesde + 2].map((i) => [i, derecha])),
    didParseCell: (d) => {
      if (d.section !== 'body' && d.column.index >= derechaDesde) d.cell.styles.halign = 'right';
      if (d.section === 'foot' && d.row.index === 2) d.cell.styles.fontStyle = 'bold';
    },
  });

  if (anual && lineas.length) {
    // Una fila por nómina que tenga días de este año. La primera y la última pueden empezar o acabar en otro año:
    // solo se suman los días del año del resumen.
    const ord = [...cierres].sort();
    const periodos = ord.map((c) => periodoDe(c, ord));
    periodos.push({ inicio: ord.length ? sumarDias(ord.at(-1), 1) : null, fin: null });
    const filasNom = [];
    for (const p of periodos) {
      if ((p.fin !== null && p.fin < periodo.inicio) || (p.inicio !== null && p.inicio > periodo.fin)) continue;
      const recorte = {
        inicio: p.inicio === null || p.inicio < periodo.inicio ? periodo.inicio : p.inicio,
        fin: p.fin === null || p.fin > periodo.fin ? periodo.fin : p.fin,
      };
      const t = desglose(registros, recorte, historial).totales;
      if (t.horasTotales === 0) continue;
      const parcial = (p.inicio === null || p.inicio < periodo.inicio) || (p.fin === null || p.fin > periodo.fin);
      const nombre = p.fin ? tituloPeriodo(p) : 'Periodo abierto (nómina sin cerrar)';
      filasNom.push([
        nombre + (parcial && p.fin ? ` (solo días de ${anio})` : ''),
        `${fmtNum(recorte.inicio)} – ${fmtNum(recorte.fin)}`,
        fmtHoras(t.horasTotales),
        fmtEuros(t.importeTotal),
      ]);
    }
    tablaConEstilo({
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Nómina', 'Días incluidos', 'Horas', 'Importe']],
      body: filasNom,
      foot: [['Total del año', '', fmtHoras(totales.horasTotales), fmtEuros(totales.importeTotal)]],
      columnStyles: { 2: derecha, 3: derecha },
      didParseCell: (d) => { if (d.column.index >= 2) d.cell.styles.halign = 'right'; },
      rowPageBreak: 'avoid',
    });
  }

  let y = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(8.5).setTextColor(70);
  const notas = ['Tarifa = retribución total anual ÷ jornada anual × 1,60 (laborable) o × 1,75 (domingo o festivo).'];
  if (anual) notas.push(`Cada nómina incluye los días desde el siguiente al cierre de la nómina anterior hasta su propio cierre. Si una nómina empieza en ${+anio - 1} o termina en ${+anio + 1}, aquí solo se suman sus días de ${anio}.`);
  if (totales.horasPendientes > 0) {
    const anios = totales.aniosPendientes
      .map((p) => (p.incremento > 0 ? `${p.anio} (+${String(p.incremento).replace('.', ',')} % pactado)` : `${p.anio} (sin subida pactada)`))
      .join(', ');
    notas.push(
      `* Pendiente de revisión salarial hasta la publicación de las tablas en el BOP: ${anios}. ` +
      `Se ha estimado con la subida pactada en el convenio, que supone ${fmtEuros(totales.subidaEstimada)} de las ` +
      `${fmtHoras(totales.horasPendientes)} afectadas.`,
    );
  }
  for (const n of notas) {
    const partes = doc.splitTextToSize(n, ancho - 2 * margen);
    if (y + partes.length * 4 > doc.internal.pageSize.getHeight() - 34) { doc.addPage(); y = 20; }
    doc.text(partes, margen, y);
    y += partes.length * 4 + 1;
  }

  // Pie en todas las páginas: aviso y número de página.
  const paginas = doc.getNumberOfPages();
  const aviso = doc.splitTextToSize(AVISO_PDF, ancho - 2 * margen);
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    const alto = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...verde).setLineWidth(0.4).line(margen, alto - 29, ancho - margen, alto - 29);
    doc.setFontSize(7.5).setTextColor(110);
    doc.text(aviso, margen, alto - 25);
    doc.text(`Página ${i} de ${paginas}`, ancho - margen, alto - 8, { align: 'right' });
  }

  const nombre = anual ? `horas-extra-${anio}-resumen-anual.pdf` : `horas-extra-${periodo.fin ?? hoy}.pdf`;
  return { blob: doc.output('blob'), nombre };
}
