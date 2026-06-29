import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable large JSON payloads for base64 file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Routes

// 1. Process schedules via Gemini API
app.post('/api/gemini/process-schedule', async (req, res) => {
  try {
    const { fileData, mimeType, fileName } = req.body;
    
    if (!fileData) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    // Check if key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. Falling back to simulated extraction.');
      // Simulating a friendly response with fallback
      return res.json({
        classes: [
          { subjectId: 'matematica', day: 'monday', startTime: '09:00', endTime: '10:00', room: 'Sala 101' },
          { subjectId: 'programacao', day: 'tuesday', startTime: '14:00', endTime: '15:00', room: 'Lab 3' },
          { subjectId: 'fisica', day: 'wednesday', startTime: '11:00', endTime: '12:00', room: 'Sala 102' },
          { subjectId: 'quimica', day: 'thursday', startTime: '09:00', endTime: '10:00', room: 'Lab 1' },
          { subjectId: 'ingles', day: 'friday', startTime: '15:00', endTime: '16:00', room: 'Sala 204' }
        ],
        warning: 'Chave API do Gemini não configurada. Usando dados padrão.'
      });
    }

    const ai = getGeminiClient();

    const parts: any[] = [
      {
        inlineData: {
          data: fileData,
          mimeType: mimeType || 'image/jpeg'
        }
      },
      {
        text: `You are an expert school scheduler parser. Identify the class schedule details in this document (file name: ${fileName || 'unnamed'}) and extract them as a JSON list. 
For 'subjectId', map the class/subject to one of these valid subjects: [matematica, programacao, fisica, quimica, ingles]. If it does not match, map it to the most relevant one.
For 'day', it must be a valid lowercase weekday (monday, tuesday, wednesday, thursday, friday, saturday, sunday).
For 'startTime' and 'endTime', use the 'HH:MM' format.
For 'room', extract the classroom code or name if available.

Ensure the response is valid JSON according to the schema.`
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subjectId: { type: Type.STRING, description: 'One of: matematica, programacao, fisica, quimica, ingles' },
              day: { type: Type.STRING, description: 'Lowercase weekday (e.g. monday)' },
              startTime: { type: Type.STRING, description: 'Format HH:MM' },
              endTime: { type: Type.STRING, description: 'Format HH:MM' },
              room: { type: Type.STRING, description: 'Classroom description' }
            },
            required: ['subjectId', 'day', 'startTime', 'endTime']
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty text response');
    }

    const parsedClasses = JSON.parse(text.trim());
    return res.json({ classes: parsedClasses });

  } catch (error: any) {
    console.error('Error processing schedule with Gemini:', error);
    return res.status(500).json({ error: error.message || 'Error processing schedule' });
  }
});

// 2. Summarize notes via Gemini API
app.post('/api/gemini/summarize-note', async (req, res) => {
  try {
    const { title, body } = req.body;
    
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'No note content provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not configured. Falling back to simulated summary.');
      return res.json({
        summary: `
          <h3><strong>Resumo Geral:</strong></h3>
          <p>Resumo simulado para "${title || 'Sem Título'}". Adicione uma chave API Gemini válida nas Configurações para obter resumos reais gerados por IA.</p>
          <h3><strong>Pontos-Chave:</strong></h3>
          <ul>
            <li><strong>Conteúdo Lido:</strong> A anotação contém ${body.length} caracteres.</li>
            <li><strong>Modo Offline:</strong> Atualmente a funcionar em modo offline de demonstração.</li>
          </ul>
          <h3><strong>Glossário:</strong></h3>
          <p><strong>Gemini:</strong> O modelo de linguagem avançado da Google usado para gerar resumos de estudo.</p>
        `
      });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are an AI study assistant. Please analyze this student's note and create an extremely elegant, concise, and helpful study summary.
The note title is: "${title || 'Untitled note'}"
The note content is:
"""
${body}
"""

Please reply ONLY in Portuguese (Portugal/Brazil).
Generate clean HTML with the following exact structure, keeping it brief and easy to read:
<h3><strong>Resumo Geral:</strong></h3>
<p>Write a 1-2 sentence overview here.</p>
<h3><strong>Pontos-Chave:</strong></h3>
<ul>
  <li><strong>[Topic 1]:</strong> [Details here]</li>
  <li><strong>[Topic 2]:</strong> [Details here]</li>
  <li><strong>[Topic 3]:</strong> [Details here]</li>
</ul>
<h3><strong>Glossário:</strong></h3>
<p><strong>[Key Term]:</strong> [Short definition]</p>`
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty summary');
    }

    return res.json({ summary: text });

  } catch (error: any) {
    console.error('Error summarizing note with Gemini:', error);
    return res.status(500).json({ error: error.message || 'Error generating summary' });
  }
});

// Setup Vite Dev Server / Static Assets Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
