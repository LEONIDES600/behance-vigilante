# Sistema de IA de LeoVisual.nl

Un equipo de IA para Claude Code: cuatro especialistas, seis habilidades y tres
comandos que producen entregables reales en lugar de consejos.

Sirve para dos cosas: trabajar en los proyectos de LeoVisual.nl, y **instalarse
en el proyecto de un cliente como producto vendible**.

---

## Qué hay dentro

### Los cuatro especialistas

Se invocan solos cuando hacen falta, o a mano con `usa el agente X`.

| Agente | Para qué |
|---|---|
| **investigador** | Trae datos reales con fuente y fecha. Separa verificado, inferencia e hipótesis. |
| **estratega** | Decide. Puntúa la oportunidad, calcula el margen, asigna prioridad P0 a P4. |
| **redactor** | Escribe lo que lee el cliente, en la voz de LeoVisual.nl. |
| **revisor** | Control de calidad adversarial. Caza datos inventados antes de que salgan. |

El flujo es el que ya usas: **Planificador → Investigador → Ejecutor → Revisor**.

### Las seis habilidades

Se activan solas cuando la conversación las necesita.

| Habilidad | Entregable | Prioridad |
|---|---|---|
| **prospeccion** | Lista de empresas cualificadas con el mensaje ya escrito | P0 |
| **propuesta** | Propuesta cerrada, más el cálculo de margen aparte para ti | P0 |
| **auditoria-web** | Cinco problemas concretos con impacto y arreglo | P0 y P1 |
| **guion-video** | Guion plano a plano listo para rodar o generar | P0 |
| **contenido-social** | Una idea convertida en seis piezas para seis canales | P1 |
| **informe-cliente** | Cierre de proyecto que vende la continuación | P0 |

### Los tres comandos

| Comando | Qué hace |
|---|---|
| `/semana` | Plan semanal con las tres acciones que más acercan a facturar |
| `/cliente <nombre o web>` | Investiga, audita, decide y propone. El flujo completo. |
| `/oportunidad <idea>` | Evalúa un nicho o servicio con datos y da un veredicto |

---

## Instalación

Cópialo a la carpeta del proyecto donde trabajes:

```powershell
# En PowerShell, desde la carpeta del proyecto
xcopy /E /I "ruta\a\leovisual-sistema-ia\.claude" ".claude"
copy "ruta\a\leovisual-sistema-ia\CLAUDE.md" "CLAUDE.md"
```

Luego abre `CLAUDE.md` y **rellena los campos marcados `[RELLENAR]`**. Son
precios, plazos, valor de tu hora y enlaces. Sin ellos el sistema funciona, pero
no puede calcular márgenes ni cerrar propuestas, y te lo dirá cada vez.

Comprueba que carga:

```powershell
claude
/semana
```

> **La primera vez en cada carpeta**, Claude Code pregunta si confías en el
> proyecto. Acepta. Hasta que lo hagas, los permisos de `settings.json` se
> ignoran y verás el aviso `this workspace has not been trusted`. El sistema
> funciona igual, pero te preguntará por cada acción.

---

## Las tres reglas que lo hacen distinto

**1. Nunca inventa datos.** Todo va etiquetado como dato verificado, inferencia
o hipótesis. Un precio, un plazo o un resultado que no esté en `CLAUDE.md` sale
como `[RELLENAR]` y con aviso. Esto no es un detalle: un dato inventado en una
propuesta es un problema legal.

**2. Todo se mide en dinero.** Cada recomendación responde a "¿cómo gana dinero
Leo con esto?" y lleva el cálculo de beneficio real, con tus horas contadas
dentro. Lo que no sale a cuenta, se dice.

**3. El revisor va antes de entregar.** Nada sale hacia un cliente sin pasar por
el control adversarial. Es el paso que más barato sale y más caro cuesta
saltarse.

---

## Cómo venderlo

El mismo sistema, adaptado al negocio del cliente, es un producto:

1. Rellenas un `CLAUDE.md` con **su** contexto: qué vende, a quién, a qué precio.
2. Ajustas las habilidades a **su** proceso.
3. Se lo instalas y le enseñas a usarlo.

El cliente no compra una herramienta ni una suscripción. Compra un equipo que
conoce su negocio y produce trabajo. Eso cambia con qué te comparan: deja de
compararte con un software de 20 euros al mes y pasa a compararte con contratar
a alguien.

---

## Ampliarlo

**Habilidad nueva:** crea `.claude/skills/<nombre>/SKILL.md` con este encabezado:

```markdown
---
name: nombre-en-minusculas
description: Qué hace y cuándo debe activarse. Incluye las palabras que dirías tú al necesitarla.
---
```

La descripción es lo que decide si la habilidad se activa. Escríbela pensando en
cómo lo pedirías en voz alta, no en cómo lo llamarías en un manual.

**Agente nuevo:** crea `.claude/agents/<nombre>.md` con `name`, `description`,
`tools` y `model` en el encabezado.

**Comando nuevo:** crea `.claude/commands/<nombre>.md`. Se invoca con `/nombre` y
recibe lo que escribas después en `$ARGUMENTS`.

---

## Qué falta

Sé honesto contigo mismo sobre esto:

- **Los precios de `CLAUDE.md`.** Sin ellos, media funcionalidad está coja.
- **Un caso de estudio con resultado real.** Es lo que más pesa en una propuesta
  y ahora mismo no lo tienes documentado.
- **Conectores.** Airtable para el registro de clientes, Gmail para enviar las
  tandas de prospección, el calendario para las citas. Con ellos el sistema deja
  de producir texto y empieza a ejecutar.
