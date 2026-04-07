# Plan de integración: núcleo léxico para tableros personalizados

Plan por **magnitud** (número de lemas orientativo) y **pasos** concretos, alineado con el léxico en base de datos (`lexemes`), detección existente (`detectLexemeForLabel`) y superficie de frase (`conjugation.ts`, `phraseSurface.ts`).

---

## Principios

1. **Una sola fuente de verdad**: el núcleo vive en **Prisma/Postgres** (no duplicar un diccionario enorme en el cliente).
2. **Calidad sobre cantidad**: mejor **1.000–3.000 lemas bien etiquetados** (POS, género, irregularidades) que decenas de miles inconsistentes.
3. **Degradación explícita**: si no hay lema, heurísticas + forma del picto (comportamiento actual documentado).

---

## Fase 0 — Inventario y criterios (sin ampliar aún el léxico)

**Magnitud:** 0 lemas nuevos; solo definición de reglas.

1. Documentar qué campos del `Lexeme` usan ya: conjugación, predicción, API de vocabulario, `aacPriority`, `semanticLayer`, etc.
2. Definir **criterio de “núcleo AAC”**: p. ej. `aacPriority >= N` **o** lista explícita de `lemma` **o** flag futuro `isCore` / capa semántica.
3. Listar **puntos de fallo** en tableros personalizados: etiquetas libres, mayúsculas, sin `lexemeId` en `Symbol`.
4. Acordar **SLA de calidad**: % mínimo de símbolos con `lexemeId` resuelto en perfiles de prueba.

**Salida:** criterio escrito y checklist de QA manual.

---

## Fase 1 — Núcleo mínimo (~500–1.000 lemas)

**Magnitud:** **500–1.000** lemas de alta prioridad (partículas, top verbos de movimiento/estado, sustantivos de lugar/tiempo, pronombres).

**Objetivo:** reducir errores gramaticales en frases típicas (“ir a…”, “acabar de…”, artículos) sin cubrir todo el léxico.

### Estado en el repo (implementado)

| Artefacto | Descripción |
|-----------|-------------|
| `scripts/extract-demo-labels.mjs` | Extrae etiquetas únicas de `lib/data/defaultSymbols.ts` → `prisma/data/demo-label-candidates.json`. |
| `scripts/phase1-bulk-data.mjs` | Listas masivas curadas (~440 sustantivos, ~100 verbos, ~60 adjetivos) para Fase 1. |
| `scripts/import-phase1-lexemes.mjs` | Import **idempotente**: crea solo lemas **nuevos** (`source: phase1`); si el lema ya existe (p. ej. seed), **no** borra formas ni conjugaciones; añade alias opcionales. Suplemento de alias MAYÚSCULAS (`DE`, `CON`, `UN`, …) sobre lemas existentes. |
| `prisma/data/phase1-extra.json` | JSON opcional: array de entradas extra con el mismo esquema que el seed (lemma, `primaryPos`, `forms`, …). |
| `prisma/data/phase1-detection-battery.json` | ~50 casos fijos para medir detección (alias/form/lemma/heurística). |
| `scripts/test-phase1-battery.mjs` | Ejecuta la batería contra la BD (misma lógica que `test-lexicon-detection.mjs`). |
| `scripts/load-env-database.mjs` | Carga `DATABASE_URL` desde `.env` / `.env.local` en scripts Node. |

**Comandos npm:** `npm run lexicon:extract-demo-labels`, `npm run lexicon:import-phase1`, `npm run test:phase1-battery`.

**Orden recomendado:** `prisma migrate deploy` (o `db:migrate`) → `npm run seed:lexicon` → `npm run lexicon:import-phase1` → `npm run test:phase1-battery`.

### Pasos

1. **Extraer candidatos** desde uso real o desde plantilla demo: etiquetas más frecuentes en `Symbol` / eventos si existen.
2. **Curar en CSV/JSON** (lemma, `primaryPos`, género si aplica, notas) y validar contra reglas de conjugación actuales.
3. **Script de import idempotente** (ampliar `seed-lexicon.mjs` o script nuevo): `upsert` por `normalizedLemma` para no duplicar.
4. **Ensayo en tablero personalizado**: crear perfil de prueba con pictos sin `lexemeId` y comprobar que `detectLexemeForLabel` enlaza al lema correcto.
5. **Medición**: antes/después de tasa de resolución y frases incorrectas en una batería de ~50 frases fijadas.

