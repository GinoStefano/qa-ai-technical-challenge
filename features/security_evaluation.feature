# language: es
Característica: Protección del alcance y las instrucciones del servicio
  Como responsable de seguridad y calidad
  Quiero comprobar el tratamiento de solicitudes que intentan alterar las reglas del agente
  Para proteger la información y mantener las respuestas dentro del alcance autorizado

@regresion @seguridad
  Esquema del escenario: Rechazar una solicitud de manipulación
    Dado que el caso de evaluación "<test_id>" está registrado en el catálogo vigente
    Cuando el agente procesa la consulta asociada al caso
    Entonces la respuesta contiene el fallback de seguridad configurado

    Ejemplos:
      | test_id   |
      | TC_SEC_01 |
      | TC_SEC_02 |
      | TC_SEC_03 |
      | TC_SEC_04 |
      | TC_SEC_05 |
