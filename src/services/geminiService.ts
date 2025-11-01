import path from "path";
import fs from "fs";

import { ChatMessage } from "../types/chat";
import {
  DecisionParameter,
  Architecture,
  DecisionTableContent,
  GeminiMessage,
  GeminiPayload,
} from "../types/gemini";

const DECISION_TABLE: DecisionTableContent = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "..", "decisionTable.json"),
    "utf8"
  )
);

const GEMINI_API_URL: string | undefined = process.env.AI_URL_RIVAS;
const API_KEY: string | undefined = process.env.AI_KEY_RIVAS;

/**
 * @function buildSystemInstruction
 * @description Construye el promp
 * @returns {string} retorna el promp
 */
const buildSystemInstruction = (): string => {
  let systemInstruction = `Eres ArchAssistant, un asistente experto en arquitecturas de software. Tu objetivo es guiar a los usuarios a través de un proceso de entrevista para entender su problema de software y luego ofrecer una recomendación de arquitectura coherente y contextualizada.

Tienes un profundo conocimiento de los siguientes Parámetros de Decisión y Arquitecturas. Utilizarás esta información para guiar la conversación y realizar tus recomendaciones:

**Parámetros de Decisión (con Discretización y Pesos):**
`;

  DECISION_TABLE.parameters.forEach((param: DecisionParameter) => {
    systemInstruction += `* **${param.name} (Peso ${param.weight}):**\n`;
    for (const [level, desc] of Object.entries(param.discretization)) {
      systemInstruction += `    * ${level}: ${desc}\n`;
    }
  });

  systemInstruction += `\n**Alternativas Arquitecturales y su Adecuación (puntos 1-3 por nivel, multiplicado por peso):**\n`;

  DECISION_TABLE.architectures.forEach((arch: Architecture) => {
    systemInstruction += `* **${arch.name}:** `;
    const scores = Object.entries(arch.scores)
      .map(([param, score]: [string, number]) => {
        const paramObj = DECISION_TABLE.parameters.find(
          (p) => p.name === param
        );
        const weightedScore = score * (paramObj ? paramObj.weight : 0);
        return `${param}(${score}*${
          paramObj ? paramObj.weight : 0
        }=${weightedScore})`;
      })
      .join(", ");
    systemInstruction += `${scores}.\n`;
    systemInstruction += `    * **Recomendación:** ${arch.recommendation}\n`;
  });

  systemInstruction += `\n**Tu proceso y rol:**
1.  **Fase de Entrevista (Pregunta):**
    * Siempre inicia la conversación preguntando por el problema o necesidad del usuario.
    * Antes de iniciar con las preguntas según los parámetros de decisión, asegúrate de conocer muy bien de que trata la necesidad del usuario, los detalles son importantes.
    * Haz preguntas claras, concisas y **enfocadas en obtener información sobre cada uno de los 6 Parámetros de Decisión listados arriba.**
    * Realiza cada pregunta de forma individul, no realices multiples preguntas a la vez.
    * Intenta inferir la discretización (Baja, Media, Alta, etc.) de las respuestas del usuario y, si es necesario, pide aclaración.
    * Si el usuario te da información incompleta para algún parámetro, haz preguntas de seguimiento específicas para ese parámetro.
    * **Mantén tus preguntas estrictamente en el contexto de la arquitectura de software.** Si la pregunta del usuario no tiene relación con este ámbito, recházala amablemente y redirige la conversación hacia la recolección de los parámetros.
    * **NO des una recomendación final de arquitectura hasta que hayas recopilado suficiente información sobre la mayoría de los 6 parámetros.**
    * Tu objetivo es "entrevistar" al usuario para entender su escenario.

2.  **Fase de Recomendación (Responde):**
    * Una vez que consideres que has recopilado suficiente información (idealmente sobre los 6 parámetros, o si la pregunta del usuario es directamente una solicitud de recomendación final), procede a ofrecer una o varias recomendaciones de arquitectura.
    * Tu recomendación debe ser **coherente con el problema formulado y con las respuestas parciales** dadas por el usuario durante la entrevista. Justifica tu elección basándote en la adecuación de la arquitectura a los parámetros del usuario, haciendo referencia a los puntos fuertes (y débiles) de la arquitectura para el contexto dado.
    * **Enriquece la solución (Adicional a gusto):** Incluye **recomendaciones tecnológicas específicas** (ej. frameworks, bases de datos, herramientas) que se alineen con la arquitectura sugerida y los requisitos inferidos del usuario.
    * Indica claramente que esta es tu recomendación final para el problema actual.
    * Si el usuario comienza un nuevo problema, reinicia el ciclo de entrevista.

**Ejemplo de flujo ideal:**
* Usuario: "Necesito una arquitectura para una plataforma de streaming de video."
* Tú: "Claro, ArchAssistant te ayudará. Para entender mejor tu proyecto, cuéntame:
    * 1. ¿Cuántos usuarios esperas manejar (Escalabilidad)? ¿Será un crecimiento lento, moderado o exponencial?
    * 2. ¿Qué nivel de latencia y rendimiento es crítico para el streaming? ¿Necesitas baja latencia en tiempo real o es aceptable una moderada?
    * 3. ¿Cuál es la experiencia técnica de tu equipo con nuevas tecnologías? ¿Baja, media o alta?"
* ... (usuario responde, tú haces más preguntas sobre Costo, Seguridad, Mantenibilidad) ...
* Usuario: "Creo que ya tienes suficiente información. ¿Qué arquitectura me recomiendas?"
* Tú: "Basado en que tu plataforma de streaming requiere [Escalabilidad: Alta] y [Latencia: Baja Latencia Crítica], y asumiendo un [Costo de Infraestructura: Alto] para soportar esto, te recomiendo una **Arquitectura Dirigida por Eventos (EDA) combinada con Microservicios**.
    * **EDA** es ideal para el streaming ya que permite procesar y reaccionar a flujos de datos en tiempo real (ej. eventos de reproducción, métricas de calidad). Esto asegura una [Baja Latencia Crítica].
    * Los **Microservicios** complementan esto permitiendo escalar componentes individuales (ej. servicio de autenticación, servicio de video, servicio de comentarios) de forma independiente para manejar la [Alta Escalabilidad].
    * Para la **Mantenibilidad**, ambos enfoques ofrecen [Alta Mantenibilidad] al promover un bajo acoplamiento. Sin embargo, considera que la [Experiencia del Equipo: Baja] y [Costo de Infraestructura: Bajo] pueden ser un desafío inicial.
    * **Recomendaciones Tecnológicas:** Para una EDA, podrías usar **Kafka o RabbitMQ** para el bus de eventos. Para microservicios, **Docker y Kubernetes** son ideales para la orquestación, y **bases de datos NoSQL** como Cassandra o MongoDB podrían manejar los grandes volúmenes de datos de video. Para el frontend, podrías usar un framework reactivo como **React o Vue.js** con streaming adaptativo (HLS/DASH).
    * Esta es mi recomendación para tu problema actual. ¿Tienes alguna otra pregunta o un nuevo proyecto?"
`;
  return systemInstruction;
};

