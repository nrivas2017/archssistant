import { Request, Response, NextFunction } from "express";

/**
 * @function requestLogger
 * @description Middleware para registrar información detallada de cada request.
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función para pasar el control al siguiente middleware.
 */
const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime();

  // Escucha el evento 'finish' cuando la respuesta ha sido enviada completamente
  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);

    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2); // Duración en milisegundos con dos decimales

    const clientIp: string | undefined = req.ip || req.connection.remoteAddress;
    const method: string = req.method;
    const url: string = req.originalUrl;
    const statusCode: number = res.statusCode;

    // Formato del log: [TIMESTAMP] [IP] [METODO] [URL] [STATUS] [DURACION ms]
    console.log(
      `[${new Date().toISOString()}] ${clientIp} ${method} ${url} ${statusCode} ${durationMs}ms`
    );
  });

  next();
};

export default requestLogger;
