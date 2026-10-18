# Revisión y validación de la versión 4.2.0

## Decisiones aplicadas

| Hallazgo anterior | Cambio y alcance |
| --- | --- |
| Reconocimiento por colores y selección aleatoria | Eliminado. Backend real, sin fallback inventado; si falla, ofrece entrada manual. |
| Clave en navegador | Solo secreto del servidor. No se migra `cal.apikey` ni se exporta. |
| Respuesta de IA y mapeo débil | JSON Schema estricto más validación propia; ID canónico completo, preparación y alternativas. No se usa la primera palabra. |
| HTML con valores sin escapar | Textos variables escapados; scripts externos y CSP en alojamiento. |
| Guardado silencioso y fotos en localStorage | IndexedDB con confirmación transaccional, aviso de fallo y conservación del borrador. Fotos no persistidas por defecto. |
| Confirmación durante un análisis anterior | Estado ocupado, cancelación, identificador de petición y bloqueo de cambios de fotos/contexto durante análisis. |
| kcal desactualizadas al modificar gramos | Recalcula alimento y total; bloquea porciones inválidas. |
| Fechas UTC y cambio de día | Fechas civiles locales; diferencias entre fechas por mediodía UTC. |
| Semana mal etiquetada | No se reintroduce el gráfico de V1. El diario usa la fecha elegida explícitamente. |
| Promedio que confunde días sin datos con consumo cero | No se publica un promedio engañoso. Se distinguen nutrientes pendientes y totales parciales. |
| Plan histórico y cambios de peso | Snapshot del plan en cada registro; cambios de perfil invalidan el resultado pendiente y exigen recalcular. |
| Perfil sin validar y metas por defecto | Objetivo y parámetros explícitos; límites de revisión y comprobación de porcentajes/energía. |
| Service worker con caché fija y limpieza ajena | Caché identificada por versión; red primero, actualización optativa y limpieza de prefijos propios. |
| Fotos sin control de tamaño y lectura | Tipo, peso, píxeles, orientación, compresión, errores y token de preparación. Giro/recorte/restauración. |
| Borradores y edición que se mezclaban | Copia al editar, borrador separado, bloqueo de doble envío y guardado antes de vaciarlo. |

Se añadieron revisión optimista de IndexedDB para dos pestañas, aviso por BroadcastChannel, restauración de respaldo validada antes de sustituir datos y prevención de importar V1 repetidamente. Los alimentos propios permanecen buscables sin modificar la app.

## Validación automática

Resultado de esta entrega: **44 pruebas automatizadas aprobadas**, más comprobación de sintaxis y catálogo.

Comandos ejecutables: `npm run check` y `npm test`.

- Sintaxis de módulos y scripts; catálogo y referencias de esquema.
- 400 IDs únicos, 20 categorías, cuatro macros para cada ficha y recálculo contra fuentes y fórmulas documentadas; 275 recetas y 6 equivalentes se marcan como aproximados.
- Cuatro métodos de ajuste, objetivos, actividad y cuatro métodos de macros.
- Direcciones de objetivo contradictorias, fechas imposibles, medidas inválidas y resultados fuera de límites.
- Flujos de interfaz en un DOM de prueba: guardado, doble clic, fallo de cuota, edición, fichas privadas y escape de HTML.
- IndexedDB mediante doble transaccional: commit, aborto, conflicto de revisión y recuperación.
- Backend mediante dependencias simuladas: origen, tamaño real de cuerpo, JPEG, consentimiento, Turnstile, límites, cupo global, estructura del proveedor y validación de candidatos.
- Catálogo administrado: autorización, revisión `If-Match`, conservación de IDs y rechazo de actualizaciones inválidas.

**Las pruebas de IA usan respuestas simuladas del proveedor para comprobar el protocolo y controles. No prueban la precisión de reconocimiento de fotos reales.** No se enviaron fotos a OpenAI ni se consumieron créditos. No se ejecutó despliegue.

## Comprobaciones que faltan con tu entorno

- Cámara y galería reales en Firefox/Chrome de escritorio, Chrome Android y Safari iOS; verificar orientación de fotos de distintos dispositivos y PNG/HEIC convertido.
- Renderizado visual en navegador y responsive; aquí se verificaron estructura y flujos con un DOM de prueba, no con un motor de navegador.
- Integración con Turnstile, secretos, Rate Limiting y Durable Objects en una instalación Cloudflare de revisión. No se probó Wrangler contra tu cuenta.
- Precisión de IA con un conjunto etiquetado de fotos chilenas y platos confundibles; revisar identificación, ingredientes ocultos, porciones y abstención.
- Ensayo real de actualización desde la PWA V1, persistencia tras cerrar/reabrir, trabajo sin red y recuperación de respaldos en el dominio elegido.
- Validación nutricional del catálogo. Las estimaciones de IA no reemplazan este trabajo.

No se afirma que el software ya esté validado para producción. El paquete es la implementación candidata para revisar, ejecutar localmente y probar antes de publicar.

## Restricciones conscientes

No hay cuentas, sincronización de historial ni cobro a usuarios. IndexedDB no cifra con una clave independiente: depende del perfil del navegador y del equipo. Las copias exportadas contienen datos personales y deben guardarse de forma privada. La privacidad del proveedor al reconocer imágenes debe revisarse antes de activar el servicio.

Los cálculos semanales/por fecha usan una equivalencia lineal de 7.700 kcal/kg solo para explorar ajustes. No simulan el metabolismo adaptativo ni garantizan resultados. La separación actividad/ejercicio evita duplicación únicamente si el usuario clasifica sus sesiones correctamente. El perfil adulto fuera de embarazo/lactancia es el alcance del cálculo automático; se puede usar registro sin meta cuando se requiere evaluación profesional.

## Ajuste del flujo de planes

La asistencia profesional es opcional; no es una autorización para usar la app. El cálculo general mantiene un ámbito adulto y límites de producto (1.500 kcal para perfil masculino / 1.200 para femenino, máximo 6.000) sin afirmar que esos valores sean adecuados para cada persona. Los ajustes por encima del 35 % y la equivalencia por encima del 1 % semanal generan avisos, no una derivación obligatoria. El usuario revisa y confirma; las metas imposibles no se aplican.

Se verificaron el caso de 3.000 kcal, la conversión de recorte a total diario, normalización de porcentajes, conciliación de gramos, invalidación del cálculo y aplicación con avisos. Las 44 pruebas están aprobadas. No hubo despliegue ni llamadas reales de reconocimiento.

Fuentes del alcance de cálculo: https://www.niddk.nih.gov/bwp y https://support.myfitnesspal.com/hc/en-us/articles/360032625391-How-does-MyFitnessPal-calculate-my-initial-goals .


## Bebidas y catálogo nutricional — 4.2

Se verificaron 500 ml frente a 0,5 L; porciones con volumen conocido; bebidas manuales con etiqueta por 100 ml; conservación de unidades en diario y respaldos; registros históricos por gramos y conversión explícita de correcciones antiguas. El servidor convierte las sugerencias visuales por masa a volumen solo con una relación documentada. Se comprobó el aceite de oliva con una relación distinta de 1 g/ml, y se recalcularon los ocho nutrientes de las 400 fichas contra los 186 registros fuente y sus mezclas.

Las pruebas no validan en laboratorio las recetas modeladas. Las aproximaciones y datos faltantes se muestran al usuario. Véase NUTRICION.md. La visualización de revisión reproduce los flujos con datos temporales, sin llamadas de red ni almacenamiento persistente.
