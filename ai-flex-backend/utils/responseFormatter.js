/**
 * Format the AI response into structured data for the frontend
 * @param {string} aiMessage - The raw message from the AI
 * @returns {Object} - Structured data with conditions, remedies, and precautions
 */
const formatResponse = (aiMessage) => {
    if (!aiMessage || typeof aiMessage !== 'string') {
        return {
            error: "Invalid AI response received",
            summary: "Unable to process the medical information.",
            conditions: { common_symptoms: [], possible_conditions: [] },
            remedies: [],
            precautions: []
        };
    }

    try {
        const responseData = {
            summary: "",
            description: "",
            conditions: { common_symptoms: [], possible_conditions: [] },
            remedies: [],
            precautions: []
        };

        // Extract paragraphs for summary & description
        const paragraphs = aiMessage.split('\n\n').map(p => p.trim()).filter(p => p);
        if (paragraphs.length > 0) {
            responseData.summary = paragraphs[0].replace(/\*\*(.*?)\*\*/, '$1'); // Remove markdown **bold**
            responseData.description = paragraphs.length > 1 ? paragraphs[1] : "";
        }

        // Split the response into lines
        const lines = aiMessage.split('\n');
        let currentSection = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue; // Skip empty lines

            // Detect sections based on keywords
            if (/^(\*\*?)?Possible Conditions?|Diagnosis|Diseases?/i.test(trimmedLine)) {
                currentSection = "possible_conditions";
                continue;
            } else if (/^(\*\*?)?Symptoms?|Signs/i.test(trimmedLine)) {
                currentSection = "common_symptoms";
                continue;
            } else if (/^(\*\*?)?Remedies?|Treatments?|Medications?/i.test(trimmedLine)) {
                currentSection = "remedies";
                continue;
            } else if (/^(\*\*?)?Precautions?|Warnings?|Prevention|When to see/i.test(trimmedLine)) {
                currentSection = "precautions";
                continue;
            }

            // Extract list items and their descriptions
            const listItemMatch = trimmedLine.match(/^\s*(?:[-•*]|\d+\.)\s*(.+)/);

            if (listItemMatch && currentSection) {
                let item = { name: "", description: "" };

                const [namePart, descPart] = listItemMatch[1].split(':').map(p => p.trim());

                if (namePart) {
                    item.name = namePart.replace(/\*\*(.*?)\*\*/, '$1'); // Remove markdown **bold**
                    item.description = descPart || "";
                    
                    if (currentSection === "common_symptoms" || currentSection === "possible_conditions") {
                        responseData.conditions[currentSection].push(item);
                    } else {
                        responseData[currentSection].push(item);
                    }
                }
            }
        }

        return responseData;
    } catch (error) {
        console.error("Error in formatResponse:", error);
        return {
            error: "Failed to parse AI response",
            summary: "There was an error processing the medical information.",
            conditions: { common_symptoms: [], possible_conditions: [] },
            remedies: [],
            precautions: []
        };
    }
};

export { formatResponse };
