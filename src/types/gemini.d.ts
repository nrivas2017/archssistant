/**
 * @interface ParameterDiscretization
 * @description Estructura de los niveles de discretización de un parámetro
 * Nivel (ej. "Baja") y el valor es su descripción
 */
export interface ParameterDiscretization {
  [level: string]: string;
}

/**
 * @interface DecisionParameter
 * @description Estructura de un parámetro de decisión.
 * @property {string} name - Nombre Parámetro (ej. "Escalabilidad")
 * @property {number} weight - Peso Parámetro
 * @property {ParameterDiscretization} discretization - Niveles de discretización del parámetro
 */
export interface DecisionParameter {
  name: string;
  weight: number;
  discretization: ParameterDiscretization;
}

/**
 * @interface ArchitectureScores
 * @description Puntuaciones de una arquitectura para cada parámetro.
 * Nombre del parámetro y el valor es la puntuación.
 */
export interface ArchitectureScores {
  [param: string]: number;
}

/**
 * @interface Architecture
 * @description Estructura de una alternativa arquitectónica.
 * @property {string} name - Nombre arquitectura (ej. "Microservicios").
 * @property {ArchitectureScores} scores - Puntuaciones de la arquitectura para cada parámetro.
 * @property {string} recommendation - Descripción general de la recomendación de la arquitectura.
 */
export interface Architecture {
  name: string;
  scores: ArchitectureScores;
  recommendation: string;
}

/**
 * @interface DecisionTableContent
 * @description Estructura completa del archivo decisionTable.json.
 * @property {DecisionParameter[]} parameters - Array de parámetros de decisión.
 * @property {Architecture[]} architectures - Array de alternativas arquitectónicas.
 */
export interface DecisionTableContent {
  parameters: DecisionParameter[];
  architectures: Architecture[];
}

/**
 * @interface GeminiContentPart
 * @description Parte del contenido en la conversación de Gemini.
 * @property {string} text - El texto de la parte del contenido.
 */
export interface GeminiContentPart {
  text: string;
}

/**
 * @interface GeminiMessage
 * @description Mensaje en la conversación de Gemini, con rol y partes de contenido.
 * @property {'user' | 'model'} role - El rol del remitente del mensaje.
 * @property {GeminiContentPart[]} parts - Array de partes de contenido del mensaje.
 */
export interface GeminiMessage {
  role: "user" | "model";
  parts: GeminiContentPart[];
}

/**
 * @interface GenerationConfig
 * @description Configuración para la generación de la respuesta de Gemini.
 * @property {number} temperature - Controla la aleatoriedad de la respuesta.
 * @property {number} topK - Muestra las k-muestras con mayor probabilidad.
 * @property {number} topP - Muestra el subconjunto más pequeño de tokens cuya probabilidad acumulada excede p.
 * @property {number} maxOutputTokens - El número máximo de tokens a generar.
 */
export interface GenerationConfig {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
}

/**
 * @interface GeminiPayload
 * @description La estructura del cuerpo de la solicitud enviado a la API de Gemini.
 * @property {GeminiMessage[]} contents - El historial de la conversación y el mensaje actual.
 * @property {GenerationConfig} generationConfig - Configuración de generación para la respuesta del modelo.
 */
export interface GeminiPayload {
  contents: GeminiMessage[];
  generationConfig: GenerationConfig;
}
