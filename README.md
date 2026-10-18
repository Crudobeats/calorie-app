# CalorieApp Web 4.2.0 — versión de revisión

Proyecto editable que conserva la UI aprobada. No se publicó en GitHub ni Cloudflare. Se separan interfaz, cálculos, datos, persistencia y servidor de reconocimiento.

## Abrir en Visual Studio Code

1. Descomprime el ZIP y abre la carpeta `calorieapp-v4.2` con **Archivo → Abrir carpeta**.
2. Instala Node.js 22 o superior si no lo tienes.
3. Abre una terminal en esa carpeta y ejecuta:

```bash
npm start
```

4. Abre `http://127.0.0.1:5173`. Para cerrar, usa Ctrl+C en la terminal.

Esta vista local no necesita instalar dependencias y mantiene la IA desactivada. No abras `index.html` directamente con doble clic: los módulos y los datos se sirven por HTTP. El historial de `localhost` es independiente del historial del dominio público.

```bash
npm run check
npm test
```

Las tareas de VS Code incluyen inicio local, comprobaciones y pruebas. Para formatear un archivo JavaScript puedes usar el formateador integrado de VS Code: **Format Document / Shift+Alt+F**.

## Cambios de esta revisión

- Bebidas en ml/L, nutrientes de las 400 fichas, procedencia y modelos transparentes.
- Cantidades y unidades conservadas en diario, edición, respaldo e integración de reconocimiento.

- «Calorías totales al día» separado de recorte/aumento: 3.000 kcal para consumir no se interpreta como un déficit de 3.000.
- Cálculo de mantenimiento, ajuste y total visible mientras editas.
- Ritmos altos se muestran como avisos a revisar, con confirmación del usuario; no requieren aprobación médica. Se conservan límites de aplicación para metas inviables.
- Porcentajes con suma visible, normalización explícita y carbohidratos restantes.
- Gramos con energía total y acciones para ajustar carbohidratos o adoptar sus calorías.
- Resumen independiente → Aplicar mi plan → plan activo; editar no cambia el plan aplicado.
- Un único motor compartido entre la interfaz y las pruebas.

## Qué funciona

- UI adaptable con tema claro, oscuro y preferencia inicial del sistema.
- 400 alimentos y preparaciones, en 20 categorías, con ID estable, alias y búsqueda sin tildes.
- Alimentos privados reutilizables y fichas nutricionales locales recordadas por ID.
- Objetivos explícitos; no se generan metas sin selección y confirmación.
- Ajustes por kcal, porcentaje, ritmo semanal o peso/fecha; actividad y ejercicio separados para evitar contarlos dos veces.
- Nutrientes por distribución, porcentajes, gramos diarios o g/kg, con conciliación de energía.
- Foto superior y lateral; orientación, giro, recorte central, restauración y reducción de tamaño.
- Registro, edición, eliminación con deshacer y totales parciales cuando faltan datos.
- Guardado transaccional en IndexedDB, exportación/importación validada y protección frente a otra pestaña que haya cambiado los datos.
- Importación explícita de registros V1 en el mismo origen, sin copiar claves y con marca para evitar repetirla.
- PWA con uso manual sin conexión después de una primera carga correcta; actualización confirmada por el usuario.
- Backend real de reconocimiento para Cloudflare, con validación, control de abuso y cupo global diario. Está desactivado por defecto.

## Estado de la composición nutricional

Las 400 fichas incluyen kcal, proteínas, carbohidratos y grasas. **No equivalen a 400 preparaciones chilenas analizadas:** 119 son referencias USDA, 275 son modelos de receta y 6 son equivalentes aproximados. La ficha muestra su estado y supuestos. Fibra, azúcares, grasas saturadas y sodio se incluyen cuando la fuente los aporta; un dato ausente queda nulo, nunca se supone cero.

Las bebidas se registran por ml, L o porciones con volumen conocido; sólidos por g o porciones pesadas. La composición se expresa por 100 ml o 100 g respectivamente. Los datos USDA por masa se convierten a volumen mediante porciones documentadas, con limitación explícita de aproximación. Las mezclas que necesitan un equivalente para volumen lo explican en su ficha. Ningún dato requiere consultar IA para buscarlo.

Los registros previos conservan su cantidad y composición originales: una bebida antigua guardada por gramos permanece por gramos. Los nuevos respaldos usan esquema 5 y aceptan la importación de esquema 4. Las correcciones privadas antiguas por 100 g se convierten usando la relación de volumen documentada al aplicarlas al catálogo nuevo; no cambian los registros históricos.

Puedes corregir valores con la etiqueta de tu marca o receta medida, y crear una bebida privada por 100 ml. El detalle de fuentes, cobertura y límites se encuentra en `docs/NUTRICION.md`. El paquete incluye las filas fuente utilizadas, el mapeo y un script para recalcular, sin claves ni servicios externos.

## Archivos principales

| Archivo | Función |
| --- | --- |
| `public/index.html`, `app.css`, `app.js` | Interfaz, navegación y flujos |
| `public/lib/core.js` | Cálculos de energía y nutrientes |
| `public/lib/validation.js` | Validación de catálogo, respaldo y reconocimiento |
| `public/lib/storage.js` | IndexedDB, transacciones y revisión optimista |
| `public/data/catalog.json` | Catálogo inicial editable, separado de la app |
| `public/sw.js` | Caché y actualización de PWA |
| `server/worker.js` | API de IA, catálogo protegido y cupo diario |
| `wrangler.jsonc` | Configuración de Cloudflare; IA apagada |
| `docs/ACTIVAR_IA_Y_PUBLICAR.md` | Activación y publicación posteriores |
| `docs/CATALOGO.md` | Ampliación sin cambiar la versión de la app |
| `docs/REVISION_Y_VALIDACION.md` | Correcciones, pruebas y límites pendientes |

## Antes de publicar

Revisa la interfaz y el catálogo. Después configura la cuenta de Cloudflare y, cuando corresponda, credenciales de IA y Turnstile siguiendo el documento incluido. No se han creado recursos ni consumido créditos de IA en esta entrega.

El frontend puede alojarse estáticamente, pero la IA necesita servidor. **GitHub Pages por sí solo no ejecuta este backend.** La ruta incluida utiliza Cloudflare Workers con Static Assets. Si tu publicación actual es Cloudflare Pages, consulta el documento antes de reemplazarla.

No hay sincronización entre dispositivos ni cuentas de clientes en esta etapa. El usuario controla su historial local. Borrar los datos del navegador puede eliminarlo; utiliza respaldos.