**Salida:** lemas en BD + informe corto de cobertura en pruebas.

---

## Fase 2 — Núcleo medio (~2.000–5.000 lemas)

**Magnitud:** **2.000–5.000** lemas (incluye Fase 1).

**Objetivo:** cobertura AAC general (comida, salud, escuela, familia) con **prioridad** y **mantenimiento** sostenible.

### Estado en el repo (implementado)

| Artefacto | Descripción |
|-----------|-------------|
| `scripts/lib/lexemePhaseImportCore.mjs` | Lógica compartida de import (normalización, `createLexemeFull`, alias, idempotencia por lema). |
| `scripts/generate-phase2-bulk-data.mjs` | Genera `scripts/phase2-bulk-data.mjs` desde listas temáticas (comida, salud, escuela, familia, hogar, naturaleza, verbos y adjetivos; filtro de ruido en adjetivos). |
| `scripts/phase2-bulk-data.mjs` | Datos masivos Fase 2 (orientativo: ~250–350 sustantivos, ~100 verbos, ~300 adjetivos según generación; volver a ejecutar el generador para conteos exactos). |
| `scripts/import-phase2-lexemes.mjs` | Import idempotente con `source: phase2` y prioridades algo inferiores a Fase 1; no pisa lemas ya existentes. |
| `prisma/data/phase2-extra.json` | Entradas extra opcionales (mismo esquema que otras fases). |
| `scripts/test-lexicon-regression.mjs` | Encadena `test-lexicon-detection.mjs` + `test-phase1-battery.mjs`. |
| Admin → Léxico (observabilidad) | Métricas por perfil + **muestra de símbolos a revisar** (etiqueta, motivo, sugerencia de detección). |

**Comandos npm:** `npm run lexicon:generate-phase2-data`, `npm run lexicon:import-phase2`, `npm run test:lexicon-regression` (además de `test:lexicon-detection` y `test:phase1-battery` por separado).

**Orden recomendado:** `prisma migrate deploy` (o `db:migrate`) → `npm run seed:lexicon` → `npm run lexicon:import-phase1` → `npm run lexicon:import-phase2` → `npm run test:lexicon-regression`.

**API:** `GET /api/vocabulary` usa límites por defecto/máximo (`DEFAULT_LIMIT` / `MAX_LIMIT`) y filtros indexados en `lexemes`; no ampliar respuestas sin revisar carga.

### Pasos

1. **Priorizar por dominio**: lotes temáticos (p. ej. 500 por sprint) con revisión lingüística mínima.
2. **Enriquecer metadatos** en BD: coherencia de `semanticLayer` / `isCore` (si la migración está aplicada) para predicción y filtros.
3. **Herramienta admin**: observabilidad por perfil + lista de muestra de símbolos sin cobertura completa o con sugerencia de detección (solo lectura).
4. **API/cache**: asegurar que `/api/vocabulary` o lecturas por lote no degradan con más filas (índices, límites ya existentes).
5. **Regresión**: `npm run test:lexicon-regression` y pruebas manuales de conjugación en frases fijas.

**Salida:** léxico ampliado + índices revisados + documentación de cómo re-sembrar en staging/producción.

---

## Fase 3 — Escala grande (8.000+ lemas)

**Magnitud:** **8.000–15.000+** lemas (solo si hay proceso y recursos de curación).

**Objetivo:** acercarse a cobertura tipo “diccionario de uso”, sin sustituir un corpus lingüístico completo.

### Estado en el repo (base técnica)

