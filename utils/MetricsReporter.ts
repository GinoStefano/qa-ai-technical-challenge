import type { FullResult, Reporter, TestCase, TestResult, TestStatus } from '@playwright/test/reporter';

const METRICS_ANNOTATION = 'rag-evaluation-metrics';
const CONTEXT_CATEGORIES = new Set(['Grounding', 'Consistencia']);

type EvaluationMetricsAnnotation = {
  category: string;
  isFallback: boolean;
  retrievedContextCount: number;
};

type TestMetric = EvaluationMetricsAnnotation & {
  status: TestStatus;
  duration: number;
};

export default class MetricsReporter implements Reporter {
  private readonly metricsByTestId = new Map<string, TestMetric>();

  onTestEnd(test: TestCase, result: TestResult): void {
    const annotation = result.annotations.find((item) => item.type === METRICS_ANNOTATION);
    const evaluation = parseAnnotation(annotation?.description);
    if (!evaluation) {
      return;
    }

    this.metricsByTestId.set(test.id, {
      ...evaluation,
      status: result.status,
      duration: result.duration,
    });
  }

  onEnd(_result: FullResult): void {
    const metrics = [...this.metricsByTestId.values()];
    if (metrics.length === 0) {
      console.log('\nMétricas RAG: no se encontraron pruebas con anotaciones de evaluación.');
      return;
    }

    const passedCount = metrics.filter((metric) => metric.status === 'passed').length;
    const fallbackCount = metrics.filter((metric) => metric.isFallback).length;
    const contextMetrics = metrics.filter((metric) => CONTEXT_CATEGORIES.has(metric.category));
    const usefulEvidenceCount = contextMetrics.filter((metric) => metric.retrievedContextCount > 0).length;
    const durations = metrics.map((metric) => metric.duration).sort((left, right) => left - right);
    const averageDuration = durations.reduce((total, duration) => total + duration, 0) / durations.length;
    const p95Duration = percentile(durations, 0.95);

    console.log('\nResumen de métricas RAG');
    console.table([
      { Métrica: 'Tasa de acierto', Valor: formatPercentage(passedCount, metrics.length) },
      { Métrica: 'Tasa de fallback', Valor: formatPercentage(fallbackCount, metrics.length) },
      {
        Métrica: 'Respuestas con evidencia útil (Grounding/Consistencia)',
        Valor: contextMetrics.length > 0 ? formatPercentage(usefulEvidenceCount, contextMetrics.length) : 'N/A',
      },
      { Métrica: 'Latencia promedio', Valor: `${averageDuration.toFixed(2)} ms` },
      { Métrica: 'Latencia p95 (interpolado)', Valor: `${p95Duration.toFixed(2)} ms` },
      { Métrica: 'Pruebas evaluadas', Valor: String(metrics.length) },
    ]);
  }
}

function parseAnnotation(value?: string): EvaluationMetricsAnnotation | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'category' in parsed &&
      typeof parsed.category === 'string' &&
      'isFallback' in parsed &&
      typeof parsed.isFallback === 'boolean' &&
      'retrievedContextCount' in parsed &&
      typeof parsed.retrievedContextCount === 'number'
    ) {
      return {
        category: parsed.category,
        isFallback: parsed.isFallback,
        retrievedContextCount: parsed.retrievedContextCount,
      };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function formatPercentage(numerator: number, denominator: number): string {
  return denominator === 0 ? 'N/A' : `${((numerator / denominator) * 100).toFixed(2)}%`;
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const rank = (sortedValues.length - 1) * percentileValue;
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const fraction = rank - lowerIndex;

  return sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * fraction;
}