import { expect } from '@playwright/test';
import { createBdd, test as base } from 'playwright-bdd';
import goldenSet from '../data/golden_set.json' with { type: 'json' };
import securitySet from '../data/security_set.json' with { type: 'json' };
import { API_TIMEOUT_MS, getDifyApiKey } from '../config/env';

type EvaluationCase =
  | (typeof goldenSet.testCases)[number]
  | (typeof securitySet.testCases)[number];

const ALL_TEST_CASES: EvaluationCase[] = [
  ...goldenSet.testCases,
  ...securitySet.testCases,
];

type RetrievedContext = {
  content: string;
  document_name?: string;
  score?: number;
};

type AuditData = {
  test_id: string;
  category: string;
  question: string;
  ground_truth: string;
  expected_context_keywords: string[];
  http_status: number;
  retrieved_context: RetrievedContext[];
  agent_response: string;
  response_error?: string;
};

type EvaluationMetricsAnnotation = {
  category: string;
  isFallback: boolean;
  retrievedContextCount: number;
};

type EvaluationState = {
  testCase?: EvaluationCase;
  audit?: AuditData;
};

type EvaluationFixtures = {
  evaluationState: EvaluationState;
};

export const test = base.extend<EvaluationFixtures>({
  evaluationState: async ({}, use) => {
    await use({});
  },
});

const { Given, When, Then } = createBdd(test);

Given('que el caso de evaluación {string} está registrado en el catálogo vigente', async ({ evaluationState }, testId: string) => {
  const testCase = ALL_TEST_CASES.find((item) => item.id === testId);
  if (!testCase) {
    throw new Error(`No existe el caso ${testId} en los archivos de datos`);
  }

  evaluationState.testCase = testCase;
});

When('el agente procesa la consulta asociada al caso', async ({ request, evaluationState }) => {
  const testCase = requireTestCase(evaluationState);
  const metricsAnnotation: EvaluationMetricsAnnotation = {
    category: testCase.category,
    isFallback: false,
    retrievedContextCount: 0,
  };
  const testInfo = test.info();
  testInfo.annotations.push({
    type: 'rag-evaluation-metrics',
    description: JSON.stringify(metricsAnnotation),
  });

  const response = await request.post('chat-messages', {
    headers: {
      Authorization: `Bearer ${getDifyApiKey()}`,
      'Content-Type': 'application/json',
    },
    data: {
      inputs: {},
      query: testCase.vectors.question,
      response_mode: 'blocking',
      user: process.env.DIFY_USER ?? 'qa-automation',
    },
    timeout: API_TIMEOUT_MS,
  });

  const responseText = await response.text();
  const payload = parseJson(responseText);

  const agentResponse = isRecord(payload) && typeof payload.answer === 'string' ? payload.answer : '';
  const retrievedContext = extractRetrievedContext(payload);
  metricsAnnotation.isFallback = agentResponse.trim() === testCase.vectors.ground_truth;
  metricsAnnotation.retrievedContextCount = retrievedContext.length;
  const annotation = testInfo.annotations.find((item) => item.type === 'rag-evaluation-metrics');
  if (annotation) {
    annotation.description = JSON.stringify(metricsAnnotation);
  }

  const auditData: AuditData = {
    test_id: testCase.id,
    category: testCase.category,
    question: testCase.vectors.question,
    ground_truth: testCase.vectors.ground_truth,
    expected_context_keywords: testCase.vectors.expected_context_keywords,
    http_status: response.status(),
    retrieved_context: retrievedContext,
    agent_response: agentResponse,
    ...(!response.ok() ? { response_error: responseText } : {}),
  };

  evaluationState.audit = auditData;
  await testInfo.attach('Auditoria_RAG', {
    body: JSON.stringify(auditData, null, 2),
    contentType: 'application/json',
  });

  expect(response.ok(), `El endpoint respondió HTTP ${response.status()}: ${responseText}`).toBeTruthy();
  expect(agentResponse.trim(), 'La respuesta del agente no debe estar vacía').not.toBe('');
});

Then('la respuesta satisface el criterio definido para su categoría', async ({ evaluationState }) => {
  const { testCase, auditData } = requireEvaluationData(evaluationState);

  const agentResponse = auditData.agent_response;
  const groundTruth = testCase.vectors.ground_truth;

  if (testCase.category === 'Seguridad' || testCase.category === 'Riesgo_Alucinacion') {
    expect(agentResponse).toContain(groundTruth);
    return;
  }

  const normalizedResponse = agentResponse.toLowerCase();
  for (const keyword of testCase.vectors.expected_context_keywords) {
    expect(normalizedResponse).toContain(keyword.toLowerCase());
  }
});

Then('la respuesta contiene el fallback de seguridad configurado', async ({ evaluationState }) => {
  const { testCase, auditData } = requireEvaluationData(evaluationState);

  expect(testCase.category).toBe('Seguridad');
  expect(auditData.agent_response).toContain(testCase.vectors.ground_truth);
});

function requireTestCase(state: EvaluationState): EvaluationCase {
  if (!state.testCase) {
    throw new Error('El caso de evaluación no se cargó antes de ejecutar la consulta.');
  }

  return state.testCase;
}

function requireEvaluationData(state: EvaluationState): { testCase: EvaluationCase; auditData: AuditData } {
  const testCase = requireTestCase(state);
  if (!state.audit) {
    throw new Error('La respuesta del agente no está disponible para su evaluación.');
  }

  return { testCase, auditData: state.audit };
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractRetrievedContext(payload: unknown): RetrievedContext[] {
  if (!isRecord(payload) || !isRecord(payload.metadata)) {
    return [];
  }

  const resources = payload.metadata.retriever_resources;
  if (!Array.isArray(resources)) {
    return [];
  }

  return resources.flatMap((resource): RetrievedContext[] => {
    if (!isRecord(resource) || typeof resource.content !== 'string') {
      return [];
    }

    return [{
      content: resource.content,
      ...(typeof resource.document_name === 'string' ? { document_name: resource.document_name } : {}),
      ...(typeof resource.score === 'number' ? { score: resource.score } : {}),
    }];
  });
}