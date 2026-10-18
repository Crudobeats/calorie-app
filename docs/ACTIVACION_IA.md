# Activación del reconocimiento — 4.3

## Causa y alcance

El frontend 4.2 deshabilitaba el botón según `aiEnabled`. La entrega traía `AI_ENABLED:false` y el servidor local también lo desactiva de forma intencionada. La publicación sugerida en Pages con salida `public` solo servía la interfaz: no ejecutaba `server/worker.js`. Tomar una foto no podía activar un servicio inexistente.

La 4.2.1 permite pulsar «Identificar comida y estimar porción» al preparar una foto, muestra el estado del servicio y explica qué falta. Solicita consentimiento y verificación antes de enviar imágenes. Incluye reintento de conexión/verificación, tiempo máximo de carga de Turnstile, errores persistentes y recuperación de la acción tras fallos. Distingue respuestas HTML de la API JSON esperada. Si no se estima la cantidad, queda vacía para que la persona la ingrese; no se asignan 100 g por defecto. No se guarda nada hasta confirmar.

La conexión Pages → Worker usa una Service Binding, sin exponer una clave en el navegador y conservando URL, origen e IP de la solicitud. Las claves del proveedor son del operador del sitio; no se solicitan a cada usuario. El plan gratuito del alojamiento no incluye automáticamente consumo gratuito de OpenAI. Si la etapa de clave API sigue pendiente, la identificación real también queda pendiente: habilitar un botón no reemplaza esa configuración.

## 1. Actualizar código en el repositorio correcto

Copia el contenido de `calorieapp-v4.3` dentro de la carpeta del repositorio donde existe `package.json`, conservando su `.git`. Incluye **functions/**, situada en la raíz del repositorio y no dentro de public. Ejecuta:

```bash
npm run check
npm test
```

En la rama `revision/v4.2`:

```bash
git add .
git commit -m "Corrige reconocimiento IA y conecta Pages con Worker"
git push origin revision/v4.2
```

Si Pages está enlazado a esa rama, iniciará otra publicación. Conserva su salida `public`, directorio raíz vacío y Node 24. Pages debe detectar `functions/api/[[path]].js`. No publiques únicamente la carpeta public mediante carga manual, ya que se perdería la Function.

## 2. Publicar el servidor de reconocimiento

Desde el mismo repositorio:

```bash
npx wrangler@4 login
npx wrangler@4 deploy
```

Usa el Worker **calorieapp-web**, declarado en `wrangler.jsonc`. Este despliegue crea o actualiza ese Worker, su limitador y el Durable Object de cupo. Inicialmente permanece desactivado. Si ya tienes un Worker con ese nombre para otra aplicación, cambia el nombre de esta instalación antes de desplegar y selecciona el nuevo nombre en el binding de Pages.

Crea un widget **Turnstile** con el hostname exacto que abrirás (ejemplo: el dominio real del proyecto Pages). Añade también los dominios de revisión concretos que vayas a probar. Copia su site key pública al campo `TURNSTILE_SITE_KEY` de `wrangler.jsonc` y cambia `AI_ENABLED` a `true`. No uses claves de prueba para el despliegue público.

Introduce los secretos desde la terminal; no los pegues en el chat ni los subas a GitHub:

```bash
npx wrangler@4 secret put OPENAI_API_KEY
npx wrangler@4 secret put TURNSTILE_SECRET_KEY
npx wrangler@4 deploy
```

`OPENAI_API_KEY` necesita acceso al modelo configurado y consumo habilitado en el proyecto del proveedor. Se conserva `gpt-5.6-terra`, configurable. Las imágenes pueden generar cargos. El cupo inicial limita 30 intentos diarios globales (UTC), incluidos los intentos de inferencia fallidos, y 3 intentos por minuto por IP; el cupo no es un importe monetario exacto.

## 3. Conectar Pages con el Worker

En Cloudflare, abre tu proyecto **Pages** → Settings → Bindings → Add → **Service binding**:

| Campo | Valor |
| --- | --- |
| Variable name | `AI_BACKEND` |
| Service | `calorieapp-web` o el nombre que hayas configurado |
| Entorno | El Worker desplegado correspondiente |

Configura el binding para Production del proyecto Pages que usa `revision/v4.2`. Si accedes por un deployment Preview, configúralo también para Preview. Guarda y vuelve a desplegar Pages para aplicar el binding. La Function incluida llama `env.AI_BACKEND.fetch(request)`. No agregues las claves del proveedor al frontend ni al proyecto Pages: permanecen en el Worker.

Esta vía conserva el dominio Pages y los registros locales asociados. La alternativa es usar directamente la URL del Worker, que también sirve la app; al cambiar de origen los registros locales no se trasladan solos.

## 4. Verificar sin enviar imágenes

Abre la URL actual del sitio seguida de **/api/config**. Debe devolver JSON, no la página HTML:

- `status: "backend_missing"`: falta el binding AI_BACKEND en Pages o no se ha vuelto a desplegar.
- `status: "disabled"`: el Worker responde pero AI_ENABLED no está en true.
- `status: "setup_required"`: faltan secretos, site key o bindings. `missing` enumera nombres de configuración, nunca sus valores.
- `status: "ready"` y `aiEnabled: true`: los requisitos de configuración están presentes. No certifica aún la validez de la clave ni el acceso al modelo.
- Error de conexión: revisar disponibilidad del Worker y binding.

En la app usa Mis datos para comprobar y aplicar la nueva versión de la PWA. Cierra otras pestañas si permanece una versión antigua. No borres los datos del sitio como primer intento: exporta un respaldo antes de cualquier limpieza.

## 5. Probar una foto real

1. Captura o sube una foto clara del plato. Espera a que se prepare.
2. Confirma el envío y completa Turnstile.
3. Pulsa «Identificar comida y estimar porción».
4. Revisa las alternativas, preparación y cantidad aproximada en g o ml. Los ingredientes ocultos y el peso no se conocen con certeza por una foto.
5. Elige un candidato, corrige lo necesario y confirma el registro.

Prueba papas fritas, salmón, platos mixtos y una foto sin comida. Una API conectada no garantiza que una clasificación sea correcta. Puede abstenerse o proponer alternativas; el usuario tiene la última confirmación.

## Validación de la entrega

Pruebas automatizadas de interfaz con DOM/canvas/Turnstile y proveedor simulados; protocolo del Worker, controles de acceso y cuotas; reenvío de Pages, errores y requisitos del servidor. No se probaron fotos reales ni el despliegue en la cuenta del usuario. No se consumió crédito del proveedor. Tampoco se dispone de validación visual con un navegador real en este entorno.

Fuentes oficiales consultadas el 18 de octubre de 2026:

- https://developers.cloudflare.com/pages/functions/bindings/#service-bindings
- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- https://developers.openai.com/api/docs/models/gpt-5.6-terra


## Cambio del protocolo en 4.3

Actualiza también el Worker antes de probar la nueva interfaz: `/api/config` debe incluir `version: "4.3.0"` y `nutritionPolicy: "catalog_only"`. Se eliminó el campo de nutrición del esquema de IA. Los valores vienen del catálogo y las cantidades visuales requieren una confirmación explícita. Un servidor anterior activado no cumple esta política y la interfaz pide actualizarlo.
