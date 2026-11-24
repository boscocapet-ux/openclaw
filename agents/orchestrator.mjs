// OpenClaw · versión pública de demostración
// Misma arquitectura que mi sistema real (privado), sin datos personales:
//   3 subagentes en paralelo (Promise.allSettled) → sintetizador → registro de ejecución
//
// En modo demo NO usa memoria personal ni imprime el briefing en los logs públicos:
// solo deja constancia de que corrió (memory/log.md y status.json).

import Anthropic from "@anthropic-ai/sdk";
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const linea of readFileSync(".env", "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ Falta ANTHROPIC_API_KEY");
  process.exit(1);
}

const claude = new Anthropic();
const MODEL = "claude-haiku-5-5";
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

// Perfil genérico de ejemplo (el real vive en el repo privado)
const PERFIL = "Una persona de la CDMX que busca trabajo en finanzas y tiene una pequeña repostería.";

const SUBAGENTES = [
  { nombre: "carrera", prompt: "Eres coach de carrera. Da 2 acciones concretas de búsqueda de trabajo para hoy. Máximo 4 líneas." },
  { nombre: "negocio", prompt: "Eres gerente de una repostería pequeña. Da 1 idea de historia de Instagram y 1 acción de ventas para hoy. Máximo 4 líneas." },
  { nombre: "mi-dia", prompt: "Eres asistente personal. Da 1 plan de ejercicio corto y 1 bloque de aprendizaje para hoy. Máximo 4 líneas." },
];

async function correr({ nombre, prompt }) {
  const t0 = Date.now();
  const res = await claude.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: `${prompt}\nPerfil: ${PERFIL}\nResponde en español.`,
    messages: [{ role: "user", content: "Dame tu parte del briefing de hoy." }],
  });
  const texto = res.content.map((c) => c.text ?? "").join("").trim();
  if (!texto) throw new Error("respuesta vacía");
  log(`✅ ${nombre}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return { nombre, texto };
}

const t0 = Date.now();
log("🎼 OpenClaw (demo pública)");
const resultados = await Promise.allSettled(SUBAGENTES.map(correr));
const partes = resultados.filter((r) => r.status === "fulfilled").map((r) => r.value);
resultados.forEach((r, i) => r.status === "rejected" && log(`❌ ${SUBAGENTES[i].nombre}: ${r.reason?.message}`));
if (partes.length === 0) process.exit(1);

const sintesis = await claude.messages.create({
  model: MODEL,
  max_tokens: 500,
  system: "Une estos reportes en un briefing corto en Markdown con un checklist de máximo 5 casillas. En español.",
  messages: [{ role: "user", content: partes.map((p) => `### ${p.nombre}\n${p.texto}`).join("\n\n") }],
});
const briefing = sintesis.content.map((c) => c.text ?? "").join("").trim();
const segundos = ((Date.now() - t0) / 1000).toFixed(1);
log(`📄 Briefing de demo generado (${briefing.length} caracteres) en ${segundos} s`);

// Registro de ejecución
mkdirSync("memory", { recursive: true });
if (!existsSync("memory/log.md")) writeFileSync("memory/log.md", "# Registro de ejecución\n\n| Fecha (UTC) | Subagentes OK | Duración |\n|---|---|---|\n");
const ahora = new Date().toISOString();
appendFileSync("memory/log.md", `| ${ahora.slice(0, 16).replace("T", " ")} | ${partes.length}/${SUBAGENTES.length} | ${segundos} s |\n`);
writeFileSync("status.json", JSON.stringify({ last_run: ahora, ok: partes.length === SUBAGENTES.length, subagentes_ok: partes.length, duracion_s: Number(segundos) }, null, 2) + "\n");
log("🗂️ status.json y memory/log.md actualizados");
