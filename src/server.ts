import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import "dotenv/config";
import cookieParser from "cookie-parser";

import requestLogger from "./middlewares/requestLogger";
import * as storageService from "./services/storageService";
import * as geminiService from "./services/geminiService";

import { ChatMessage, UserHistories, RequestBody } from "./types/chat";

const app = express();

// Middlewares globales
app.use(requestLogger);
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(cookieParser());

const SERVER = process.env.SERVER ?? "localhost";
const PORT = parseInt(process.env.PORT ?? "3000", 10);

/**
 * @route POST /archssistant
 * @description Interacción con Gemini.
 * @param {Request<any, any, RequestBody>} req - Request de Express
 * @param {Response} res - Respuesta de Express
 */
app.post(
  "/archssistant",
  async (req: Request<any, any, RequestBody>, res: Response) => {
    const { message } = req.body;
    const sessionId: string | undefined = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        error:
          "No se proporcionó un sessionId. Por favor, asegúrese de que las cookies estén habilitadas.",
      });
    }

    if (!message || message.trim() === "") {
      return res
        .status(400)
        .json({ error: "El mensaje no puede estar vacío." });
    }

    try {
      let allHistories: UserHistories = storageService.readStorage();
      let history: ChatMessage[] = allHistories[sessionId] || [];

      const reply: string = await geminiService.getGeminiResponse(
        history,
        message
      );

      history.push({
        role: "user",
        question: message,
        timestamp: new Date().toISOString(),
      });
      history.push({
        role: "model",
        answer: reply,
        timestamp: new Date().toISOString(),
      });
      allHistories[sessionId] = history;
      storageService.writeStorage(allHistories);

      res.json({ reply });
    } catch (error: any) {
      console.error(
        "Error al procesar la solicitud del asistente:",
        error.message
      );

      if (
        error.message.includes("Falta la clave de API") ||
        error.message.includes("Falta la URL de la API")
      ) {
        return res.status(500).json({ error: error.message });
      }
      if (error.message.includes("bloqueada por las políticas de seguridad")) {
        return res.status(400).json({ error: error.message });
      }

      res
        .status(500)
        .json({ error: "Hubo un error interno al procesar tu solicitud." });
    }
  }
);

/**
 * @route GET /history
 * @description Hstorial de chat de una sesión.
 * @param {Request} req - Request de Express
 * @param {Response} res - Respuesta de Express
 */
app.get("/history", (req: Request, res: Response) => {
  const sessionId: string | undefined = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(400).json({ error: "No se proporcionó un sessionId." });
  }

  const allHistories: UserHistories = storageService.readStorage();
  const userHistory: ChatMessage[] = allHistories[sessionId] || [];

  res.json(userHistory);
});

/**
 * @route GET *
 * @description Para cualquier otra request, tmb redirecciona al index.html.
 * @param {Request} _ - Request de Express
 * @param {Response} res - Respuesta de Express
 */
app.get("*", (_: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

/**
 * @middleware Rutas no encontradas
 * @description Middleware que se ejecuta para cualquier solicitud que no coincida con una ruta definida.
 * @param {Request} _ - Request de Express
 * @param {Response} res - Respuesta de Express
 */
app.use((_: Request, res: Response) => {
  res.status(404).json({
    error: "La ruta no existe. Asegúrate de acceder al puerto principal.",
  });
});

/**
 * @description Inicia server
 */
app.listen(PORT, () => {
  console.log(`ArchAssistant iniciado en http://${SERVER}:${PORT}`);
});
