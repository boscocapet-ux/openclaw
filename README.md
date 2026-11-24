# OpenClaw · Bosco

Mi sistema de IA personal, construido en la Academia Catalizadora (*Claude Code: De Cero a Operador*).
Este repo es la **versión pública de demostración**: misma arquitectura, sin datos personales. El sistema real con mi memoria y mis briefings vive en un repo privado.

## Las 4 piezas

| Pieza | Qué uso |
|---|---|
| **Memoria** | `CLAUDE.md` (global y por proyecto) + Mem0 |
| **Herramientas** | MCP (Gmail, Calendar, Supabase, GitHub, fetch, filesystem, Mem0) + edge functions en Supabase |
| **Automatización** | GitHub Actions con cron (este workflow) + hook Stop de Claude Code |
| **Canal de salida** | Correo (issue de GitHub) y bot de WhatsApp (Twilio) |

## Cómo funciona

`agents/orchestrator.mjs` corre **3 subagentes en paralelo** (carrera, negocio y mi día) con `Promise.allSettled`, y un **sintetizador** une sus reportes en un briefing. Cada corrida queda en `memory/log.md` y `status.json`.

- Corre solo: lunes a viernes, 6:30 am CDMX (`.github/workflows/openclaw.yml`).
- En local: `cp .env.example .env`, pon tu llave y `npm run orquesta`.
