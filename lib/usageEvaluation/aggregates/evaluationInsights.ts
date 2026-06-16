import type { UtteranceSymbolUsed } from '@/lib/usageEvaluation/utteranceTypes'
import type {
  EvaluationInsight,
  NewVocabularySummary,
  SimpleEvaluationReport,
  UsageConsistencyStats,
} from '@/lib/usageEvaluation/simpleEvaluationTypes'

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

/** Heurísticas accionables sobre el informe SIMPLE (FULL). */
export function buildEvaluationInsights(report: SimpleEvaluationReport): EvaluationInsight[] {
  const insights: EvaluationInsight[] = []

  const { newVocabulary, consistency, topWords, hourlyUsage, peakHourLabel } = report

  if (newVocabulary.introducedInPeriod > 0) {
    const rate = newVocabulary.adoptionRate
    if (rate != null && rate >= 0.5) {
      insights.push({
        id: 'adoption-strong',
        text: `${newVocabulary.adoptedCount} de ${newVocabulary.introducedInPeriod} palabras nuevas del periodo ya se usaron — buena señal de adopción. Puedes reforzarlas dejándolas visibles en el tablero.`,
      })
    } else if (rate != null && rate < 0.3) {
      insights.push({
        id: 'adoption-weak',
        text: `Hay ${newVocabulary.introducedInPeriod} palabras nuevas con poca adopción. Prueba colocarlas en posiciones más accesibles o usarlas tú primero en frases modelo.`,
      })
    }
  }

  if (consistency.consistencyRatioDelta != null && consistency.consistencyRatioDelta < -0.15) {
    insights.push({
      id: 'consistency-drop',
      text: 'La constancia de uso bajó respecto al periodo anterior. Un ritmo irregular es habitual; conviene observar si coincide con cambios de rutina o del tablero.',
    })
  } else if (consistency.consistencyRatio >= 0.5 && consistency.activeDays >= 3) {
    insights.push({
      id: 'consistency-good',
      text: `Uso en ${consistency.activeDays} de ${consistency.totalDays} días del periodo (${pct(consistency.consistencyRatio)}). Un patrón regular facilita consolidar vocabulario.`,
    })
  }

  if (peakHourLabel && hourlyUsage.some((b) => b.count > 0)) {
    insights.push({
      id: 'peak-hours',
      text: `El pico de actividad cae en ${peakHourLabel.toLowerCase()}. Puedes preparar el tablero con vocabulario relevante para esas franjas.`,
    })
  }

  if (topWords.length >= 3) {
    const top3 = topWords.slice(0, 3).map((w) => w.label)
    insights.push({
      id: 'top-words',
      text: `Las palabras más usadas son «${top3.join('», «')}». Considera ampliar variantes o frases alrededor de ese núcleo comunicativo.`,
    })
  }

  if (insights.length === 0) {
    insights.push({
      id: 'empty',
      text: 'Aún hay pocos datos en este periodo. Cuando haya más uso, aquí aparecerán lecturas orientativas sobre vocabulario y rutinas.',
    })
  }

  return insights.slice(0, 4)
}

export function emptyNewVocabulary(): NewVocabularySummary {
  return {
    introducedInPeriod: 0,
    adoptedCount: 0,
    adoptionRate: null,
    recentWords: [],
  }
}

export function emptyConsistency(totalDays: number): UsageConsistencyStats {
  return {
    activeDays: 0,
    totalDays,
    consistencyRatio: 0,
    distinctSessions: 0,
    activeDaysDelta: null,
    consistencyRatioDelta: null,
  }
}

/** Expande tokens de enunciados para enriquecer vocabulario activo. */
export function utteranceTokensToVocabRows(
  symbolsUsed: UtteranceSymbolUsed[],
): Array<{ symbolId: string | null; lexemeId: string | null; label: string }> {
  return symbolsUsed
    .filter((s) => s.label?.trim())
    .map((s) => ({
      symbolId: s.id.startsWith('kbd:') ? null : s.id,
      lexemeId: s.lexemeId ?? null,
      label: s.label.trim(),
    }))
}
