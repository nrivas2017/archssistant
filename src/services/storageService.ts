import fs from "fs";
import path from "path";
import { UserHistories } from "../types/chat";

/**
 * @constant STORAGE_FILE_PATH
 * @description Ruta completa al archivo JSON donde se almacena el historial de usuarios.
 * Asume que 'storage.json' está en la raíz del proyecto.
 * Si 'storageService.ts' está en 'src/services/',
 * y se compila a 'dist/services/storageService.js',
 * entonces '__dirname' será 'dist/services'.
 * Por lo tanto, necesitamos retroceder dos niveles ('../..') para llegar a la raíz.
 */
const STORAGE_FILE_PATH: string = path.join(
  __dirname,
  "..",
  "..",
  "storage.json"
);

/**
 * @function readStorage
 * @description Lee el contenido del archivo de almacenamiento y lo parsea como JSON.
 * Si el archivo no existe o hay un error de parseo, devuelve un objeto vacío.
 * @returns {UserHistories} Un objeto que representa el historial de todos los usuarios.
 */
const readStorage = (): UserHistories => {
  if (fs.existsSync(STORAGE_FILE_PATH)) {
    try {
      const data: string = fs.readFileSync(STORAGE_FILE_PATH, "utf8");
      return JSON.parse(data);
    } catch (parseError) {
      console.error(
        "Error al parsear storage.json, iniciando historial vacío:",
        parseError
      );
      return {};
    }
  }
  return {};
};

/**
 * @function writeStorage
 * @description Escribe el historial de usuarios proporcionado en el archivo de almacenamiento.
 * El contenido se formatea como JSON con indentación de 2 espacios.
 * @param {UserHistories} data - El objeto con el historial de usuarios a guardar.
 */
const writeStorage = (data: UserHistories): void => {
  try {
    const jsonData: string = JSON.stringify(data, null, 2);
    fs.writeFileSync(STORAGE_FILE_PATH, jsonData, "utf8");
  } catch (error: any) {
    console.error(
      `Error al escribir en el archivo de almacenamiento: ${error.message}`
    );
    throw error;
  }
};

export { readStorage, writeStorage };
