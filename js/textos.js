// Textos largos de la app: aviso legal, manual, registro de cambios y licencia. Admiten <b> e <i> sencillos.

export const TITULO_AVISO = 'Aviso Legal y Exención de Responsabilidad';

export const AVISO = [
  '<b>Uso personal:</b> Esta app es una herramienta personal que <b>no vincula a la empresa</b>, no sustituye los canales oficiales de comunicación o reclamación, y sus datos e informes <b>no tienen validez legal</b> frente a ella. Usarla no exime en ningún caso de la <b>obligación de registrar la jornada</b> con los procedimientos y dispositivos oficiales que determine la empresa.',
  '<b>Cálculos orientativos:</b> Los importes son una <b>estimación en bruto</b>, antes de IRPF y cotizaciones a la Seguridad Social. Se basan en las tablas del convenio integradas en la app, que pueden contener errores u omisiones o no estar actualizadas, y no recogen particularidades ni acuerdos personales.',
  '<b>Verificación obligatoria:</b> Comprueba siempre tus importes en el convenio colectivo oficial y en tu nómina. En caso de discrepancia, prevalecen el convenio y la normativa vigente.',
  '<b>Exención de responsabilidad:</b> El desarrollador <b>no se hace responsable</b> en ningún caso de reclamaciones, pérdidas, perjuicios económicos o discrepancias legales derivadas del uso de la app o de errores en sus cálculos. El usuario asume todo el riesgo de su uso.',
  '<b>Sin asesoramiento profesional:</b> Esta app <b>no es asesoramiento jurídico, laboral ni fiscal</b>. Ante cualquier duda, consulta con la representación de los trabajadores, tu sindicato o un profesional.',
  '<b>Privacidad y datos:</b> Tus datos se guardan <b>solo en este dispositivo</b> y no se envían a ningún servidor. Haz copias de seguridad periódicas desde Ajustes para no perderlos.',
];

// Se muestra al final del aviso al abrir la app.
export const NOTA_MANUAL = '📖 Encontrarás el manual de uso en <b>Ajustes › Manual de uso</b>.';

// Resumen del aviso para el pie de los PDF (texto plano).
export const AVISO_PDF =
  'Documento de uso estrictamente personal: no vincula a la empresa ni tiene validez legal frente a ella, y no sustituye el registro oficial de jornada. ' +
  'Importes orientativos en bruto (antes de IRPF y Seguridad Social), calculados con las tablas del convenio integradas en la app, que pueden contener errores u omisiones. ' +
  'Comprueba siempre tus importes en el convenio colectivo oficial y en tu nómina; en caso de discrepancia prevalece el convenio. No constituye asesoramiento jurídico, laboral ni fiscal. El desarrollador no se hace responsable del uso de estos cálculos.';

