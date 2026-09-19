---
name: propuesta
description: Redacta una propuesta comercial cerrada para un cliente concreto, con entregables, plazo, precio y reducción de riesgo. Úsala cuando haya que enviar un presupuesto, cerrar una venta, responder a alguien interesado o convertir una conversación en un documento que se pueda firmar.
---

# Propuesta comercial

Convierte una conversación en un documento que el cliente puede aceptar sin
hacer más preguntas.

Esto es **P0**. Una propuesta que tarda tres días en salir pierde contra una que
sale el mismo día.

## Lo que necesitas

| Dato | Si falta |
|---|---|
| Quién es el cliente y a qué se dedica | Pregunta, es imprescindible |
| Qué problema tiene, **en sus palabras** | Pregunta, es imprescindible |
| Qué servicio se le vende | Pregunta |
| Precio | Mira CLAUDE.md; si no está, **pregunta y no inventes** |
| Plazo | Mira CLAUDE.md; si no está, pregunta |
| Qué ha probado antes | Opcional, pero ayuda mucho |

> **Regla absoluta, y distingue bien los dos casos:**
>
> - **En el documento que va al cliente:** un precio, un plazo o un resultado que
>   no esté en `CLAUDE.md` ni te lo haya dado el usuario se escribe
>   `[RELLENAR: precio]`. Nunca una cifra estimada, ni siquiera marcada como
>   tal. El documento sale del ordenador y la etiqueta se pierde por el camino.
> - **En la nota interna para Leo:** ahí sí puedes estimar, y debes hacerlo para
>   que tenga una referencia. Va en un bloque aparte, encabezado
>   `ESTIMACIÓN INTERNA — NO ENVIAR`, con el razonamiento y la fuente del rango.
>
> Y en las dos, avisa arriba de qué campos faltan en `CLAUDE.md` para cerrar el
> número de verdad.

## Estructura

### 1. El problema, en las palabras del cliente

Abre demostrando que le has entendido, no hablando de ti. Si el cliente dijo
"mis fotos no venden", eso es lo que abre la propuesta.

### 2. El resultado

Qué tendrá cuando esto termine. En concreto y en su negocio, no en tu jerga.

### 3. Entregables

Lista numerada de cosas contables. "Contenido para redes" no es un entregable.
"12 vídeos verticales de 15 a 30 segundos, en formato 9:16, entregados en MP4"
sí lo es.

### 4. Cómo funciona

Tres o cuatro fases con lo que pasa en cada una y qué necesitas del cliente. Que
vea el proceso reduce su miedo a lo desconocido.

### 5. Plazo

Fecha de entrega, no "dos o tres semanas". Y qué la retrasaría, normalmente que
el cliente tarde en aprobar.

### 6. Precio

Una cifra. Sin desglose por horas: el desglose invita a regatear línea por
línea. Si hay opciones, máximo dos, nunca tres.

Incluye siempre: qué incluye, qué no incluye, cuántas revisiones y forma de pago.

### 7. Reducción de riesgo

**Esto es lo que cierra la venta.** El cliente no duda de tu talento, duda de
perder su dinero. Elige lo que aplique:

- Precio cerrado, sin sorpresas.
- Número de revisiones definido.
- Pago dividido, parte al inicio y parte a la entrega.
- Un primer entregable pequeño antes de comprometerse al total.
- Qué pasa si no le gusta.

### 8. Una sola llamada a la acción

"Responde a este correo con un sí y empezamos el lunes." Nada de "quedo a tu
disposición para cualquier consulta".

## Proceso

1. Reúne los datos. Lo que falte, pregúntalo todo junto en una tanda.
2. Si el cliente es una empresa que no conoces, lanza al `investigador` para ver
   su web, su producto y su competencia. Una propuesta que demuestra que has
   mirado su negocio gana a una plantilla.
3. Pasa el contenido al `redactor`.
4. Pasa el resultado al `revisor`. **Este paso no se salta.** Un precio mal
   calculado o un dato inventado en una propuesta cuesta dinero o credibilidad.
5. Entrega el documento y, aparte, el cálculo de margen para Leo.

## Dos salidas, no una

**Para el cliente:** la propuesta limpia, sin cálculos internos y sin ninguna
cifra estimada. Lo que falte va como `[RELLENAR]`.

**Para Leo:** aparte, bajo el encabezado `ESTIMACIÓN INTERNA — NO ENVIAR`:

```
Precio:                    X €
Horas estimadas:           N h
Coste por hora de Leo:     Y €/h   (de CLAUDE.md)
Costes directos:           Z €
─────────────────────────────────
Beneficio real:            (X − Z − N×Y) €
Margen:                    %
¿Supera el margen mínimo?  sí / no
```

Si el margen no llega al mínimo de CLAUDE.md, **dilo antes de enviar nada** y
propón: subir precio, recortar alcance o rechazar el encargo. Un cliente que no
deja margen ocupa el sitio de uno que sí.
