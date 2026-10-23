import * as D from './dominio.js';
import * as A from './almacen.js';
import { TITULO_AVISO, AVISO, MANUAL, CAMBIOS, LICENCIA } from './textos.js';
import { fmtEuros, fmtTarifa, fmtHoras, fmtLarga, fmtCorta, fmtNum, tituloPeriodo, rangoPeriodo } from './formato.js';

const { NOMBRE, VERSION, URL_SUGERENCIAS, URL_CODIGO } = self.CONFIG;

let datos = A.cargar();
const ui = { pestana: 'registro', fecha: D.hoyLocal() };
let eventoInstalar = null;

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const historial = () => datos.ajustes.categorias;
const pct = (n) => String(Math.round(n * 100) / 100).replace('.', ',') + ' %';

function persistir() {
  if (!A.guardar(datos)) aviso('No se han podido guardar los cambios en este dispositivo. Exporta una copia por si acaso.');
}

function aviso(texto) {
  const t = $('#toast');
  t.textContent = texto;
  t.hidden = false;
  clearTimeout(aviso.temp);
  aviso.temp = setTimeout(() => (t.hidden = true), 4000);
}

// ---------- Tema ----------

const mediaOscuro = matchMedia('(prefers-color-scheme: dark)');
function aplicarTema() {
  document.documentElement.dataset.tema = datos.tema;
  const oscuro = datos.tema === 'oscuro' || (datos.tema === 'auto' && mediaOscuro.matches);
  $('meta[name="theme-color"]').content = oscuro ? '#58595B' : '#f2f4ee';
}
mediaOscuro.addEventListener?.('change', aplicarTema);

// ---------- Diálogos ----------

/**
 * Muestra un diálogo modal. botones: [{ texto, valor, principal }]; valor puede ser una función que recibe el
 * diálogo (para leer campos) y devuelve el resultado. Resuelve con el valor del botón pulsado, o null si se cancela.
 */
function dialogo({ titulo, html, botones, cerrable = true }) {
  return new Promise((ok) => {
    const dlg = document.createElement('dialog');
    dlg.innerHTML = `<h2>${esc(titulo)}</h2><div class="dlg-cuerpo">${html}</div><div class="dlg-botones"></div>`;
    const zona = $('.dlg-botones', dlg);
    for (const b of botones) {
      const btn = document.createElement('button');
      btn.className = b.principal ? 'boton principal' : 'boton';
      btn.textContent = b.texto;
      btn.onclick = () => {
        const valor = typeof b.valor === 'function' ? b.valor(dlg) : b.valor;
        if (valor === undefined) return; // el botón no acepta todavía (falta un dato)
        dlg.close();
        ok(valor);
      };
      zona.append(btn);
    }
    dlg.addEventListener('cancel', (e) => { if (!cerrable) e.preventDefault(); else ok(null); });
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
    $('.boton.principal', dlg)?.focus();
  });
}

/** Notas de una versión, agrupadas por sección. */
function htmlParche([, , secciones]) {
  return secciones.map(([t, cs]) => `<p class="seccion-parche">${esc(t)}</p><ul>${cs.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`).join('');
}

async function mostrarAvisoLegal() {
  const anterior = A.versionAvisoAnterior();
  const novedades = anterior && anterior !== VERSION ? CAMBIOS.find(([v]) => v === VERSION) : null;
  let html = AVISO.map((p) => `<p>${p}</p>`).join('');
  if (novedades) {
    html = `<p class="etiqueta">Versión ${esc(VERSION)}</p>${htmlParche(novedades)}<hr><h3>${esc(TITULO_AVISO)}</h3>` + html;
  }
  await dialogo({
    titulo: novedades ? 'App actualizada' : TITULO_AVISO,
    html,
    botones: [{ texto: 'He leído y acepto', valor: true, principal: true }],
    cerrable: false,
  });
  A.aceptarAviso(VERSION);
}

// ---------- Archivos ----------