// Cada sección: [título, párrafos].
export const MANUAL = [
  ['Primeros pasos', [
    'Al abrir la app por primera vez elige tu categoría profesional. Los cálculos usan las tablas del Convenio del Metal de la <b>provincia de A Coruña</b>.',
  ]],
  ['Apuntar horas', [
    'En <b>Registro</b> elige el día con las flechas o tocando la fecha, y usa <b>+ ½ h</b> y <b>− ½ h</b>. Se guarda solo.',
    'Marca <b>Festivo</b> si ese día es festivo nacional, autonómico o local. Los domingos cuentan siempre como festivo.',
  ]],
  ['Cómo se calcula', [
    'Valor de la hora extra = retribución total anual de tu categoría ÷ horas de jornada anual × 1,60 (laborable) o × 1,75 (domingo o festivo).',
    'Cada día se valora con la categoría que tenías ese día y con la tabla y la jornada del año en que se trabajó.',
  ]],
  ['Subidas salariales y revisión', [
    'El convenio pacta subidas del 5 % (2026), 3 % (2027), 3 % (2028) y 4 % (2029) sobre la tabla del año anterior.',
    'Mientras no se publique en el BOP la tabla de un año nuevo, sus horas se marcan como <b>pendientes de revisión salarial</b> y se calculan con la subida pactada. La app muestra el porcentaje aplicado y cuántos euros supone esa subida estimada.',
    'Si el IPC real de un año supera la subida pactada, el convenio prevé una revisión por la diferencia con efectos del 1 de enero y el pago de atrasos en una sola paga en el primer trimestre del año siguiente. La app se actualizará con esos datos cuando se conozcan.',
  ]],
  ['Cambiar de categoría', [
    'En <b>Ajustes</b> elige la nueva categoría. La app te preguntará si el cambio se aplica a <b>todo el histórico</b> (por ejemplo, si te equivocaste al elegirla) o <b>a partir de una fecha</b> (por ejemplo, un ascenso). En el segundo caso, los días anteriores se siguen calculando con la categoría que tenías.',
  ]],
  ['Cerrar una nómina', [
    'En <b>Nóminas</b> añade la fecha de cierre: es el último día que entra en esa nómina. El periodo siguiente empieza al día siguiente.',
    'Al cerrar puedes descargar un PDF con el desglose: horas de cada día, tarifa aplicada e importes. También puedes descargarlo después desde la lista de nóminas.',
  ]],
  ['Resumen anual', [
    'En <b>Nóminas › Resumen anual</b> puedes descargar un PDF con todas las horas trabajadas de un año (del 1 de enero al 31 de diciembre), día a día, con el total del año y el de cada nómina. Al cerrar la nómina de diciembre la app también te lo ofrece.',
    'Como cada nómina va de un cierre al siguiente (por ejemplo, del 14 de diciembre al 13 de enero), la primera y la última nómina del resumen solo suman los días de ese año.',
  ]],
  ['Copias de seguridad', [
    'Los datos viven solo en este móvil y en el navegador con el que instalaste la app. Si la desinstalas, borras los datos del navegador, cambias de navegador o de móvil, se pierden.',
    'En Ajustes, <b>Exportar copia</b> guarda un archivo con todo. <b>Importar copia</b> lo recupera en este u otro dispositivo o navegador (sustituye lo que haya).',
    'En iPhone, instala la app en la pantalla de inicio. Si la usas solo desde el navegador sin instalarla, iOS puede borrar sus datos tras unos días sin abrirla.',
  ]],
  ['Instalar la app', [
    'Registrador de horas extra es una app de tipo <b>PWA</b>.',
    'Si tu navegador lo permite, en <b>Ajustes</b> aparece el botón <b>Instalar app</b>. Si no, según el navegador:',
    '<b>Android</b><br>' +
      '· Chrome: menú ⋮ › <b>Añadir a pantalla de inicio</b> › Instalar.<br>' +
      '· Samsung Internet: menú ☰ › <b>Añadir página a</b> › Pantalla de inicio (o el icono de descarga de la barra de direcciones).<br>' +
      '· Firefox: menú ⋮ › <b>Añadir a pantalla de inicio</b> (o <b>Instalar</b>).<br>' +
      '· Edge: menú … › <b>Añadir al teléfono</b>.<br>' +
      '· Brave: menú ⋮ › <b>Añadir a pantalla de inicio</b> o <b>Instalar app</b>.<br>' +
      '· Opera: menú ⋮ › <b>Añadir a…</b> › Pantalla de inicio.<br>' +
      '· DuckDuckGo: menú ⋮ › <b>Añadir a pantalla de inicio</b>. Crea un acceso directo que se abre dentro de DuckDuckGo, no como app independiente.',
    '<b>iPhone y iPad</b> (iOS 16.4 o posterior)<br>' +
      '· Safari: botón Compartir › <b>Añadir a pantalla de inicio</b>. Es la opción más fiable.<br>' +
      '· Chrome, Edge y Firefox: botón Compartir (en la barra de direcciones o en el menú) › <b>Añadir a pantalla de inicio</b>.<br>' +
      '· Otros navegadores (Brave, DuckDuckGo…): si en su menú Compartir no aparece «Añadir a pantalla de inicio», abre la app en Safari.',
    'Una vez instalada funciona sin conexión. Los nombres de los menús pueden cambiar ligeramente según la versión del navegador.',
  ]],
];

// Notas de cada versión, la más reciente primero: [versión, fecha, [[sección, [cambios]], ...]].
export const CAMBIOS = [
  ['0.3.2', '2026-10-25', [
    ['Cambios', [
      'El aviso inicial muestra el nombre de la app.',
      'El manual indica que es una app de tipo PWA.',
    ]],
  ]],
  ['0.3.1', '2026-10-25', [
    ['Cambios', [
      'Ajuste de textos: aviso legal más breve y con más espacio entre párrafos.',
      'El aviso se abre desde el principio e indica dónde está el manual de uso.',
      'Lista de categorías más legible, con el grupo en negrita.',
    ]],
  ]],
  ['0.3.0', '2026-10-23', [
    ['Novedades', [
      'Subidas salariales del convenio 2026-2029 (5 %, 3 %, 3 % y 4 %). Las horas de un año sin tabla publicada en el BOP se marcan como pendientes de revisión salarial, con la subida estimada en porcentaje y en euros.',
      'Preparada la revisión salarial por IPC del artículo 39.',
      'Al cambiar de categoría puedes aplicarla a todo el histórico o a partir de una fecha. El historial se ve en Ajustes.',
      'Resumen anual en PDF con todas las horas del año y el total de cada nómina.',
      'Botón «Instalar app» en los navegadores que lo permiten e instrucciones de instalación para más navegadores.',
    ]],
    ['Cambios', [
      'El icono se llama ahora «Horas Extra».',
      'Solo se aplica el convenio de la provincia de A Coruña. Se quita la elección de localidad.',
      'Nuevos colores en modo claro y oscuro, y nuevo icono.',
      'Nuevo aviso legal y de exención de responsabilidad.',
      'Manual de uso actualizado.',
    ]],
  ]],
];

// Texto oficial de la licencia (igual que el archivo LICENSE).
export const LICENCIA = [
  'MIT License',
  'Copyright (c) 2026 Los autores de Registrador de horas extra',
  'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
  'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
];