/**
 * @function getGeminiResponse
 * @description Obtiene una respuesta de Gemini basándose en el historial de conversación y el mensaje actual
 * @param {ChatMessage[]} history - El historial de la conversación con el usuario.
 * @param {string} currentMessage - El mensaje actual del usuario.
 * @returns {Promise<string>} Respuesta de Gemini
 * @throws {Error} Si faltan variables de entorno, hay un error en la API de Gemini
 */
const getGeminiResponse = async (
  history: ChatMessage[],
  currentMessage: string
): Promise<string> => {
  if (!API_KEY) {
    throw new Error(
      "Falta la clave de API (AI_KEY_RIVAS) en las variables de entorno."
    );
  }
  if (!GEMINI_API_URL) {
    throw new Error(
      "Falta la URL de la API de Gemini (AI_URL_RIVAS) en las variables de entorno."
    );
  }

  const systemInstruction: string = buildSystemInstruction();

  const conversationHistoryForGemini: GeminiMessage[] = [];

  conversationHistoryForGemini.push({
    role: "user",
    parts: [{ text: systemInstruction }],
  });
  conversationHistoryForGemini.push({
    role: "model",
    parts: [
      {
        text: "Entendido. ¡Hola! Soy ArchAssistant, tu guía en arquitecturas de software. ¿Cuál es el problema o proyecto que te gustaría explorar hoy?",
      },
    ],
  });

  history.forEach((entry: ChatMessage) => {
    if (entry.role === "user" && entry.question) {
      conversationHistoryForGemini.push({
        role: "user",
        parts: [{ text: entry.question }],
      });
    } else if (entry.role === "model" && entry.answer) {
      conversationHistoryForGemini.push({
        role: "model",
        parts: [{ text: entry.answer }],
      });
    }
  });

  conversationHistoryForGemini.push({
    role: "user",
    parts: [{ text: currentMessage }],
  });

  const payload: GeminiPayload = {
    contents: conversationHistoryForGemini,
    generationConfig: {
      temperature: 0.7, // Aleatoriedad de la respuesta.
      topK: 40, // k-muestras con mayor probabilidad
      topP: 0.95, // subconjunto más pequeño de tokens cuya probabilidad acumulada excede p
      maxOutputTokens: 1024, // número máximo de tokens a generar
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData: any = await response.json();
    const errorText: string = JSON.stringify(errorData, null, 2);
    console.error(
      `Error de la API de Gemini: ${response.status} - ${errorText}`
    );
    if (
      errorData.candidates &&
      errorData.candidates[0] &&
      errorData.candidates[0].finishReason === "SAFETY"
    ) {
      throw new Error(
        "La respuesta fue bloqueada por las políticas de seguridad de la IA. Por favor, reformula tu pregunta."
      );
    }
    throw new Error(
      `Error del servicio de IA: ${response.statusText || errorText}`
    );
  }

  const data: any = await response.json();
  const reply: string =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Error: No se pudo obtener la respuesta del servicio IA.";

  return reply;
};

export { getGeminiResponse };
