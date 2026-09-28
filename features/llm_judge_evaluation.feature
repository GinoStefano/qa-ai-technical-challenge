# language: es
Característica: Evaluación semántica independiente de respuestas RAG
  Como equipo de calidad
  Quiero contrastar las respuestas reales del agente con el golden set
  Para evaluar fidelidad semántica sin exigir coincidencia literal

  @llm
  Esquema del escenario: Evaluar fidelidad semántica de una respuesta RAG
    Dado que el caso "<test_id>" existe en el golden set
    Cuando el agente responde a la consulta del caso
    Entonces el juez LLM asigna una puntuación mínima de 8

    Ejemplos:
      | test_id  |
      | TC_GR_01 |
      | TC_GR_02 |
      | TC_GR_03 |
      | TC_GR_04 |
      | TC_CO_01 |
      | TC_CO_02 |
