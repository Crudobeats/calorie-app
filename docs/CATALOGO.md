# Catálogo ampliable sin una nueva versión de la app

## Tres niveles independientes

1. **Catálogo inicial:** `public/data/catalog.json`, con 400 IDs y 20 categorías. Añadir datos a este archivo no exige cambiar JavaScript ni el número de versión de la aplicación, aunque sí actualizar el archivo en el alojamiento.
2. **Catálogo global dinámico opcional:** Cloudflare KV bajo la clave `current`. La API permite sustituirlo con autorización; no requiere volver a desplegar la app.
3. **Mis alimentos y fichas privadas:** nuevos alimentos y datos de etiquetas guardados en el navegador. No se publican ni afectan a otros usuarios. Se incluyen en el respaldo.

La app carga `/api/catalog`; si está sin conexión, utiliza el catálogo estático del shell. En **Mis datos → Buscar actualizaciones del catálogo** se obtiene la revisión disponible. Los registros previos guardan su propia composición y no cambian retroactivamente.

## Estructura y unidades

```json
{
  "schemaVersion": 1,
  "revision": "catalog-2026-10-19-1",
  "updatedAt": "2026-10-19",
  "foods": [
    {
      "id": "CL401",
      "name": "Nombre de una nueva preparación",
      "category": "Categoría existente o nueva",
      "aliases": ["nombre alternativo"],
      "nutrition": null,
      "source": null,
      "status": "Pendiente de validar",
      "revision": 1
    }
  ]
}
```

El ejemplo muestra un registro; una actualización real debe incluir también todos los IDs existentes. Reserva `USER-...` para alimentos privados; usa IDs `CL401`, `CL402`, etc., para ampliaciones globales. No reutilices el ID de una preparación para otra distinta. Los alias no generan duplicados. Las categorías se detectan desde los datos.

Cuando haya composición, `nutrition` es `[kcal, proteína_g, carbohidratos_g, grasas_g]`, por **100 unidades de la base declarada**, con `basis:"g"` para sólidos y `basis:"ml"` para líquidos. Si falta `basis` en datos anteriores se interpreta como gramos. No mezcles cifras por porción, por 100 g y por 100 ml. La conversión de masa a volumen necesita una relación documentada. Incluye `source` con tabla/etiqueta/receta, versión o fecha e identificador de referencia. Marca el estado de revisión de forma honesta. No cambies una ficha pendiente a verificada usando solo una estimación de IA.

Para recetas compuestas, utiliza ingredientes medidos, rendimientos y peso final preparado. Las diferencias por cocción, agua o aceite deben resolverse antes de publicar cifras. Si la composición no está disponible, mantén `nutrition:null` y `source:null`.

Los límites de seguridad permiten hasta 5.000 registros y un cuerpo de actualización de 2,5 MB. Estos son límites de implementación, no un compromiso sobre cobertura o velocidad de un catálogo mayor.

## Activar KV y actualizar sin despliegue

Cuando decidas usar el catálogo global:

```bash
npx wrangler@4 kv namespace create CATALOG
```

Copia el ID retornado al binding opcional `CATALOG` en `wrangler.jsonc` y despliega una vez esa configuración. Crea un secreto aleatorio de al menos 32 caracteres, diferente de cualquier otra clave:

```bash
npx wrangler@4 secret put CATALOG_ADMIN_TOKEN
```

Las actualizaciones posteriores son solo datos. Descarga el catálogo vigente, modifícalo, cambia `revision` y conserva los IDs existentes. Define `CATALOG_ADMIN_TOKEN` en el entorno local privado y ejecuta:

```bash
node scripts/update-catalog.mjs https://tu-dominio catalogo-completo.json
```

El script lee el token del entorno; no lo escribe ni lo imprime. Descarga la revisión actual y envía `If-Match`; si otra edición cambió el catálogo, el servidor rechaza con 409. KV propaga cambios de forma eventual: este control ayuda a evitar ediciones sobre revisiones antiguas, pero **no es una transacción global entre varios administradores**. Utiliza un único editor a la vez. Si se requiere administración simultánea, migra la escritura del catálogo a D1 o un Durable Object antes de habilitarla.

Sin KV, la app funciona con el JSON inicial y con las fichas privadas. No expongas el token ni una pantalla de administración pública para usuarios finales.


La revisión 4.2 incorpora 400 fichas con macros y procedencia. Consulta `NUTRICION.md` para la metodología, las aproximaciones y el recalculado. `details` contiene fibra, azúcares, grasas saturadas (g) y sodio (mg), o null cuando faltan. `provenance` documenta la referencia o receta; `volumeConversion` documenta la porción masa/volumen. El validador conserva estos campos. Si agregas fichas fuera de las fuentes incluidas, no las añadas al recalculador sin agregar su mapeo y evidencia.
