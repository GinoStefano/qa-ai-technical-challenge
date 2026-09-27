# language: es
Característica: Confiabilidad de las respuestas sobre ISTQB CTFL
  Como responsable de calidad
  Quiero evaluar las respuestas del servicio con casos de conocimiento aprobados
  Para asegurar que la información entregada sea pertinente y consistente

@regresion
  Esquema del escenario: Responder una consulta sobre fundamentos de pruebas
    Dado que el caso de evaluación "<test_id>" está registrado en el catálogo vigente
    Cuando el agente procesa la consulta asociada al caso
    Entonces la respuesta satisface el criterio definido para su categoría

    Ejemplos:
      | test_id  |
      | TC_GR_01 |
      | TC_GR_02 |
      | TC_GR_03 |
      | TC_GR_04 |
      | TC_CO_01 |
      | TC_CO_02 |
      | TC_CO_03 |
      | TC_CO_04 |
      | TC_CO_05 |
      | TC_RA_01 |
      | TC_RA_02 |
      | TC_RA_03 |
      | TC_RA_04 |
      | TC_RA_05 |
