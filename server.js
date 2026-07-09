const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE");

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        // Removed hardcoded intercepts to allow dynamic API processing
        
        const model = genAI.getGenerativeModel({  
            model: "gemini-1.5-flash-8b",
            systemInstruction: `You are an advanced voice-controlled AI assistant. You must respond quickly and concisely (under 10 seconds).
            You can perform system tasks for the user because you have a local execution backend running PowerShell.
            
            CRITICAL RULES:
            1. If the user asks a general question (e.g., "what is today's weather?", "who is the president?"), DO NOT open Chrome or any browser. You must answer it conversationally directly in the chat using your own knowledge!
            2. ONLY use 'system_action' if the user EXPLICITLY asks you to OPEN an app or control the computer (e.g., "Open calculator", "Open Chrome").
            
            If you need to perform a system task, respond ONLY with a JSON object in this exact format:
            {"type": "system_action", "command": "<powershell_command>", "speech": "<what_you_will_say_aloud>"}
            
            For example:
            - "Open calculator" -> {"type": "system_action", "command": "calc", "speech": "Opening calculator now."}
            - "Open calculator and do 2+2" -> {"type": "system_action", "command": "calc; Start-Sleep -Seconds 1; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('2{+}2=')", "speech": "Opening calculator and calculating 2 plus 2."}
            - "Open notepad and write hello" -> {"type": "system_action", "command": "echo hello > %TEMP%\\msg.txt && start notepad %TEMP%\\msg.txt", "speech": "I have opened notepad and written hello."}
            
            If the user asks a conversational question, respond ONLY with plain text, no JSON.
            Do not use markdown formatting like \`\`\`json if you output JSON. Output raw JSON or raw text.`
        });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text();
        
        // Try to parse as JSON if it's a system command
        try {
            let cleanText = text.trim();
            if (cleanText.startsWith('\`\`\`json')) {
                cleanText = cleanText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            }
            const jsonResp = JSON.parse(cleanText);
            if (jsonResp.type === 'system_action') {
                return res.json({ type: 'system_action', command: jsonResp.command, speech: jsonResp.speech });
            }
        } catch (e) {
            // It's normal conversational text
            return res.json({ type: 'text', speech: text });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred while communicating with the AI service. Please try again." });
    }
});

app.post('/api/execute', (req, res) => {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ error: "No command provided" });
    }

    console.log(`Executing system command: ${command}`);
    
    exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error.message}`);
            return res.status(500).json({ error: error.message, stderr });
        }
        res.json({ success: true, output: stdout });
    });
});

app.listen(PORT, () => {
    console.log(`Local AI Backend running on http://localhost:${PORT}`);
});
