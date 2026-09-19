---
description: Evalúa una idea de negocio, un nicho o un servicio nuevo con datos reales y una decisión clara
---

Evalúa esta oportunidad para LeoVisual.nl: $ARGUMENTS

## Proceso

### 1. Investigar

Lanza al agente `investigador`. Necesitas datos reales, no intuiciones:

- ¿Hay demanda? ¿Qué señales lo demuestran?
- ¿Quién compite ya y qué cobra?
- ¿Cuál es el rango de precios actual del mercado?
- ¿Qué hace falta para entrar?
- ¿Hay recurrencia posible o es venta única?

Si no encuentra datos suficientes, eso ya es un hallazgo: un mercado sin huella
digital suele ser un mercado sin presupuesto digital.

### 2. Decidir

Lanza al agente `estratega` con los hallazgos. Puntuación de los diez ejes,
cálculo de beneficio real, prioridad P0 a P4 y recomendación.

### 3. Diseñar la prueba

Si la recomendación es seguir, define el experimento más barato que valida o
tumba la idea:

```
Hipótesis:        <qué creemos que es cierto>
Prueba:           <qué se hace exactamente>
Coste:            <euros y horas>
Duración:         <días>
Señal de éxito:   <número concreto>
Señal de fracaso: <número concreto>
Si funciona:      <siguiente paso>
Si falla:         <qué se aprende y qué se prueba después>
```

Una prueba sin señal de fracaso definida no es una prueba: es una excusa para
seguir gastando.

## Formato de salida

```
## Veredicto en una línea
ADELANTE · PROBAR PRIMERO · DESCARTAR — <por qué>

## Lo que sabemos
DATOS VERIFICADOS · INFERENCIAS · HIPÓTESIS

## Evaluación
<tabla de los diez ejes>

## Beneficio real
<el cálculo completo>

## Prioridad
P<n> — <defensa en una línea>

## La prueba
<el experimento, si procede>

## Qué desplaza
<a qué le quita horas esto y si compensa>

## Siguiente acción
```

## Reglas

- Sin datos reales no hay veredicto. Si el investigador no encuentra nada, la
  respuesta es "no se puede evaluar todavía" más qué averiguar primero.
- El coste en horas de Leo entra siempre en el cálculo. Su tiempo no es gratis.
- Si es un P4 que compite con un P0, dilo aunque la idea sea buena. El momento
  importa tanto como la idea.
- Descartar rápido es un resultado valioso. Un "no" en dos horas vale más que un
  "quizá" en tres semanas.
