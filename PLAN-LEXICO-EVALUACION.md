# Plan: Léxico y Evaluación clínica

Guía de producto e implementación para expandir el panel admin **Léxico y Evaluación** hacia un informe de seguimiento AAC útil para logopedas, familias y configuradores del tablero.

**Estado:** Fases 0–4 completadas · Última actualización: 2026-05-24

---

## Objetivo

Pasar de:

> «¿Está bien analizado el tablero? ¿Cuántos toques hubo?»

a:

> «¿Qué vocabulario usa de verdad? ¿Cómo comunica? ¿Qué palabras no adopta? ¿Evoluciona semana a semana?»

### Principios de diseño

1. **Separar calidad técnica vs uso real** — no mezclar cobertura léxica con vocabulario activo.
2. **Mensaje como unidad clínica** — LME, funciones comunicativas y tasa de comunicación necesitan enunciados completados, no solo pulsaciones.
3. **Heurísticas honestas** — lo inferido se etiqueta como estimación; lo medido, como dato.
4. **Reutilizar infra existente** — `SymbolUsageEvent`, `PredictionTransition`, comparativas temporales, PDF.
5. **Privacidad primero** — sin consentimiento explícito (`shareUsageForPredictions`), no hay informe clínico detallado.

---

## Arquitectura objetivo

```
Tablero (/tablero)
  ├── Pulsación símbolo  → SymbolUsageEvent + PredictionTransition
  ├── Hablar / frase rápida → UtteranceEvent
  └── Navegación / borrar  → NavigationEvent (fase 4)

Server actions
  ├── getProfileLexiconUsageReport     (fase 1)
  └── getProfileCommunicationEvaluation (fase 2)

Admin: Léxico y Evaluación
  ├── 📚 Léxico
  │   ├── Calidad del tablero      ← actual (cobertura + revisión)
  │   └── Vocabulario en uso       ← fase 1
  └── 📊 Evaluación
      ├── Comportamiento comunicativo ← fase 2
      ├── Evolución temporal
      └── PDF clínico                 ← fase 3
```

---

## Estructura de UI (panel final)

```
Léxico y Evaluación
├── 📚 Léxico
│   ├── [Sub] Calidad del tablero
│   └── [Sub] Vocabulario en uso
│       ├── Vocabulario activo (lexema/símbolo + frecuencia)
│       ├── Núcleo vs periférico
│       ├── Palabras ignoradas
│       ├── Combinaciones frecuentes (2-gram / 3-gram)
│       └── Adopción de vocabulario nuevo
│
└── 📊 Evaluación
    ├── Resumen KPIs (LME, msgs/día, latencia composición)
    ├── Funciones comunicativas (estimadas)
    ├── Evolución (7/30/90 + personalizado, vs periodo anterior)
    └── Descargar informe PDF
```

Selector de periodo compartido entre subpestañas (misma UX que `BoardUsageEvaluation`).

---

## Modelo de datos

### Fase 0 — `UtteranceEvent` ✅ (implementado en esta fase)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `profileId` | FK | Tablero |
| `text` | String | Frase hablada (post-conjugación) |
| `symbolCount` | Int | Símbolos en el enunciado |
| `durationMs` | Int? | Primer tap → hablar |
| `source` | String | `speak` \| `quick_phrase` |
| `symbolsUsed` | Json | `[{ id, label, lexemeId? }]` |
| `inferredIntent` | String? | Función comunicativa heurística |
| `createdAt` | DateTime | Timestamp |

**Disparadores:** `PhraseBar` al hablar; frases rápidas/frecuentes en `AppInterface`.

**Fix asociado:** `resetPhraseTracking()` tras hablar para delimitar enunciados en n-gramas.

### Fase 4 — `NavigationEvent` ✅

Eventos: `folder_enter`, `folder_back`, `home`, `delete_last`, `clear_phrase`.

### Opcional — `Symbol.introducedAt`

Proxy actual: `Symbol.createdAt` (documentar en informes).

---

## Contrato de API (tipos compartidos)

Ubicación: `lib/usageEvaluation/types.ts` (extender progresivamente).

### Léxico — `LexiconUsageReport` (fase 1)

