document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const messagesDiv = document.getElementById("messages");
  const loadingIndicator = document.getElementById("loadingIndicator");

  /**
   * @function addMessage
   * @description Añade un nuevo mensaje al contenedor de mensajes en la interfaz de usuario.
   * @param {string} text - El contenido del mensaje.
   * @param {'user' | 'assistant'} sender - El remitente del mensaje ('user' o 'assistant').
   * @returns {void}
   */
  const addMessage = (text, sender) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${sender}-message`);

    if (sender === "assistant") {
      messageElement.innerHTML = marked.parse(text); // Markdown
    } else {
      messageElement.textContent = text;
    }

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll al final
  };

  /**
   * @function showLoadingIndicator
   * @description Muestra el Loader y realiza auto-scroll.
   * @returns {void}
   */
  const showLoadingIndicator = () => {
    loadingIndicator.classList.remove("hidden");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  /**
   * @function hideLoadingIndicator
   * @description Oculta el loader
   * @returns {void}
   */
  const hideLoadingIndicator = () => {
    loadingIndicator.classList.add("hidden");
  };

  /**
   * @function generateUUID
   * @description Genera un identificador único universal (UUID) v4.
   * @returns {string} El UUID generado.
   */
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  /**
   * @function getCookie
   * @description Obtiene el valor de una cookie por su nombre.
   * @param {string} name - El nombre de la cookie a buscar.
   * @returns {string | null} El valor de la cookie si se encuentra, de lo contrario, null.
   */
  const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  /**
   * @function setCookie
   * @description Establece o actualiza el valor de una cookie.
   * @param {string} name - El nombre de la cookie.
   * @param {string} value - El valor a asignar a la cookie.
   * @param {number} [days] - Número opcional de días hasta que la cookie expire.
   * @returns {void}
   */
  const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  };

  // Obtener o generar el sessionId
  let sessionId = getCookie("sessionId");
  if (!sessionId) {
    sessionId = generateUUID();
    setCookie("sessionId", sessionId, 30);
    console.log("Nuevo sessionId generado:", sessionId);
  } else {
    console.log("sessionId existente:", sessionId);
  }

  /**
   * @typedef {object} ChatHistoryMessage
   * @description Resultado desde el servidor
   * @property {string} role - Rol del interlocutor ('user' o 'model').
   * @property {string} [question] - Pregunta del usuario (si el rol es 'user').
   * @property {string} [answer] - Respuesta del modelo (si el rol es 'model').
   * @property {string} timestamp - Marca de tiempo del mensaje.
   */

  /**
   * @function loadConversationHistory
   * @description Carga el historial de conversación del usuario desde el servidor y lo muestra en la interfaz.
   * @returns {Promise<void>}
   */
  const loadConversationHistory = async () => {
    try {
      const response = await fetch("/history");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      /** @type {ChatHistoryMessage[]} */
      const history = await response.json();

      if (history.length > 0) {
        history.forEach((msg) => {
          addMessage(
            msg.answer || msg.question || "",
            msg.role === "model" ? "assistant" : "user"
          );
        });
      } else {
        // Mensaje de bienvenida si el historial está vacío
        addMessage(
          "¡Hola! Soy ArchAssistant, tu asistente especializado en arquitecturas de software. ¿En qué puedo ayudarte hoy?",
          "assistant"
        );
      }
    } catch (error) {
      console.error("Error al cargar el historial de conversación:", error);
      addMessage(
        "Lo siento, no pude cargar el historial de conversación. ¡Comencemos uno nuevo!",
        "assistant"
      );
    }
  };

  /**
   * @function sendMessage
   * @description Envía el mensaje del usuario al servidor, muestra la respuesta de Gemini
   * @returns {Promise<void>}
   */
  const sendMessage = async () => {
    const message = userInput.value.trim();
    if (message === "") return;

    addMessage(message, "user");
    userInput.value = "";
    userInput.disabled = true;
    sendButton.disabled = true;

    showLoadingIndicator();

    try {
      const response = await fetch("/archssistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message }),
      });

      const data = await response.json();

      if (response.ok) {
        addMessage(
          data.reply || "No hubo respuesta del asistente.",
          "assistant"
        );
      } else {
        addMessage(
          `Error: ${
            data.error || "No se pudo obtener respuesta del asistente."
          }`,
          "assistant"
        );
      }
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      addMessage(
        "Lo siento, hubo un problema al comunicarme con el asistente.",
        "assistant"
      );
    } finally {
      hideLoadingIndicator();
      userInput.disabled = false;
      sendButton.disabled = false;
      userInput.focus();
    }
  };

  // listener para el botón de enviar
  sendButton.addEventListener("click", sendMessage);

  // listener para la tecla Enter
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  loadConversationHistory();
});
