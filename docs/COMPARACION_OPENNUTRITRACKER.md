# OpenNutriTracker y CalorieApp — adopción para web 4.3

Referencia: https://github.com/simonoppowa/OpenNutriTracker

Revisión del código consultada el 18 de octubre de 2026: `8d2420f0305c96a4f798f3a111509827260f6df7`. Se revisaron README, LICENSE, documentación de arquitectura de IA y exportación, interfaz de interpretación de fotos, registro de agua y recientes. Es una revisión dirigida de esos flujos, no una auditoría de seguridad de todo el repositorio ni una prueba de su aplicación instalada. CalorieApp se compara contra el paquete 4.2.1 entregado; no se dispone de cambios locales posteriores que el usuario no haya compartido.

## Decisiones implementadas

| Área | Referencia observada | CalorieApp anterior | Adopción en 4.3 |
| --- | --- | --- | --- |
| Agua | Registro rápido, meta y deshacer en inicio | Agua como alimento en ml, sin panel | Meta personal opcional, 250/500 ml, cantidad libre, eliminación y deshacer; fecha del día o del diario |
| Registro habitual | Recientes y comidas reutilizables | Búsqueda completa y fichas privadas | Favoritos, filtro de usados antes, preparaciones con nombre y cantidades; repetir una comida de otro día |
| Recetas | Ingredientes guardados como una preparación | Solo alimento manual o plato puntual | Guardar el borrador de varios ingredientes y reutilizarlo sin registrarlo automáticamente |
| Seguimiento | Tendencias por períodos | Consulta de un día | Tabla de 7/30 días, agua y kcal por fecha; promedio excluye días sin comidas y totales con kcal desconocidas |
| Nutrientes adicionales | Paneles de nutrientes | Solo consulta de extras en la ficha | Los registros nuevos guardan los extras disponibles y muestran sus sumas diarias; los faltantes permanecen visibles |
| IA y calorías | Modelo identifica, base aporta nutrición | El modelo podía estimar macros si no había ficha | Se eliminan campos de nutrición del esquema del modelo y se ignoran si aparecen. Solo ficha del catálogo o etiqueta ingresada por el usuario |
| Porción visual | Referencia descarta masas estimadas desde fotos | Sugerencia en g/ml editable | Se conserva por requisito del usuario, con confirmación explícita adicional. Si no se puede estimar, queda vacía |
| Privacidad | Datos locales, red solo para funciones que la necesitan | IndexedDB y consentimiento para IA | Se mantiene la separación; el nuevo seguimiento no agrega servicios externos ni envía historial o perfil |
| Respaldo | JSON y CSV, alcance documentado | JSON de alimentos, perfil y plan | Esquema 6 incorpora agua, meta, favoritos, preparaciones y detalles; importa esquemas 4 y 5 |
| Tecnologías | Flutter/Dart y almacenamiento nativo | Web/PWA y Cloudflare | Se conserva HTML/JS/PWA. No se migra a Flutter ni se añaden dependencias de compilación |

Las preparaciones reutilizables de esta revisión conservan ingredientes y valores por 100 g/ml de sus fichas. No incorporan aún cálculo por rendimiento de cocción, peso final de una receta ni escalado automático por número de porciones. Cada cantidad se puede modificar en el borrador.

## Qué se mantiene deliberadamente

El reconocimiento real necesita Worker, Turnstile y clave del operador en el servidor. Adoptar una interfaz de otra app no crea inferencia gratuita. La referencia también mantiene su IA opcional y necesita un proveedor o un servidor. En nuestra web no se guardan claves de los usuarios en el navegador.

La referencia no intenta estimar gramos de una foto. Nuestra decisión difiere porque el usuario sí solicitó una propuesta de porción: se marca como visual, se pide confirmar o corregir y no se presenta como medida. Conservar esa función no prueba su precisión. Hace falta validar fotos reales con el modelo configurado y revisar resultados por alimento.

Se conservan las 400 fichas existentes y su procedencia: 119 referencias USDA, 275 modelos de receta y 6 equivalentes aproximados. Cambiar el flujo de IA no convierte esos modelos en análisis de laboratorio ni resuelve sustituciones locales de especie, marca o receta.

## Diferencias pendientes y criterio de prioridad