- `activeVocabulary`: lexemas/símbolos con frecuencia en periodo
- `coreCoverage`: núcleo vs periférico (`Lexeme.isCore`, `lexemeTier`)
- `ignoredSymbols`: visibles sin uso en periodo
- `frequentSequences`: bigramas (`PredictionTransition`) + trigramas (`SymbolUsageEvent`)
- `adoption`: cohortes por símbolos añadidos + tasa adopción 14 d

### Evaluación — `CommunicationEvaluationReport` (fase 2)

- `summary`: LME, utterances/día, latencia composición, deltas vs periodo anterior
- `communicativeFunctions`: distribución estimada
- `timeSeries`: buckets semanales

**Server actions previstas:**

- `getProfileLexiconUsageReport` → `app/actions/lexiconUsage.ts`
- `getProfileCommunicationEvaluation` → `app/actions/communicationEvaluation.ts`

---

## Glosario clínico (UI + PDF)

| Métrica | Definición en Luma Grid |
|---------|-------------------------|
| **Enunciado** | Pulsación de «Hablar» o reproducción de frase rápida con TTS |
| **LME** | Media de símbolos por enunciado en el periodo |
| **Sesión de composición** | Secuencia de taps hasta hablar, borrar o vaciar |
| **Vocabulario activo** | Lexemas/símbolos con ≥1 evento de uso en el periodo |
| **Ignorado** | Símbolo visible con 0 usos en el periodo |
| **Núcleo** | Lexema `isCore=true` o tier `curated` |
| **Adoptado** | Símbolo añadido en periodo X con ≥1 uso en 14 d siguientes |
| **Función comunicativa** | Clasificación heurística — **estimada** |
| **Iniciativa vs respuesta** | **Fuera de alcance v1** |

---

## Roadmap por fases

### Fase 0 — Fundación telemetría ✅ COMPLETADA

| ID | Entrega | Estado |
|----|---------|--------|
| F0-1 | Modelo `UtteranceEvent` + migración | ✅ |
| F0-2 | `recordUtterance` server action | ✅ |
| F0-3 | Registro al hablar y en frase rápida | ✅ |
| F0-4 | `resetPhraseTracking()` tras hablar | ✅ |
| F0-5 | Cola Dexie offline + flush | ✅ |
| F0-6 | Tests agregación LME | ✅ |
| F0-7 | `inferCommunicativeFunction` (cache en BD) | ✅ |

**Archivos clave:**

- `prisma/schema.prisma`, `prisma/migrations/…_utterance_events/`
- `app/actions/utterances.ts`
- `lib/usageEvaluation/inferCommunicativeFunction.ts`
- `lib/usageEvaluation/utteranceMetrics.ts`
- `lib/dexie/usageSyncQueue.ts`
- `components/app/AppInterface.tsx`

---

### Fase 1 — 📚 Vocabulario en uso ✅ COMPLETADA

| ID | Entrega | Estado |
|----|---------|--------|
| L1-1 | Vocabulario activo con frecuencia | ✅ |
| L1-2 | Núcleo vs periférico | ✅ |
| L1-3 | Palabras ignoradas | ✅ |
| L1-4 | Combinaciones frecuentes (2-gram / 3-gram) | ✅ |
| L1-5 | UI `BoardLexiconUsage.tsx` + `UsagePeriodPicker.tsx` | ✅ |

**Archivos clave:**

- `app/actions/lexiconUsage.ts`
- `lib/usageEvaluation/aggregates/*`
- `components/admin/BoardLexiconUsage.tsx`
- `components/admin/UsagePeriodPicker.tsx`
- `lib/hooks/useUsageReportPeriod.ts`

---

### Fase 1 (detalle original) — 📚 Vocabulario en uso (~1–1,5 sprints)

| ID | Historia |
|----|----------|
| L1-1 | Vocabulario activo con frecuencia real |
| L1-2 | Núcleo vs periférico |
| L1-3 | Palabras ignoradas |
| L1-4 | Combinaciones frecuentes (2-gram / 3-gram) |
| L1-5 | UI `BoardLexiconUsage.tsx` + `UsagePeriodPicker.tsx` |

---

### Fase 2 — 📊 Evaluación comunicativa ✅ COMPLETADA

| ID | Entrega | Estado |
|----|---------|--------|
| E2-1 | LME + enunciados/día (`UtteranceEvent`) | ✅ |
| E2-2 | Evolución vs periodo anterior | ✅ |
| E2-3 | Serie temporal semanal | ✅ |
| E2-4 | Funciones comunicativas (estimadas) | ✅ |
| E2-5 | Latencia de composición | ✅ |
| E2-6 | `BoardCommunicationEvaluation.tsx` + PDF | ✅ |

