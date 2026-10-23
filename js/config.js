// Datos editables de la app. Es un script clásico (no módulo) porque también lo carga sw.js.
// Al publicar una versión nueva: sube VERSION y actualiza CAMBIOS en js/textos.js.
self.CONFIG = {
  NOMBRE: 'Registrador de horas extra',
  VERSION: '0.3.0',
  // Página de incidencias del repositorio (p. ej. 'https://github.com/USUARIO/REPO/issues').
  // Vacío = no se muestra el enlace de «¿Ideas o errores?» en Ajustes.
  URL_SUGERENCIAS: 'https://github.com/Scraw/horas-extra/issues',
  // Dirección del repositorio en GitHub, si quieres enlazarla en Ajustes. Vacío = no se muestra.
  URL_CODIGO: 'https://github.com/Scraw/horas-extra',
};
