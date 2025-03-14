import express from 'express';
import axios from 'axios';
import { formatResponse } from '../utils/responseFormatter.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
    const { symptoms } = req.body;

    try {
        const aiResponse = await axios.post(
            process.env.TOGETHER_AI_URL,
            {
                model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
                messages: [{ role: 'user', content: `Analyze symptoms: ${symptoms}. Provide possible conditions, symptoms, remedies, and precautions.` }],
                temperature: 0.7,
                max_tokens: 800,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const rawMessage = aiResponse.data.choices[0]?.message?.content || "No analysis available.";
        console.log("Raw AI Response:", rawMessage);
        // Use the formatResponse function
        const structuredResponse = formatResponse(rawMessage);
        console.log("Formatted Response:", structuredResponse);
        res.json(structuredResponse);

    } catch (error) {
        console.error("Symptom Analysis Error:", error.message);
        res.status(500).json({ error: "Failed to analyze symptoms." });
    }
});

export {router};