**Archivos clave:**

- `app/actions/communicationEvaluation.ts`
- `lib/usageEvaluation/aggregates/communicationEvaluation.ts`
- `components/admin/BoardCommunicationEvaluation.tsx`
- `lib/usageEvaluation/downloadCommunicationPdf.ts`

---

### Fase 2 (detalle original) — 📊 Evaluación comunicativa (~1,5 sprints)

| ID | Historia |
|----|----------|
| E2-1 | LME + mensajes/día desde `UtteranceEvent` |
| E2-2 | Evolución vs periodo anterior |
| E2-3 | Serie temporal semanal |
| E2-4 | Panel funciones comunicativas (estimadas) |
| E2-5 | Latencia de composición |
| E2-6 | `BoardCommunicationEvaluation.tsx` |

**Heurística v1 (funciones):**

- `quiero`, `dame`, `más` → petición
- `no`, `basta`, `parar` → rechazo
- `¿`, `qué`, `quién`, `dónde` → pregunta
- `hola`, `adiós`, `gracias` → saludo
- default → comentario / otro

---

### Fase 3 — Adopción + PDF clínico (~1 sprint) ✅

| ID | Historia | Estado |
|----|----------|--------|
| L3-1 | Palabras nuevas + tasa adopción | ✅ `AdoptionBlock` + agregador |
| L3-2 | PDF enriquecido + glosario | ✅ `downloadClinicalReportPdf` |
| L3-3 | Avisos tablero demo | ✅ `DemoClinicalBanner` |
| L3-4 | Exponer métricas 7d de observabilidad backend | ✅ bloque en Cobertura léxica |

---

### Fase 4 — Fricción de navegación ✅

| ID | Historia | Estado |
|----|----------|--------|
| E4-1 | `NavigationEvent` + instrumentación | ✅ |
| E4-2 | Métricas de fricción | ✅ `navigationFriction.ts` |
| E4-3 | Panel eficiencia del tablero | ✅ `BoardNavigationEfficiency.tsx` |

**Fuera de alcance v1:** iniciativa vs respuesta (requiere app acompañante).

---

## Privacidad

- Renombrar copy en Cuenta: uso para predicciones **e informes de evaluación**
- Empty state con enlace a Cuenta si opt-out
- PDF: pie de consentimiento
- Solo el titular autenticado del `profileId` puede consultar/exportar

---

## Estructura de código objetivo

```
lib/usageEvaluation/
  types.ts
  ranges.ts
  inferCommunicativeFunction.ts    ✅ fase 0
  utteranceMetrics.ts              ✅ fase 0
  aggregates/                      fases 1–2
  downloadClinicalReportPdf.ts     ✅ fase 3

app/actions/
  utterances.ts                    ✅ fase 0
  lexiconUsage.ts                  ✅ fase 1
  communicationEvaluation.ts       ✅ fase 2
  boardEfficiency.ts                 ✅ fase 4
  navigation.ts                      ✅ fase 4

components/admin/
  UsagePeriodPicker.tsx            ✅ fase 1
  BoardLexiconUsage.tsx            ✅ fase 1–3
  BoardCommunicationEvaluation.tsx ✅ fase 2–3
  DemoClinicalBanner.tsx           ✅ fase 3
  BoardNavigationEfficiency.tsx    ✅ fase 4
```

---

## MVP demo logopeda (~3 sprints post F0)

1. Vocabulario activo + ignorados + combinaciones frecuentes
2. LME + mensajes/día + evolución vs periodo anterior
3. PDF con glosario y disclaimer
4. Funciones comunicativas v1 heurística

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Pocos datos | Empty states + «usa el tablero X días» |
| Opt-out privacidad | Solo frases acumuladas + cobertura técnica |
| Teclado no contabilizado | Documentar límite v1 |
| Heurística impugnada | Mostrar ejemplos por categoría |
| Volumen de eventos | Rangos ≤90 d; índices en BD |

---

## Checklist pre-Fase 1

- [ ] Validar glosario con logopeda (LME, adopción 14 d)
- [ ] Decidir `introducedAt` vs `createdAt` para imports
- [ ] Actualizar copy consentimiento en Cuenta
- [ ] Confirmar exclusión demo en PDF clínico
