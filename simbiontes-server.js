// server.js
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Se lee del entorno, nunca hardcodeada
});

app.post("/generar", async (req, res) => {
  const { modo, fragmentos, instrucciones } = req.body;

  const modoBase = {
    filosofico: "Produce un enunciado filosófico sobre simbiontes inspirado en Haraway, Margulis y Maturana. Vocabulario de filosofía de la biología.",
    cientifico: "Produce un enunciado con sintaxis de paper científico sobre biología de simbiontes. Menciona especies reales o mecanismos concretos.",
    poetico: "Produce un aforismo poético sobre simbiontes y coexistencia, evocador y ambiguo, como si un organismo hablara de su relación con otro.",
  };

  // Construir el system prompt combinando modo + fragmentos + instrucciones del usuario
  let system = modoBase[modo] || modoBase.filosofico;

  if (fragmentos && fragmentos.trim().length > 0) {
    system += `\n\nBásate en los siguientes fragmentos de texto como material fuente:\n---\n${fragmentos.trim()}\n---`;
  }

  if (instrucciones && instrucciones.trim().length > 0) {
    system += `\n\nInstrucciones adicionales del curador: ${instrucciones.trim()}`;
  }

  system += "\n\nGenera UN SOLO enunciado breve (1-3 oraciones). Sin preámbulo, sin explicación: solo el enunciado. Escribe en español.";

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: "Genera un nuevo enunciado." }],
    });

    const texto = msg.content.map(b => b.text || "").join("").trim();
    res.json({ texto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al llamar a la API de Anthropic." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
