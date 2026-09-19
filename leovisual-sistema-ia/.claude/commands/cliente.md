---
description: Flujo completo de un cliente nuevo, desde la investigación hasta la propuesta lista para enviar
---

Alta de cliente nuevo para LeoVisual.nl.

Datos que da el usuario: $ARGUMENTS

## Proceso

Ejecuta las cuatro fases en orden. No saltes ninguna.

### Fase 1 · Investigar

Lanza al agente `investigador` sobre el cliente. Averigua:

- Qué vende exactamente y a quién
- Cómo es su presencia digital hoy: web, redes, ficha de Google
- Quién compite con él y qué hacen mejor
- Señales de capacidad de pago
- Quién decide y cómo se llega a esa persona

Si el usuario ya aportó estos datos, no los busques otra vez.

### Fase 2 · Auditar

Aplica la habilidad `auditoria-web`. Saca **cinco hallazgos concretos**, cada
uno con dónde está, qué impacto tiene y cuánto cuesta arreglarlo.

De esos cinco sale el argumento comercial. Sin hallazgos reales no hay
conversación real.

### Fase 3 · Decidir

Lanza al agente `estratega`:

- ¿Este cliente encaja con lo que vende LeoVisual.nl?
- ¿Qué servicio concreto se le ofrece? Uno solo.
- ¿Qué precio y qué margen deja? Con los datos de CLAUDE.md.
- ¿Merece la pena? Si no, dilo y explica por qué.

**Si el estratega dice que no merece la pena, para aquí.** Un cliente malo
ocupa el sitio de uno bueno.

### Fase 4 · Proponer

Aplica la habilidad `propuesta`. Después pasa el resultado al agente `revisor`.

## Entregable

```
## Ficha del cliente
Empresa · sector · tamaño · web · contacto · quién decide

## Los cinco hallazgos
<de la auditoría, ordenados por impacto>

## Recomendación
Servicio: <uno>
Precio: <cifra o RELLENAR>
Margen: <cálculo>
Encaja: sí / no — <por qué>

## Primer mensaje
<listo para enviar, máximo 120 palabras>

## Propuesta
<documento completo, solo si el cliente ya mostró interés>

## Siguiente acción
<qué hace Leo ahora mismo>
```

## Reglas

- Ningún dato del cliente sin verificar. Lo que no encuentres, márcalo.
- Si no hay precio en CLAUDE.md, deja `[RELLENAR]` y avisa arriba.
- Un servicio por propuesta. El menú de opciones retrasa la decisión.
