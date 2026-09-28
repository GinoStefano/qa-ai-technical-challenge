# QA AI RAG Evaluator

Automatización y evaluación de calidad para un agente conversacional RAG. El framework valida respuestas fundamentadas, controles de fallback y resistencia básica ante solicitudes fuera de alcance.

## Enlace del Agente

[Probar el agente manualmente](https://udify.app/chat/8UN3JscoL6ZEOd95)

## Arquitectura y Stack

Playwright Test ejecuta las pruebas de API mediante su contexto `request`. Los escenarios se describen con Gherkin usando `playwright-bdd`; TypeScript implementa los steps, carga los casos de `data/` y valida respuestas y contexto recuperado. El agente está desplegado en Dify RAG y conectado a Gemini 3.6 Flash.

## Requisitos Previos y .env

- Node.js 20 o superior y npm.
- `DIFY_API_KEY` para consultar el agente RAG.
- `GEMINI_API_KEY` para ejecutar la evaluación `LLM-as-a-Judge`.
- `GEMINI_MODEL` selecciona el modelo del juez. Si se omite, el código usa `gemini-2.5-flash`.

Configura estas variables en un archivo `.env` local:

```dotenv
DIFY_API_KEY=tu-clave-de-dify
GEMINI_API_KEY=tu-clave-de-gemini
GEMINI_MODEL=gemini-2.5-flash
```

Por motivos de seguridad, el archivo .env no está en el repositorio. Si eres el evaluador, por favor solicítamelo vía correo electrónico para poder ejecutar las pruebas en local.

## Instalación

```powershell
npm install
npx playwright install
```

## Ejecución

Generar las pruebas Playwright desde Gherkin y ejecutar toda la suite:

```powershell
npx bddgen
npx playwright test
```

Ejecutar únicamente los casos de regresión o de seguridad:

```powershell
npx playwright test --grep "@regresion"
npx playwright test --grep "@seguridad"
```

### Modos de evaluación

- **Keywords/contexto (`@regresion`):** valida las palabras clave esperadas y la evidencia recuperada definidas en los casos de prueba.
- **Juez semántico (`@llm`):** compara la respuesta real del agente con el contexto de referencia y exige una puntuación mínima de 8.

Genera las pruebas BDD cuando cambies los features. Para evaluación por keywords/contexto:

```powershell
npx bddgen
npx playwright test --grep "@regresion"
```

Para evaluación semántica con LLM:

```powershell
npx bddgen
npx playwright test features/llm_judge_evaluation.feature --grep "@llm"
```

Al finalizar la ejecución, Playwright abre automáticamente el reporte HTML con el resultado y los adjuntos de auditoría.

El script `npm test` genera los tests BDD y ejecuta toda la suite. Para validar tipos sin invocar el servicio:

```powershell
npm run typecheck
```

## Integración Continua (CI/CD)

El workflow `.github/workflows/playwright.yml` corre en `push` y `pull_request` dirigidos a `master`. Instala dependencias, genera los tests Gherkin y ejecuta los escenarios etiquetados `@regresion`. La clave `DIFY_API_KEY` se inyecta desde GitHub Secrets y el reporte HTML se publica como artefacto incluso cuando hay fallos.

## Estrategia QA y Hallazgos

**Definition of Done**

- Cada ID del feature existe en el golden set o en el set de seguridad.
- La API devuelve un estado exitoso y una respuesta no vacía.
- Grounding y consistencia incluyen todas las keywords declaradas para el caso.
- Seguridad devuelve una respuesta que contiene el fallback configurado.
- Cada prueba adjunta una auditoría con pregunta, respuesta, estado HTTP y contexto recuperado.
- La suite de regresión pasa y el reporte HTML queda disponible como artefacto de CI.

| Indicador | Cálculo reportado | Interpretación |
|---|---|---|
| Tasa de grounding con evidencia | Casos Grounding/Consistencia con al menos un fragmento recuperado / casos de esas categorías | Mide presencia de contexto recuperado; no es por sí sola una evaluación semántica de relevancia. |
| Tasa de fallback | Casos cuya respuesta normalizada coincide exactamente con el ground truth / casos medidos | Mide la activación del fallback configurado. |
| Latencia | Promedio y p95 de la duración total del test, en milisegundos | Incluye el flujo del test, no solo el tiempo del endpoint. |

**Propuestas de mejora**

- Ajustar y versionar el prompt para mantener respuestas dentro del alcance y hacer consistente el fallback.
- Evaluar tamaños de chunk, solapamiento y metadatos de los PDFs para mejorar recuperación y grounding.
- Complementar keywords y presencia de contexto con evaluación semántica y revisión de casos límite.