async function entregarArchivo(blob, nombre) {
  const archivo = new File([blob], nombre, { type: blob.type });
  // En iPhone, compartir es la forma fiable de guardar un archivo desde una app instalada.
  if (esIOS && navigator.canShare?.({ files: [archivo] })) {
    try { await navigator.share({ files: [archivo] }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function descargarPDF(periodo, tipo = 'nomina') {
  aviso('Generando PDF…');
  try {
    const { generarPDF } = await import('./pdf.js');
    const { blob, nombre } = await generarPDF({
      tipo, registros: A.registros(datos), periodo, historial: historial(), cierres: datos.cierres, version: VERSION, hoy: D.hoyLocal(),
    });
    $('#toast').hidden = true;
    await entregarArchivo(blob, nombre);
  } catch (e) {
    console.error(e);
    aviso('No se pudo generar el PDF: ' + e.message);
  }
}

async function exportarCopia() {
  const hoy = D.hoyLocal();
  datos.ultimaCopia = hoy;
  persistir();
  const blob = new Blob([JSON.stringify({ app: NOMBRE, version: VERSION, ...datos }, null, 1)], { type: 'application/json' });
  await entregarArchivo(blob, `registrador-horas-extra-copia-${hoy}.json`);
  render();
}

async function importarCopia(archivo) {
  let nuevos;
  try {
    nuevos = A.validar(JSON.parse(await archivo.text()));
  } catch (e) {
    await dialogo({ titulo: 'No se pudo importar', html: `<p>${esc(e instanceof SyntaxError ? 'El archivo está dañado o no es una copia de la app.' : e.message)}</p>`, botones: [{ texto: 'Aceptar', principal: true }] });
    return;
  }
  const n = Object.keys(nuevos.dias).length;
  const ok = await dialogo({
    titulo: '¿Sustituir los datos?',
    html: `<p>La copia tiene ${n} ${n === 1 ? 'día' : 'días'} con horas y ${nuevos.cierres.length} cierres de nómina. Sustituirá todo lo que hay ahora en este dispositivo.</p>`,
    botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Sustituir', valor: true, principal: true }],
  });
  if (!ok) return;
  datos = nuevos;
  persistir();
  aplicarTema();
  aviso('Copia importada.');
  render();
}

// ---------- Acciones ----------

function cambiarDia(fecha, medias, festivo) {
  if (medias <= 0 && !festivo) delete datos.dias[fecha];
  else datos.dias[fecha] = { medias: Math.max(0, Math.min(48, medias)), festivo };
  persistir();
  render();
}

async function anadirCierre(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return aviso('Elige una fecha de cierre.');
  if (datos.cierres.includes(fecha)) return aviso('Esa fecha de cierre ya existe.');
  datos.cierres = [...datos.cierres, fecha].sort();
  persistir();
  render();
  const periodo = D.periodoDe(fecha, datos.cierres);
  const diciembre = fecha.slice(5, 7) === '12';
  const anio = D.anioDe(fecha);
  const r = await dialogo({
    titulo: tituloPeriodo(periodo) + ' cerrada',
    html: `<p>${esc(rangoPeriodo(periodo))}.</p><p>¿Quieres descargar el desglose en PDF? También podrás hacerlo después desde Nóminas.</p>` +
      (diciembre ? `<p>Como es la nómina de diciembre, también puedes descargar el resumen anual de ${anio}.</p>` : ''),
    botones: [
      { texto: 'Ahora no', valor: false },
      ...(diciembre ? [{ texto: `Resumen ${anio}`, valor: 'anual' }] : []),
      { texto: 'Desglose PDF', valor: 'nomina', principal: true },
    ],
  });
  if (r === 'nomina') descargarPDF(periodo);
  else if (r === 'anual') descargarPDF(D.periodoAnual(anio), 'anual');
}

async function borrarCierre(fecha) {
  const ok = await dialogo({
    titulo: '¿Borrar este cierre?',
    html: `<p>Se borra el cierre del ${esc(fmtNum(fecha))}. Las horas no se borran, solo pasan a otro periodo.</p>`,
    botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Borrar', valor: true, principal: true }],
  });
  if (!ok) return;
  datos.cierres = datos.cierres.filter((c) => c !== fecha);
  persistir();
  render();
}

/** Pregunta si la nueva categoría vale para todo el histórico o desde una fecha. */
async function cambiarCategoria(nueva) {
  const cat = D.categoria(nueva);
  const r = await dialogo({
    titulo: 'Cambiar categoría',
    html: `<p>Nueva categoría: <b>Grupo ${esc(cat.grupo)}</b> (${esc(cat.descripcion)}).</p>
      <p>¿A qué horas se aplica?</p>
      <div class="opciones">
        <label><input type="radio" name="alcance" value="todo"><span><b>A todo el histórico</b><br><span class="nota">Recalcula todas las horas guardadas, también las de nóminas cerradas. Úsalo si te equivocaste al elegirla.</span></span></label>
        <label><input type="radio" name="alcance" value="fecha" checked><span><b>A partir de una fecha</b><br><span class="nota">Los días anteriores mantienen la categoría que tenías. Úsalo para un ascenso o cambio de puesto.</span></span></label>
      </div>
      <label class="campo-fecha">Desde el día (incluido)<input type="date" name="desde" value="${D.hoyLocal()}"></label>`,
    botones: [
      { texto: 'Cancelar', valor: null },
      {
        texto: 'Aplicar', principal: true,
        valor: (dlg) => {
          const alcance = $('input[name=alcance]:checked', dlg).value;
          const desde = $('input[name=desde]', dlg).value;
          if (alcance === 'fecha' && !desde) { aviso('Elige la fecha desde la que se aplica.'); return undefined; }
          return { desde: alcance === 'todo' ? null : desde };
        },
      },
    ],
  });
  if (r) {
    datos.ajustes.categorias = D.cambiarCategoria(historial(), nueva, r.desde);
    persistir();
    aviso(r.desde ? `Categoría cambiada desde el ${fmtNum(r.desde)}.` : 'Categoría cambiada para todo el histórico.');
  }
  render();
}

async function borrarTramo(desde) {
  const ok = await dialogo({
    titulo: '¿Quitar este cambio de categoría?',
    html: `<p>Las horas desde el ${esc(fmtNum(desde))} se calcularán con la categoría anterior.</p>`,
    botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Quitar', valor: true, principal: true }],
  });
  if (!ok) return;
  const h = historial().filter((t) => t.desde !== desde);
  datos.ajustes.categorias = h.filter((t, i) => i === 0 || t.categoria !== h[i - 1].categoria);
  persistir();
  render();
}

async function instalar() {
  if (!eventoInstalar) return;
  eventoInstalar.prompt();
  await eventoInstalar.userChoice.catch(() => null);
  eventoInstalar = null;
  render();
}

// ---------- Vistas ----------

function opcionesCategoria(sel) {
  return D.categorias()
    .map((c) => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>Grupo ${esc(c.grupo)}: ${esc(c.descripcion)}</option>`).join('');
}

/** Aviso de año pendiente de revisión salarial para un día concreto. */
function notaPendiente(tabla, festivo) {
  if (tabla.estado !== 'pendiente') return '';
  if (tabla.incremento === 0) {
    return `<p class="nota aviso">${tabla.anio}: fuera de la vigencia del convenio 2026-2029. Se usa la última tabla estimada, pendiente de un nuevo convenio.</p>`;
  }
  const dif = D.valorHora(tabla, tabla.anio, festivo) - D.valorHora(tabla, tabla.anio, festivo, tabla.totalAnterior);
  return `<p class="nota aviso">${tabla.anio}: pendiente de revisión salarial hasta la publicación de las tablas en el BOP. ` +
    `Subida estimada: +${pct(tabla.incremento)} (+${fmtTarifa(dif)}).</p>`;
}

function vistaBienvenida() {
  return `
  <section class="tarjeta">
    <h2>Bienvenido</h2>
    <p>Elige tu categoría profesional. Los cálculos usan las tablas del Convenio del Metal de la <b>provincia de ${esc(D.NOMBRE_PROVINCIA)}</b>.</p>
    <p class="nota">Podrás cambiar la categoría en Ajustes sin perder las horas registradas.</p>
    <form id="form-inicio" class="campos">
      <label>Categoría profesional<select name="categoria" required><option value="" disabled selected>Elige…</option>${opcionesCategoria()}</select></label>
      <button class="boton principal ancho" type="submit">Empezar</button>
    </form>
  </section>`;
}

function resumenHTML(totales) {
  let pend = '';
  if (totales.horasPendientes > 0) {
    const anios = totales.aniosPendientes.map((p) => `${p.anio} (+${pct(p.incremento)})`).join(', ');
    pend = `<p class="nota aviso">Incluye ${fmtHoras(totales.horasPendientes)} pendientes de revisión salarial: ${anios}. ` +
      `La subida estimada supone ${fmtEuros(totales.subidaEstimada)} de este total.</p>`;
  }
  return `
    <dl>
      <dt>Laborables</dt><dd>${fmtHoras(totales.horasLaborables)}</dd><dd>${fmtEuros(totales.importeLaborable)}</dd>
      <dt>Festivos</dt><dd>${fmtHoras(totales.horasFestivas)}</dd><dd>${fmtEuros(totales.importeFestivo)}</dd>
      <dt class="total">Total bruto</dt><dd class="total">${fmtHoras(totales.horasTotales)}</dd><dd class="total">${fmtEuros(totales.importeTotal)}</dd>
    </dl>${pend}`;
}

function vistaRegistro() {
  const { fecha } = ui;
  const hoy = D.hoyLocal();
  const reg = datos.dias[fecha] ?? { medias: 0, festivo: false };
  const domingo = D.diaSemana(fecha) === 0;
  const idCat = D.categoriaEn(historial(), fecha);
  const cat = D.categoria(idCat);
  const tabla = D.tablaPara(idCat, D.anioDe(fecha));
  const periodo = D.periodoDe(fecha, datos.cierres);
  const { lineas, totales } = D.desglose(A.registros(datos), periodo, historial());

  return `
  <section class="tarjeta">
    <div class="fila-fecha">
      <button class="icono" data-accion="dia-anterior" aria-label="Día anterior">‹</button>
      <input type="date" id="fecha" value="${fecha}" aria-label="Fecha" required>
      <button class="icono" data-accion="dia-siguiente" aria-label="Día siguiente">›</button>
    </div>
    <p class="fecha-larga">${esc(fmtLarga(fecha))}${fecha === hoy ? ' · hoy' : ` · <button class="enlace" data-accion="hoy">ir a hoy</button>`}</p>
    <div class="contador">
      <button class="boton tonal" data-accion="menos" ${reg.medias <= 0 ? 'disabled' : ''}>− ½ h</button>
      <output>${fmtHoras(reg.medias / 2)}</output>
      <button class="boton tonal" data-accion="mas" ${reg.medias >= 48 ? 'disabled' : ''}>+ ½ h</button>
    </div>
    <label class="interruptor">
      <input type="checkbox" id="festivo" ${reg.festivo || domingo ? 'checked' : ''} ${domingo ? 'disabled' : ''}>
      <span>${domingo ? 'Domingo: cuenta siempre como festivo' : 'Festivo (nacional, autonómico o local)'}</span>
    </label>
    ${tabla ? `<p class="nota">Grupo ${esc(cat.grupo)} · hora extra: ${fmtTarifa(D.valorHora(tabla, D.anioDe(fecha), false))} laborable · ${fmtTarifa(D.valorHora(tabla, D.anioDe(fecha), true))} festivo</p>` : ''}
    ${tabla ? notaPendiente(tabla, reg.festivo || domingo) : ''}
  </section>

  <section class="tarjeta resumen">
    <h2>${esc(tituloPeriodo(periodo))}</h2>
    <p class="nota">${esc(rangoPeriodo(periodo))}</p>
    ${resumenHTML(totales)}
    ${periodo.fin
      ? `<button class="boton ancho" data-accion="pdf" data-fin="${periodo.fin}">Descargar desglose PDF</button>`
      : '<button class="boton ancho" data-accion="ir-nominas">Cerrar nómina…</button>'}
  </section>

  ${lineas.length ? `
  <section class="tarjeta">
    <h2>Días del periodo</h2>
    <ul class="lista">
      ${lineas.map((l) => `
      <li><button class="fila${l.fecha === fecha ? ' actual' : ''}" data-accion="ir-dia" data-fecha="${l.fecha}">
        <span>${esc(fmtCorta(l.fecha))}</span><span class="nota">${l.festivo ? 'festivo' : 'laborable'}${l.pendiente ? ' · pendiente' : ''}</span>
        <span>${fmtHoras(l.horas)}</span><span class="importe">${fmtEuros(l.importe)}</span>
      </button></li>`).join('')}
    </ul>
  </section>` : ''}`;
}

function vistaNominas() {
  const regs = A.registros(datos);
  const resumenDe = (p) => D.desglose(regs, p, historial()).totales;
  const ultimo = datos.cierres.at(-1);
  const abierto = { inicio: ultimo ? D.sumarDias(ultimo, 1) : null, fin: null };
  const tAbierto = resumenDe(abierto);
  const hoy = D.hoyLocal();
  const anios = D.aniosConHoras(regs);

  return `
  <section class="tarjeta">
    <h2>Cerrar nómina</h2>
    <p class="nota">Indica el último día que entra en la nómina. El periodo siguiente empieza al día siguiente.</p>
    <form id="form-cierre" class="fila-form">
      <input type="date" name="fecha" value="${hoy}" aria-label="Fecha de cierre" required>
      <button class="boton principal" type="submit">Cerrar</button>
    </form>
    <p class="nota">Periodo abierto (${esc(rangoPeriodo(abierto).toLowerCase())}): ${fmtHoras(tAbierto.horasTotales)} · ${fmtEuros(tAbierto.importeTotal)}</p>
  </section>

  <section class="tarjeta">
    <h2>Nóminas cerradas</h2>
    ${datos.cierres.length === 0 ? '<p class="nota">Todavía no has cerrado ninguna nómina.</p>' : `
    <ul class="lista">
      ${[...datos.cierres].reverse().map((c) => {
        const p = D.periodoDe(c, datos.cierres);
        const t = resumenDe(p);
        return `
      <li class="nomina">
        <div><b>${esc(tituloPeriodo(p))}</b><span class="nota">${esc(rangoPeriodo(p))}</span>
          <span>${fmtHoras(t.horasTotales)} · <b>${fmtEuros(t.importeTotal)}</b>${t.horasPendientes ? ' <span class="aviso">(pendiente de revisión)</span>' : ''}</span></div>
        <div class="acciones">
          <button class="boton" data-accion="pdf" data-fin="${c}">PDF</button>
          <button class="icono" data-accion="borrar-cierre" data-fecha="${c}" aria-label="Borrar cierre del ${esc(fmtNum(c))}">🗑</button>
        </div>
      </li>`;
      }).join('')}
    </ul>`}
  </section>

  <section class="tarjeta">
    <h2>Resumen anual</h2>
    <p class="nota">Todas las horas trabajadas en el año natural, día a día, con el total de cada nómina.</p>
    ${anios.length === 0 ? '<p class="nota">Aún no hay horas registradas.</p>' : `
    <ul class="lista">
      ${anios.map((a) => {
        const p = D.periodoAnual(a);
        const t = resumenDe(p);
        return `
      <li class="nomina">
        <div><b>${a}${hoy < p.fin ? ' <span class="nota">(en curso)</span>' : ''}</b>
          <span>${fmtHoras(t.horasTotales)} · <b>${fmtEuros(t.importeTotal)}</b>${t.horasPendientes ? ' <span class="aviso">(pendiente de revisión)</span>' : ''}</span></div>
        <div class="acciones"><button class="boton" data-accion="pdf-anual" data-anio="${a}">PDF</button></div>
      </li>`;
      }).join('')}
    </ul>`}
  </section>`;
}

function vistaAjustes() {
  const h = historial();
  const actual = D.categoriaEn(h, '9999-12-31');
  const opTema = (v, t) => `<label><input type="radio" name="tema" value="${v}" ${datos.tema === v ? 'checked' : ''}><span>${t}</span></label>`;
  const tramos = h.length > 1 ? `
      <p class="etiqueta">Historial de categoría</p>
      <ul class="lista">
        ${h.map((t, i) => {
          const c = D.categoria(t.categoria);
          const hasta = h[i + 1] ? ` hasta el ${fmtNum(D.sumarDias(h[i + 1].desde, -1))}` : ' en adelante';
          return `<li class="tramo"><span>Grupo ${esc(c?.grupo ?? t.categoria)} <span class="nota">${t.desde ? `desde el ${esc(fmtNum(t.desde))}` : 'desde el principio'}${hasta}</span></span>
            ${t.desde ? `<button class="icono" data-accion="borrar-tramo" data-desde="${t.desde}" aria-label="Quitar cambio del ${esc(fmtNum(t.desde))}">🗑</button>` : ''}</li>`;
        }).join('')}
      </ul>` : '';
  return `
  <section class="tarjeta">
    <h2>Mis datos</h2>
    <div class="campos">
      <p class="nota">Convenio del Metal de la <b>provincia de ${esc(D.NOMBRE_PROVINCIA)}</b>.</p>
      <label>Categoría profesional<select id="aj-categoria">${opcionesCategoria(actual)}</select></label>
      ${tramos}
    </div>
  </section>

  <section class="tarjeta">
    <h2>Apariencia</h2>
    <div class="segmentado" role="radiogroup" aria-label="Tema">
      ${opTema('auto', 'Automático')}${opTema('claro', 'Claro')}${opTema('oscuro', 'Oscuro')}
    </div>
  </section>

  <section class="tarjeta">
    <h2>Copia de seguridad</h2>
    <p class="nota">Tus datos están solo en este dispositivo. ${datos.ultimaCopia ? `Última copia exportada: ${esc(fmtNum(datos.ultimaCopia))}.` : 'Aún no has exportado ninguna copia.'}</p>
    <div class="fila-botones">
      <button class="boton principal" data-accion="exportar">Exportar copia</button>
      <button class="boton" data-accion="importar">Importar copia</button>
      <input type="file" id="archivo-copia" accept=".json,application/json" hidden>
    </div>
  </section>

  ${eventoInstalar ? `
  <section class="tarjeta">
    <h2>Instalar</h2>
    <p class="nota">Añade la app a tu pantalla de inicio para abrirla como una app más y usarla sin conexión.</p>
    <button class="boton principal" data-accion="instalar">Instalar app</button>
  </section>` : ''}

  <section class="tarjeta desplegables">
    <details><summary>Manual de uso</summary>
      ${MANUAL.map(([t, ps]) => `<h3>${esc(t)}</h3>${ps.map((p) => `<p>${p}</p>`).join('')}`).join('')}
    </details>
    <details><summary>Registro de cambios</summary>
      ${CAMBIOS.map((c) => `<h3>Versión ${esc(c[0])} <span class="nota">· ${esc(fmtNum(c[1]))}</span></h3>${htmlParche(c)}`).join('')}
    </details>
    <details><summary>${esc(TITULO_AVISO)}</summary>
      ${AVISO.map((p) => `<p>${p}</p>`).join('')}
    </details>
    <details><summary>Licencia MIT</summary>
      <div class="licencia" lang="en">${LICENCIA.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    </details>
  </section>

  <section class="tarjeta">
    ${URL_SUGERENCIAS ? `<p>¿Ideas o errores? <a href="${esc(URL_SUGERENCIAS)}" target="_blank" rel="noopener">Cuéntanoslo en GitHub</a></p>` : ''}
    <p class="nota">${esc(NOMBRE)} · versión ${esc(VERSION)} · Software libre con licencia MIT${URL_CODIGO ? ` · <a href="${esc(URL_CODIGO)}" target="_blank" rel="noopener">código fuente</a>` : ''}</p>
  </section>`;
}

function render() {
  const main = $('main');
  const nav = $('nav');
  if (!datos.ajustes) {
    nav.hidden = true;
    main.innerHTML = vistaBienvenida();
    return;
  }
  nav.hidden = false;
  for (const b of nav.querySelectorAll('button')) b.setAttribute('aria-current', b.dataset.pestana === ui.pestana ? 'page' : 'false');
  main.innerHTML = { registro: vistaRegistro, nominas: vistaNominas, ajustes: vistaAjustes }[ui.pestana]();
}

// ---------- Eventos (delegados) ----------

document.addEventListener('click', (e) => {
  const pest = e.target.closest('nav button');
  if (pest) { ui.pestana = pest.dataset.pestana; render(); scrollTo(0, 0); return; }
  const b = e.target.closest('[data-accion]');
  if (!b) return;
  const reg = datos.dias[ui.fecha] ?? { medias: 0, festivo: false };
  switch (b.dataset.accion) {
    case 'dia-anterior': ui.fecha = D.sumarDias(ui.fecha, -1); render(); break;
    case 'dia-siguiente': ui.fecha = D.sumarDias(ui.fecha, 1); render(); break;
    case 'hoy': ui.fecha = D.hoyLocal(); render(); break;
    case 'menos': cambiarDia(ui.fecha, reg.medias - 1, reg.festivo); break;
    case 'mas': cambiarDia(ui.fecha, reg.medias + 1, reg.festivo); break;
    case 'ir-dia': ui.fecha = b.dataset.fecha; render(); scrollTo(0, 0); break;
    case 'ir-nominas': ui.pestana = 'nominas'; render(); scrollTo(0, 0); break;
    case 'pdf': descargarPDF(D.periodoDe(b.dataset.fin, datos.cierres)); break;
    case 'pdf-anual': descargarPDF(D.periodoAnual(+b.dataset.anio), 'anual'); break;
    case 'borrar-cierre': borrarCierre(b.dataset.fecha); break;
    case 'borrar-tramo': borrarTramo(b.dataset.desde); break;
    case 'exportar': exportarCopia(); break;
    case 'importar': $('#archivo-copia').click(); break;
    case 'instalar': instalar(); break;
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.closest('dialog')) return;
  if (t.id === 'fecha' && t.value) { ui.fecha = t.value; render(); }
  else if (t.id === 'festivo') { const r = datos.dias[ui.fecha] ?? { medias: 0 }; cambiarDia(ui.fecha, r.medias, t.checked); }
  else if (t.id === 'aj-categoria') cambiarCategoria(t.value);
  else if (t.name === 'tema') { datos.tema = t.value; persistir(); aplicarTema(); }
  else if (t.id === 'archivo-copia' && t.files[0]) { importarCopia(t.files[0]); t.value = ''; }
});

document.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (e.target.id === 'form-inicio') {
    datos.ajustes = { categorias: [{ desde: null, categoria: f.get('categoria') }] };
    persistir();
    render();
  } else if (e.target.id === 'form-cierre') {
    anadirCierre(f.get('fecha'));
  }
});

// Chrome, Edge, Samsung Internet y otros navegadores Chromium avisan cuando la app se puede instalar.
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalar = e;
  if (ui.pestana === 'ajustes' && datos.ajustes) render();
});
addEventListener('appinstalled', () => { eventoInstalar = null; aviso('App instalada.'); });

// ---------- Arranque ----------

async function iniciar() {
  aplicarTema();
  $('#version').textContent = 'v' + VERSION;
  render();
  if (!A.avisoAceptado(VERSION)) await mostrarAvisoLegal();
  A.pedirPersistencia();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const habiaControlador = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (habiaControlador) location.reload(); });
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker no registrado', e));
  }
  // Precarga el generador de PDF para que el botón responda al momento.
  (self.requestIdleCallback ?? setTimeout)(() => import('./pdf.js').then((m) => m.precargar()).catch(() => {}));
}

iniciar();
