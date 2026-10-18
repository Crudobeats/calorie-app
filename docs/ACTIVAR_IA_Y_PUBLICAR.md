# Activación posterior y publicación

Nada de esta guía se ejecutó contra tu cuenta. No subas secretos a GitHub. La clave del proveedor es del operador de la app; los usuarios no deben ingresarla.

## 1. Revisar localmente

`npm start` abre una instalación local sin IA. Comprueba el registro manual, planes y restauración de respaldos. La integración real se prueba después con Wrangler y una instalación de revisión, nunca activándola a ciegas para todos los usuarios.

## 2. Arquitectura de publicación

La configuración suministrada es **Cloudflare Workers con Static Assets**, no un sitio de GitHub Pages ni una configuración directa de Cloudflare Pages. Workers sirve `public/` y atiende `/api/*`. Mantener el mismo origen permite validar solicitudes y evita abrir CORS a cualquier dominio.

Si tu app actual usa Pages, hay dos caminos: mantener Pages y colocar un Worker en las rutas `/api/*` del mismo dominio, adaptando los bindings de recursos; o publicar esta versión como un Worker con Static Assets y apuntar el dominio cuando esté validado. El paquete implementa el segundo camino. No cambies tu dominio antes de probar la nueva instalación.

El uso de infraestructura dentro de cuotas gratuitas no vuelve gratuita a la API de reconocimiento. Revisa los costos y cuotas de tu cuenta antes de activarla.

## 3. Crear una instalación de revisión

En la terminal del proyecto, cuando decidas continuar:

```bash
npx wrangler@4 login
npx wrangler@4 dev
```

Wrangler se descarga en ese paso; `npm start`, los checks y los tests no lo requieren. El archivo usa Workers Rate Limiting y un Durable Object SQLite `BudgetGate`. El despliegue crea este recurso según `migrations`; revisa los bindings en tu cuenta.

`namespace_id` del limitador debe ser único dentro de tu cuenta si no quieres compartir contadores con otra app. El valor del ejemplo es `10404`.

## 4. Activar reconocimiento

1. Crea una clave de API en un proyecto separado del proveedor y define un presupuesto/cupo de gasto apropiado en su panel.
2. Crea un widget de Cloudflare Turnstile para los hostnames de prueba y, luego, producción. No uses las claves de prueba en producción.
3. Guarda los secretos con los comandos siguientes; cada uno solicita el valor sin ponerlo en el archivo del proyecto:

```bash
npx wrangler@4 secret put OPENAI_API_KEY
npx wrangler@4 secret put TURNSTILE_SECRET_KEY
```

4. En `wrangler.jsonc`, completa `TURNSTILE_SITE_KEY` (es pública). Mantén el modelo compatible con imágenes y Structured Outputs. Se propone `gpt-5.6-terra` con razonamiento bajo para priorizar calidad de identificación; es configurable y su disponibilidad debe confirmarse con la cuenta al activar.
5. Configura `DAILY_AI_LIMIT`. El valor inicial es **30 solicitudes de inferencia por día UTC para toda la instalación**, no 30 por usuario. Se cuenta una reserva antes del intento de IA; también cuenta un intento fallido. Esto acota invocaciones, no promete una factura exacta: influyen imágenes, texto y modelo.
6. Pon `AI_ENABLED` en `true` solo en la instalación de revisión. Si faltan secretos, Turnstile o bindings de límites, `/api/config` mantiene la IA desactivada.
7. Prueba imágenes reales de platos diferentes antes de publicar: papas fritas frente a salmón, papas al horno frente a fritas, platos mixtos, ausencia de comida y mala iluminación.

Turnstile se verifica en el servidor con hostname y acción `food-analysis`; cada token caduca y se usa una vez. Hay un límite adicional de 3 intentos por minuto por dirección IP en el borde. El contador diario global usa una transacción serializada; no depende solo de ese límite del borde.

La API usa Responses con `store:false`, esquema JSON estricto, IDs validados y tamaño/tiempo limitados. `store:false` no significa que el proveedor no tenga otras políticas de retención: revisa sus condiciones aplicables. No se envían edad, peso, plan ni historial. No se registran fotos o claves en logs de la aplicación.

## 5. Publicar, después de validar

```bash
npm run check
npm test
npx wrangler@4 deploy
```

Esto sí publica y crea/actualiza recursos de tu cuenta. No se ejecutó en esta entrega. Para despliegue desde GitHub, importa el repositorio en Workers Builds y usa el comando de despliegue de Wrangler, sin incluir `.dev.vars`, `.env` o claves. Primero usa una rama/proyecto de revisión.

Mantén el catálogo KV opcional separado del código. Para actualizarlo consulta `CATALOGO.md`.

## 6. Usuarios de la PWA V1

El service worker V1 podía servir el HTML antiguo desde caché. Tras reemplazarlo, puede ser necesario cerrar todas las pestañas de la app una vez para que el nuevo worker tome control. No borres el almacenamiento antes de exportar/importar los registros. Esta versión elimina solo sus cachés y las identificadas exactamente como `calorie-v<número>`, no las de otras aplicaciones.

Los datos locales solo se pueden recuperar automáticamente si el dominio/origen coincide. Si cambia, conserva una copia exportada desde el origen anterior. Las comidas del analizador aleatorio V1 se importan como no validadas, no como detecciones correctas.

## Fuentes oficiales consultadas

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.openai.com/api/docs/models/gpt-5.6-terra
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

Consulta: 18 de octubre de 2026 UTC. La elección del modelo y los límites deben revisarse al activar la cuenta real.
