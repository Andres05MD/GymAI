import Groq from "groq-sdk";

// Inicializar cliente solo si hay API Key (evita errores en build time si falta variable)
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy_key",
});

export const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not defined in environment variables");
    }
    return groq;
};
