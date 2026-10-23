# Registrador de horas extra

App web instalable (PWA) para apuntar las horas extra de cada día y calcular su importe por nómina
según el Convenio del Metal de la provincia de A Coruña 2026-2029. Funciona en Android e iPhone, sin conexión,
y guarda los datos solo en el dispositivo.

> Los importes son orientativos y en bruto. Comprueba siempre lo que te corresponde en tu convenio colectivo.

## Publicarla gratis en GitHub Pages

1. Crea un repositorio en GitHub y sube el contenido de esta carpeta a la raíz de la rama `main`.
2. En el repositorio: **Settings › Pages › Build and deployment › Source: Deploy from a branch**,
   rama `main`, carpeta `/ (root)`, **Save**.
3. Al cabo de un minuto la app estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Ábrela en el móvil e instálala:
   - Android (Chrome): menú ⋮ › Instalar aplicación.
   - iPhone (Safari): Compartir › Añadir a pantalla de inicio.

No hace falta compilar nada: son archivos estáticos. El archivo `.nojekyll` evita que GitHub los procese.

## Probarla en el ordenador

Necesita servirse por HTTP (no vale abrir `index.html` con doble clic):

```
npx serve .
```

y abre `http://localhost:3000`. Las pruebas del cálculo: `node --test test/*.test.mjs` (Node 20 o posterior).

## Dónde tocar cada cosa

| Qué | Dónde |
|---|---|
| Versión, enlace a incidencias (sugerencias) y al código | `js/config.js` |
| Registro de cambios, manual, aviso legal y licencia mostrada | `js/textos.js` |
| Tablas salariales, subidas, IPC real y jornada anual | `js/dominio.js` (`TABLAS_PUBLICADAS`, `INCREMENTOS`, `HORAS_ANUALES`) |
| Fórmula y periodos de nómina | `js/dominio.js` |
| PDF del desglose (nómina y anual) | `js/pdf.js` |
| Colores y modo claro/oscuro | `css/estilos.css` |
| Nombre bajo el icono | `manifest.webmanifest` (`short_name`) e `index.html` (`apple-mobile-web-app-title`) |

### Publicar una versión nueva

1. Sube `VERSION` en `js/config.js`.
2. Actualiza `CAMBIOS` en `js/textos.js`.
3. Si creas archivos nuevos, añádelos a la lista `ARCHIVOS` de `sw.js`.
4. Sube los cambios a GitHub. Al abrir la app, se actualiza sola y vuelve a mostrar el aviso con las novedades.

### Cuando se publique una tabla en el BOP o se conozca el IPC

- **Tabla publicada**: en `js/dominio.js`, añade a `TABLAS_PUBLICADAS` la entrada `'2027-CORUNA'` (o el año que sea)
  con los mismos `id` de categoría. Las horas de ese año dejan de marcarse como pendientes de revisión.
- **IPC real**: rellena `ipcReal` de ese año en `INCREMENTOS`. Si supera la subida pactada, ese año se recalcula
  con el IPC (art. 39) y sirve de base para los siguientes.
- **Lugo y Vigo**: quedan preparados en `LOCALIDADES`; para activarlos hace falta añadir sus tablas y la selección en Ajustes.

## Reglas de cálculo

- Solo se aplica el convenio de la provincia de A Coruña.
- Valor hora extra = retribución total anual ÷ horas anuales × 1,60 (laborable) o × 1,75 (domingo o festivo marcado).
- Horas anuales: 1752 (2026), 1744 (2027 y 2028), 1740 (2029). Cada día usa la tabla y la jornada del año en que se trabajó,
  y la categoría que tenía el usuario ese día (la categoría puede cambiar para todo el histórico o desde una fecha).
- Subidas pactadas (art. 38): 5 % (2026, ya incluida en la tabla 2026), 3 % (2027), 3 % (2028) y 4 % (2029), encadenadas.
  Un año sin tabla publicada se estima con la subida pactada y se marca "pendiente de revisión salarial", mostrando la subida en % y en euros.
- El día de cierre entra en la nómina que cierra; el siguiente periodo empieza al día siguiente.
- Importes en bruto, sin redondear el valor hora; solo se redondea al mostrar.

## Datos y privacidad

Todo se guarda en el almacenamiento local del navegador (`localStorage`). No hay servidor ni se envía nada.
Desde **Ajustes › Copia de seguridad** se exporta e importa un archivo `.json` con todos los datos.

## Licencia

[MIT](LICENSE). Incluye [jsPDF](https://github.com/parallax/jsPDF) y
[jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable), ambas MIT (ver `vendor/LICENCIAS-TERCEROS.txt`).
