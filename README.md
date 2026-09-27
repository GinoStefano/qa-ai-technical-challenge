# QA AI RAG Evaluator

Automatización y evaluación de calidad para un agente conversacional RAG. El framework valida respuestas fundamentadas, controles de fallback y resistencia básica ante solicitudes fuera de alcance.

## Enlace del Agente

[Probar el agente manualmente](https://udify.app/chat/8UN3JscoL6ZEOd95)

## Arquitectura y Stack

Playwright Test ejecuta las pruebas de API mediante su contexto `request`. Los escenarios se describen con Gherkin usando `playwright-bdd`; TypeScript implementa los steps, carga los casos de `data/` y valida respuestas y contexto recuperado. El agente está desplegado en Dify RAG y conectado a Gemini 3.6 Flash.

## Requisitos Previos y .env

- Node.js 20 o superior y npm.
- Acceso al endpoint de Dify y una clave de API.
- Archivo local `.env` con `DIFY_API_KEY` es opcional.

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