| Artefacto | Descripción |
|-----------|-------------|
| Migración `lexeme_tier` | Columna `Lexeme.lexemeTier`: `curated` (por defecto; Fase 1–2 y seed) o `extended` (lote ampliado). Índice en BD. |
| Predicción | `app/actions/predictions.ts`: factor **0,72** sobre la parte de `aacPriority` cuando `lexemeTier === 'extended'` (`EXTENDED_TIER_PREDICTION_FACTOR` en `lib/lexicon/lexemeTier.ts`). |
| API vocabulario | `GET /api/vocabulary?tier=curated` \| `extended` (tras migrate; modo degradado ignora el filtro si falta la columna). |
| `scripts/validate-phase3-staging.mjs` | Valida JSON de staging: duplicados, `primaryPos` permitido, `lemma` obligatorio. |
| `prisma/data/phase3-staging.json` | Lista a importar (vacía por defecto); rellenar desde fuente externa con mapeo explícito al esquema. |
| `prisma/data/phase3-extra.json` | Entradas extra opcionales (mismo esquema flexible que otras fases). |
| `scripts/import-phase3-lexemes.mjs` | Import idempotente `source: phase3`, `lexemeTier: extended`, prioridades por debajo de Fase 2. |
| Admin | Bloque **Catálogo global**: totales de lemas (curados / ampliados) y símbolos con `lexemeId` en todos los perfiles (`getLexiconCatalogStats`). |

**Comandos npm:** `npm run lexicon:validate-phase3`, `npm run lexicon:import-phase3`.

**Orden recomendado:** `prisma migrate deploy` → seeds e importes Fase 1 y 2 → curar `phase3-staging.json` desde fuente licenciada → `npm run lexicon:validate-phase3` → `npm run lexicon:import-phase3` → `npm run test:lexicon-regression`.

**Política de datos:** versionar listas en `prisma/data/` y repetir `validate` + `import` en staging antes de producción; ampliaciones masivas solo con muestra humana revisada (no sustituye corpus lingüístico).

### Pasos (proceso)

1. **Fuente externa licenciada** (lista de frecuencia, lematizador) con **mapeo** a vuestro esquema; no importar a ciegas.
2. **Pipeline**: rellenar staging → `validate-phase3-staging` → import → revisión por muestras.
3. **Particionar por tier**: implementado como `curated` vs `extended` en BD + menor peso en predicción para `extended`.
4. **Observabilidad**: métricas globales en admin; informe de errores de conjugación en producto queda para iteración futura si se añade telemetría.
5. **Actualización**: versionado de JSON en repo + migraciones Prisma cuando cambie el esquema; cadencia trimestral recomendable para datos masivos.

**Salida:** proceso industrializable (staging + validación + tier + observabilidad), no solo un dump más grande.

---

## Orden recomendado de trabajo en el código (transversal)

1. Mantener **detección** (`lib/lexicon/detect.ts`) como entrada principal al enlazar pictos personalizados.
2. Reutilizar **misma migración y semillas** en todos los entornos (`prisma migrate deploy` + seed controlado).
3. No aumentar heurísticas en `conjugation.ts` sin comprobar si el lema ya resuelve el caso en BD.
4. Tras cada fase, **actualizar** este documento con números reales (conteo de lemas en BD, resultados de pruebas).
5. **Verificación automatizada del plan:** `npm run test:mejora-plan` comprueba artefactos referenciados aquí, JSON de datos, `prisma validate`, el núcleo `lexemePhaseImportCore` y coherencia tier/predicción. Con `DATABASE_URL` añade conexión y lectura de `lexemes` (avisa si falta migración `lexeme_tier`). `MEJORA_SKIP_DB=1` fuerza solo comprobaciones sin BD. `node scripts/test-mejora-plan.mjs --full` encadena además `test-lexicon-regression` (requiere BD sembrada para que la batería tenga sentido).

---

## Resumen de magnitudes

| Fase | Lemas orientativos | Enfoque |
|------|-------------------|---------|
| 0 | 0 | Criterios y medición |
| 1 | 500–1.000 | Núcleo de error alto impacto |
| 2 | 2.000–5.000 | AAC general priorizado |
| 3 | 8.000+ | Escala con pipeline y tiers |

---

*Documento generado como plan de integración; ajustar fechas y responsables en el tablero de proyecto del equipo.*
