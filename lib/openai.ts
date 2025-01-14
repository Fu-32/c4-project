// lib/openai.ts
import OpenAI from "openai";

// On s'assure de lire la clé API depuis les variables d'environnement
const configuration = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = configuration;