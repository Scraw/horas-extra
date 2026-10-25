# Guía para desarrolladores

Notas técnicas de **Registrador de horas extra**: una app web instalable (PWA) en JavaScript sin compilar,
sin dependencias de servidor y con los datos guardados solo en el navegador del usuario.
La información para usuarios está en el [README](README.md).

## Publicarla en Cloudflare

La app no tiene paso de compilación: se publican los archivos tal cual. `wrangler.jsonc` publica la raíz del
repositorio y `.assetsignore` deja fuera las pruebas, la documentación y los archivos de configuración.

- **Desde el panel de Cloudflare**: Workers y Pages › Crear › Importar un repositorio, elige este repositorio y
  deja vacío el comando de compilación. Cada push a `main` se publica solo.
- **Desde el ordenador**: `npx wrangler deploy`.

No se usa `not_found_handling` porque es una sola página sin rutas: una dirección que no existe debe dar 404.
El service worker precarga `./` y no `index.html`, porque Cloudflare redirige `/index.html` a `/`.

## Probarla en el ordenador

Necesita servirse por HTTP (no vale abrir `index.html` con doble clic):

```
npx serve .
```

y abre `http://localhost:3000`. Para probarla como en Cloudflare: `npx wrangler dev`. Las pruebas del cálculo: `node --test test/*.test.mjs` (Node 20 o posterior).

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
4. Sube los cambios a `main`. Al abrir la app, se actualiza sola y vuelve a mostrar el aviso con las novedades.

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
