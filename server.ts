import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialiser le client Gemini de façon paresseuse
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
    if (!aiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("ATTENTION : GEMINI_API_KEY est manquante dans les variables d'environnement.");
        }
        aiClient = new GoogleGenAI({
            apiKey: apiKey || "MOCK_KEY_IF_MISSING_FOR_BOOT",
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }
    return aiClient;
}

// 1. API Route: Chatbot pour Nadjla avec Contexte Métier Réel
app.post("/api/chat", async (req, res) => {
    try {
        const { message, history, dbContext } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Le message est requis." });
        }

        const ai = getAiClient();
        
        // Formuler des instructions système haut de gamme
        const systemInstruction = `
        Tu es l'assistant IA exclusif et chaleureux de la boutique de location "DECO RN ADMIN", gérée par l'administratrice Nadjla.
        Nadjla loue des coffrets de fiançailles haut de gamme (Box Fiancaille), des valises de mariage luxueuses, des accessoires de fête et des décors de mariage à Alger.
        
        Voici l'état actuel de son entreprise en temps réel extrait de sa base locale IndexedDB :
        - Nombre total de clientes enregistrées : ${dbContext?.clientsCount || 0}
        - Nombre total de produits dans le catalogue : ${dbContext?.productsCount || 0}
        - Nombre total de réservations enregistrées : ${dbContext?.ordersCount || 0}
        - Revenus cumulés encaissés : ${dbContext?.totalRevenue?.toLocaleString() || 0} DA
        - Montant restant à recouvrer : ${dbContext?.totalReste?.toLocaleString() || 0} DA
        - Nombre de commandes actuellement en retard : ${dbContext?.lateOrdersCount || 0}
        
        Voici quelques exemples de ses articles les plus populaires :
        ${JSON.stringify(dbContext?.topProducts || [])}

        Règles d'or pour tes réponses :
        1. Sois extrêmement courtois, professionnel et chaleureux (utilise le prénom "Nadjla" de temps en temps avec des emojis comme 🌸, ✨, 💍).
        2. Réponds TOUJOURS en français.
        3. Si Nadjla te pose des questions sur ses chiffres ou ses clientes, utilise les données réelles fournies ci-dessus pour lui répondre avec précision !
        4. Donne des conseils créatifs et raffinés de décoration de mariage traditionnelle algérienne, de composition de coffrets (velours, dorures, soie, dragées), de tarification et de gestion de stocks.
        5. Garde tes réponses synthétiques, claires et scannables (utilise des listes à puces si nécessaire).
        `;

        // Modéliser l'historique pour le chat
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: message,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        res.json({ success: true, reply: response.text });
    } catch (err: any) {
        console.error("Erreur API Chatbot :", err);
        res.status(500).json({ error: err.message || "Une erreur est survenue lors du traitement de l'IA." });
    }
});

// 2. API Route: Générateur d'illustrations d'articles avec Gemini Image (gemini-3.1-flash-image)
app.post("/api/generate-image", async (req, res) => {
    try {
        const { prompt, size } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Le prompt de description est obligatoire." });
        }

        const ai = getAiClient();

        // Traduire ou enrichir le prompt de Nadjla pour un rendu 3D ultra réaliste haut de gamme
        const enrichedPrompt = `Luxury wedding rental item, 3D render, studio lighting, high resolution, photorealistic, premium details: ${prompt}`;

        // Configurer la résolution selon le choix (1K, 2K, 4K)
        const imageSize = size || "1K"; // "1K", "2K", "4K"

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: {
                parts: [
                    { text: enrichedPrompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: imageSize
                }
            }
        });

        // Extraire l'image encodée en base64 de la réponse
        let base64Image = "";
        const parts = response.candidates?.[0]?.content?.parts;
        
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    base64Image = part.inlineData.data;
                    break;
                }
            }
        }

        if (!base64Image) {
            return res.status(500).json({ error: "Aucun flux d'image n'a été renvoyé par le modèle." });
        }

        res.json({ success: true, base64Image });
    } catch (err: any) {
        console.error("Erreur Génération d'image :", err);
        res.status(500).json({ error: err.message || "Échec de génération d'image par l'IA." });
    }
});

// 3. Intégration Vite et service des pages statiques
async function bootstrap() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        
        // Renvoyer les fichiers statiques de façon appropriée
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`DECO RN ADMIN démarré avec succès sur http://localhost:${PORT}`);
    });
}

bootstrap();
