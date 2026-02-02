const apiKey = ""; // Deberíamos mover esto a variables de entorno

export const callGemini = async (prompt) => {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );
        if (!response.ok) throw new Error('Error API');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error generando texto.";
    } catch (error) { return "Error de conexión con IA."; }
};
