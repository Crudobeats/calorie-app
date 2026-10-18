# Nutrición y unidades — revisión 4.2

## Cobertura real

400 identificadores estables en 20 categorías. Se cubre el catálogo solicitado, no todos los alimentos del mundo ni todas las marcas existentes.

- 119 fichas con una referencia USDA de alimento comparable.
- 275 estimaciones por recetas modeladas para esta propuesta; no recetas chilenas publicadas ni medidas en laboratorio.
- 6 equivalentes aproximados destacados: quesillo/ricota, queso fresco/farmer cheese, mantecoso/cheddar, postre de soya/marca de referencia, mate/infusión herbal, energética/formulación RED BULL. Son sustituciones provisionales corregibles con datos específicos.
- Las 400 tienen energía, proteínas, carbohidratos y grasas.
- Fibra: 387 con dato; azúcares: 369; grasas saturadas: 399; sodio: 400. Los restantes muestran «Sin dato».

El contenido puede variar por variedad, especie, marca, receta, agua, sal, aceite y cocción. Una referencia USDA no certifica la composición exacta de un producto chileno. En modelos de pescado blanco se utiliza bacalao, cochayuyo usa kelp, panes usan referencias comparables y quesos usan los equivalentes de las filas fuente. El detalle exacto está en los ingredientes FDC del mapeo, no se ocultan sustituciones.

## Fuentes descargadas

USDA FoodData Central: https://fdc.nal.usda.gov/download-datasets/

| Dataset | Archivo original | SHA-256 del ZIP descargado |
| --- | --- | --- |
| SR Legacy, abril 2018 | FoodData_Central_sr_legacy_food_csv_2018-04.zip | b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0 |
| FNDDS 2021–2023, octubre 2024 | FoodData_Central_survey_food_json_2024-10-31.zip | dfb06ae7ddc397ccd570b91c14b75438ab2ba39f64f22d321f61d4a52a77f3eb |

Consultadas el 18 de octubre de 2026. El paquete conserva 186 filas utilizadas con FDC ID, descripción original, dataset, nutrientes por 100 g y porciones domésticas en `data/nutrition/source-foods.json`. No se requiere una clave API para usar el catálogo incluido. No se usaron valores extraídos de documentos chilenos incompletos ni se generaron nutrientes mediante IA.

IDs de nutrientes USDA: energía 1008, proteínas 1003, carbohidratos totales 1005, grasas 1004, fibra 1079, azúcares totales 2000, grasas saturadas 1258 y sodio 1093. Energía en kcal; sodio en mg; el resto en g. Los carbohidratos USDA totales incluyen fibra; no son necesariamente el mismo campo que carbohidratos disponibles de una etiqueta local. La energía publicada puede diferir de 4/4/9 por factores específicos y fibra; no se fuerza a coincidir.

## Modelos y reproducción

`data/nutrition/mapping.json` guarda, para cada ficha, fuente o fórmula y conversión de volumen. `recipes.txt` e `ingredients.json` son el borrador legible de las primeras 300 preparaciones; **mapping.json es el mapeo final**, con sustituciones posteriores por referencias mejores como papas fritas, arroz integral, flan y arroz con leche.

Cada componente representa gramos por 100 g del modelo comestible final, no una lista de pesos crudos antes de cocinar. Para cada nutriente se suma `valor_por_100g × gramos_componente / 100`. No se aplica un rendimiento de cocción oculto. Se utilizan referencias cocidas o listas para consumo cuando están disponibles; algunas mezclas de pastelería incluyen ingredientes y bases comparables como aproximaciones de composición. No se modelan pérdidas o retención adicionales, fermentación, extracción por filtrado ni absorción de aceite más allá de lo expresamente incluido. Si falta un nutriente en un componente, el resultado correspondiente queda nulo.

Estas fórmulas permiten un prototipo calculable y auditable, pero requieren refinamiento con recetas pesadas y rendimiento final para afirmar precisión local. La sal no incluida en una fórmula no se ha añadido al cálculo: revisar especialmente sodio de preparaciones caseras.

```bash
npm run nutrition:rebuild
npm run check
npm test
```

El recalculador usa solo los JSON incluidos. Para añadir una referencia o ajustar una receta, modifica mapeo y fuentes, recalcula, verifica y cambia la revisión del catálogo. Un administrador puede actualizar ese JSON por el mecanismo de catálogo sin nueva versión del frontend.

## Bebidas y volumen

30 fichas de líquidos (20 bebidas, leches, alternativas, kéfir y aceites) usan `basis:"ml"`. El resto usa `basis:"g"`. La leche en polvo se pesa; el yogur espeso también. Las bebidas aceptan ml, L (1 L = 1000 ml) o cantidad de porciones × volumen por porción. Nunca se impone que 1 ml = 1 g.

Los valores USDA se expresan por 100 g. Para volumen, se toma una porción doméstica que explicita volumen y masa y se calcula `gramosPorMl = masa / volumen`. Se prefieren fl oz, cup o tablespoon de volumen conocido; se excluyen porciones «Guideline» que describen cantidades de agregado y no la bebida completa. Unidades domésticas de EE.UU.: fl oz 29,5735295625 ml; cup 236,5882365 ml; tablespoon 14,78676478125 ml. Estas conversiones son aproximaciones de porción, no mediciones de densidad del producto concreto. Se muestra el origen en cada ficha. Nutrientes por 100 ml = nutrientes por 100 g × gramosPorMl.

Las bebidas modeladas usan una relación aproximada explícita: avena/bebida de avena USDA, cortado/cappuccino, café azucarado/café, limonadas y agua saborizada/agua, batido de plátano/milkshake casero. La espuma, azúcar y sólidos pueden alterar el volumen: sustituir con etiqueta por 100 ml o medición propia si se necesita mayor precisión. La receta de avena es sin filtrar y sin fortificar; no representa una marca comercial. Mate usa un equivalente provisional de infusión, no datos específicos de yerba mate.

El aceite de oliva ilustra por qué importa la conversión: 13,5 g por tablespoon corresponden aproximadamente a 0,913 g/ml, no 1 g/ml.

## Registros y reconocimiento

Nuevos registros: `amount` y `basis`, nutrientes por 100 de esa base. Los anteriores con `grams` se conservan como masa, sin reinterpretación retroactiva. Esquema de respaldo 5; se acepta esquema 4. Las cantidades, base y cuatro macros se conservan al editar/exportar/importar. Los nutrientes adicionales pertenecen a la ficha del catálogo y no se suman al diario en esta revisión.

La IA puede sugerir gramos porque ese es su contrato visual. Si el alimento mapeado tiene base ml y relación documentada, el servidor convierte gramos a ml antes de proponer la cantidad. Si no existe conversión, deja la cantidad por confirmar. El catálogo prevalece sobre los macros inventados por el modelo. Un resultado con referencia de receta continúa marcado como estimación por receta; una referencia no convierte una identificación visual incierta en un hecho. El usuario confirma alimento y cantidad. No se realizaron llamadas pagadas ni pruebas reales de reconocimiento en esta entrega.