| Función de la referencia | Decisión para esta entrega | Motivo y próximo paso |
| --- | --- | --- |
| Open Food Facts y código de barras | Pendiente | Requiere integración específica, atribución de datos, controles de cuota, campos ausentes y pruebas con productos de Chile. No se simula una búsqueda externa ni un lector de cámara |
| Diez micronutrientes y metas de referencia | Solo cuatro extras ya disponibles | No hay datos de todos los minerales/vitaminas para las 400 fichas. No se completan con ceros o IA |
| Peso, actividades y sincronización con salud nativa | Pendiente | Requieren modelo e interfaces propios y evitar doble conteo del ejercicio. Los planes actuales ya separan actividad y ejercicio |
| Ayuno y recordatorios nativos | No priorizado | No corrige las necesidades principales de comidas, agua e identificación; requeriría un diseño específico para web y permisos |
| CSV y QR | Pendiente | JSON sigue siendo el formato completo reimportable. El agua, las recetas y el perfil sí forman parte del respaldo de CalorieApp |
| Cifrado con Keystore/Keychain | No equivalente en la web actual | IndexedDB no ofrece el mismo esquema de claves del dispositivo. No se anuncia cifrado independiente que no existe |
| Cuentas y sincronización entre dispositivos | Pendiente | Guardado local no equivale a una base de datos de usuarios en Cloudflare. Hace falta autenticación y almacenamiento por usuario |
| Búsqueda de texto por múltiples alimentos | Pendiente | Es útil para una siguiente ampliación; no se añade un parser ambiguo que asigne cantidades o matches sin revisión |

## Agua y ausencia de duplicados

El total se calcula a partir de dos fuentes de eventos: registros rápidos de agua y alimentos de agua en ml del diario. El registro rápido no crea también una comida ni mantiene un segundo total acumulado. Un alimento de agua aparece una vez en el cálculo. Agua simple y con gas cuentan como agua; otras bebidas se muestran aparte y el aceite no cuenta como bebida. Los alimentos privados en ml permiten elegir Agua, Otra bebida o No contar como bebida.

La app no puede reconocer que una persona ha anotado el mismo vaso por dos vías distintas. La interfaz lo advierte: si ya se registró en el catálogo, no debe volver a añadirse por el botón rápido. El agua antigua almacenada en gramos conserva esa base y no se convierte arbitrariamente a ml.

## Calidad de datos y migración

- Esquema de respaldo 6, compatible al importar 4/5. Los datos históricos de energía y gramos no se recalculan con las fichas nuevas.
- Agua y recetas tienen IDs propios. Se rechazan duplicados, cantidades inválidas, fechas imposibles e identificadores que puedan romper atributos de la interfaz.
- Las acciones de agua/favoritos/recetas confirman primero la escritura en IndexedDB y después actualizan el estado visible. Se conservan los datos previos ante fallos de almacenamiento.
- La nueva PWA incluye `tracking.js` en el caché. La activación de actualizaciones sigue siendo explícita.
- Para IA, `/api/config` declara `nutritionPolicy: "catalog_only"`. Si el servidor antiguo no lo declara, la interfaz solicita actualizarlo antes de analizar.
- Los nutrientes adicionales ausentes en registros antiguos permanecen ausentes: no se rellenan retrospectivamente desde un catálogo que puede haber cambiado.
- Un promedio de días registrados no garantiza que la persona anotara todas sus comidas. La interfaz lo aclara y no divide por días sin datos.

## Procedencia y licencia

El repositorio de referencia declara GPL-3.0. No se incorporaron archivos Dart, código Flutter, imágenes, iconos, textos de interfaz ni componentes derivados de ese proyecto. Esta entrega utiliza una implementación independiente en JavaScript de funciones de producto observadas y documenta la referencia. El repositorio externo no se incluye en el ZIP. Si en el futuro se reutiliza su código, habrá que revisar las condiciones de distribución de esa incorporación antes de hacerlo; aquí no se afirma una compatibilidad de licencias que no se haya establecido.

## Archivos de referencia para reproducir la comparación

Rutas relativas a la revisión del repositorio indicada arriba:

- `README.md` y `LICENSE`.
- `docs/ai-architecture.md` y `docs/export-format.md`.
- `lib/features/add_meal/domain/meal_photo_interpreter.dart`.
- `lib/features/add_meal/presentation/bloc/recent_meal_bloc.dart`.
- `lib/features/home/presentation/widgets/quick_water_widget.dart`.
- `lib/features/home/presentation/widgets/log_water_dialog.dart`.

## Aplicar la actualización

1. Exporta un respaldo desde la app actual.
2. Copia el contenido de `calorieapp-v4.3` dentro del repositorio correcto donde está `package.json`, conservando su carpeta `.git`.
3. Ejecuta `npm run check` y `npm test`.
4. Guarda y sube los cambios en la rama de revisión utilizada por Pages. Mantén salida `public` y la Function de API.
5. Actualiza también el Worker con `npx wrangler@4 deploy` si utilizas reconocimiento; sus secretos y binding `AI_BACKEND` siguen siendo necesarios. Comprueba versión y política en `/api/config`.
6. Aplica la actualización de PWA desde Mis datos. Verifica registro, meta de agua, restauración de copia y una foto real antes de promover a producción.

No se ejecutó publicación en la cuenta del usuario ni una llamada de IA real durante esta entrega. Las pruebas automatizadas usan dobles de navegador, almacenamiento, Turnstile y proveedor donde corresponde; no sustituyen pruebas reales de cámara, diseño responsive o Cloudflare.
