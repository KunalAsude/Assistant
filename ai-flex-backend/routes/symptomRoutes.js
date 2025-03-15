import express from 'express';
import axios from 'axios';
import { formatResponse } from '../utils/responseFormatter.js';
import { findIndianAlternatives } from '../utils/indianAlternativeMatcher.js';

const router = express.Router();

// In-memory cache for drug information
const drugCache = new Map();

/**
 * Fetch drug information from OpenFDA API with caching
 * @param {string} condition - Medical condition to search for
 * @returns {Array} - Array of drug objects for the condition
 */
const fetchOpenFdaDrugs = async (condition) => {
    try {
        // Check cache first
        const cacheKey = condition.trim().toLowerCase();
        if (drugCache.has(cacheKey)) {
            console.log(`Using cached results for "${condition}"`);
            return drugCache.get(cacheKey);
        }
        
        // Properly encode the condition name for URL
        const searchTerm = encodeURIComponent(condition.trim());
        
        // Try a simple search first
        const url = `https://api.fda.gov/drug/label.json?search=indications_and_usage:${searchTerm}&limit=5`;
        console.log(`Fetching drugs for "${condition}" from: ${url}`);
        
        const response = await axios.get(url, {
            timeout: 10000,
            validateStatus: status => status < 500 // Don't throw on 4xx errors
        });
        
        // Check if we got successful results
        if (response.status === 200 && response.data.results && response.data.results.length > 0) {
            const drugs = response.data.results.map(drug => ({
                name: drug.openfda?.brand_name?.[0] || "Unknown",
                generic: drug.openfda?.generic_name?.[0] || "Unknown",
                manufacturer: drug.openfda?.manufacturer_name?.[0] || "Unknown",
                usage: drug.indications_and_usage?.[0]?.substring(0, 300) || "No details available.",
                source: "OpenFDA"
            }));
            
            // Cache the results
            drugCache.set(cacheKey, drugs);
            return drugs;
        }
        
        // If no results found, return empty array (fallback system will handle it)
        console.log(`No OpenFDA drugs found for condition: ${condition}`);
        drugCache.set(cacheKey, []); // Cache empty results too
        return [];
    } catch (error) {
        console.error(`OpenFDA API Error for condition "${condition}":`, error.message);
        return [];
    }
};

/**
 * Get common medications for a condition from our fallback database
 * @param {string} condition - Medical condition to find medications for
 * @returns {Array} - Array of drug objects for the condition
 */
const getCommonMedicationsForCondition = (condition) => {
    // Common medications database - in production, this would likely be in a separate file or database
    const commonMedications = {
        "headache": [
            { name: "Aspirin", generic: "acetylsalicylic acid", manufacturer: "Various", usage: "For relief of headache, minor pain, and fever", source: "Fallback" },
            { name: "Tylenol", generic: "acetaminophen", manufacturer: "Johnson & Johnson", usage: "For relief of headache, minor pain, and fever", source: "Fallback" },
            { name: "Advil", generic: "ibuprofen", manufacturer: "Pfizer", usage: "For relief of headache, minor pain, inflammation, and fever", source: "Fallback" }
        ],
        "fever": [
            { name: "Tylenol", generic: "acetaminophen", manufacturer: "Johnson & Johnson", usage: "For relief of fever and minor pain", source: "Fallback" },
            { name: "Motrin", generic: "ibuprofen", manufacturer: "McNeil Consumer", usage: "For relief of fever, pain, and inflammation", source: "Fallback" }
        ],
        "cold": [
            { name: "NyQuil", generic: "acetaminophen/dextromethorphan/doxylamine", manufacturer: "Vicks", usage: "For temporary relief of cold and flu symptoms", source: "Fallback" },
            { name: "Sudafed", generic: "pseudoephedrine", manufacturer: "Johnson & Johnson", usage: "For temporary relief of nasal congestion", source: "Fallback" }
        ],
        "allergies": [
            { name: "Zyrtec", generic: "cetirizine", manufacturer: "Johnson & Johnson", usage: "For relief of allergy symptoms", source: "Fallback" },
            { name: "Claritin", generic: "loratadine", manufacturer: "Bayer", usage: "For relief of allergy symptoms", source: "Fallback" }
        ],
        "pain": [
            { name: "Advil", generic: "ibuprofen", manufacturer: "Pfizer", usage: "For relief of pain, inflammation, and fever", source: "Fallback" },
            { name: "Aleve", generic: "naproxen", manufacturer: "Bayer", usage: "For relief of pain, inflammation, and fever", source: "Fallback" }
        ]
    };
    
    // Normalize condition name and look for matches
    const normalizedCondition = condition.trim().toLowerCase();
    
    // Check for exact match
    if (commonMedications[normalizedCondition]) {
        return commonMedications[normalizedCondition];
    }
    
    // Check for partial matches
    for (const [key, drugs] of Object.entries(commonMedications)) {
        if (normalizedCondition.includes(key) || key.includes(normalizedCondition)) {
            return drugs;
        }
    }
    
    // Return empty array if no match found
    return [];
};

/**
 * Search Indian medicines database by generic name
 * @param {string} genericName - Generic drug name to search for
 * @returns {Array} - Array of matching Indian medicines
 */
const searchIndianMedicinesByGeneric = async (genericName) => {
    try {
        // In a real implementation, this would query a database
        // Mock implementation for demonstration purposes
        const mockIndianMedicines = [
            { Drug_Code: "IND001", Generic_Name: "acetaminophen", Unit_Size: "500mg", MRP: 35.0 },
            { Drug_Code: "IND002", Generic_Name: "ibuprofen", Unit_Size: "400mg", MRP: 40.0 },
            { Drug_Code: "IND003", Generic_Name: "aspirin", Unit_Size: "325mg", MRP: 25.0 },
            { Drug_Code: "IND004", Generic_Name: "cetirizine", Unit_Size: "10mg", MRP: 45.0 },
            { Drug_Code: "IND005", Generic_Name: "loratadine", Unit_Size: "10mg", MRP: 50.0 },
            { Drug_Code: "IND006", Generic_Name: "pseudoephedrine", Unit_Size: "60mg", MRP: 60.0 }
        ];
        
        const normalizedGeneric = genericName.trim().toLowerCase();
        return mockIndianMedicines.filter(med => 
            med.Generic_Name.toLowerCase().includes(normalizedGeneric)
        );
    } catch (error) {
        console.error("Error searching Indian medicines:", error.message);
        return [];
    }
};

/**
 * Categorize drugs by medical condition
 * @param {Array} matchedDrugs - Array of drug objects
 * @param {Array} possibleConditions - Array of possible medical conditions
 * @returns {Object} - Object with conditions as keys and arrays of drugs as values
 */
const categorizeDrugs = (matchedDrugs, possibleConditions) => {
    const categorized = {};
    
    // Initialize categories for each condition
    for (const condition of possibleConditions) {
        const conditionName = typeof condition === 'object' ? condition.name : condition;
        if (conditionName && typeof conditionName === 'string') {
            categorized[conditionName] = [];
        }
    }
    
    // Add general treatments category
    categorized["General Treatments"] = [];
    
    // Assign drugs to categories
    for (const drug of matchedDrugs) {
        let assigned = false;
        const drugUsage = (drug.usage || "").toLowerCase();
        
        for (const condition of possibleConditions) {
            const conditionName = typeof condition === 'object' ? condition.name : condition;
            if (conditionName && typeof conditionName === 'string') {
                // Check if drug usage mentions this condition
                if (drugUsage.includes(conditionName.toLowerCase())) {
                    categorized[conditionName].push(drug);
                    assigned = true;
                    break;
                }
            }
        }
        
        // If not assigned to a specific condition, put in general treatments
        if (!assigned) {
            categorized["General Treatments"].push(drug);
        }
    }
    
    // Remove empty categories
    for (const category in categorized) {
        if (categorized[category].length === 0) {
            delete categorized[category];
        }
    }
    
    return categorized;
};

/**
 * Analyze symptoms and provide medication recommendations
 */
router.post('/analyze', async (req, res) => {
    const { symptoms } = req.body;
    
    try {
        let structuredResponse;
        
        // Check if we received structured data directly
        if (req.body.conditions || req.body.possible_conditions) {
            structuredResponse = req.body;
        } else {
            // Call Together AI for symptom analysis if symptoms provided
            if (symptoms) {
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
                structuredResponse = formatResponse(rawMessage);
            } else {
                return res.status(400).json({ error: "No symptoms or structured data provided" });
            }
        }
        
        // Extract possible conditions from various positions in the response structure
        const possibleConditions = [];
        
        // Check for nested conditions structure
        if (structuredResponse.conditions?.possible_conditions) {
            possibleConditions.push(...structuredResponse.conditions.possible_conditions);
        } 
        // Check for top-level possible_conditions
        else if (structuredResponse.possible_conditions) {
            possibleConditions.push(...structuredResponse.possible_conditions);
        }
        
        console.log("Possible Conditions:", possibleConditions);
        
        // Fetch matching drugs from OpenFDA for the detected conditions
        let matchedDrugs = [];
        const processedConditions = new Set(); // Track conditions we've already processed
        
        // Process condition objects and use their name property
        for (const condition of possibleConditions) {
            // Extract condition name (handle both string and object formats)
            const conditionName = typeof condition === 'object' ? condition.name : condition;
            
            if (conditionName && typeof conditionName === 'string' && !processedConditions.has(conditionName.toLowerCase())) {
                processedConditions.add(conditionName.toLowerCase());
                
                // Try to fetch drugs from OpenFDA
                const drugs = await fetchOpenFdaDrugs(conditionName);
                
                // If no drugs found from OpenFDA, try our fallback list
                if (drugs.length === 0) {
                    const fallbackDrugs = getCommonMedicationsForCondition(conditionName);
                    if (fallbackDrugs.length > 0) {
                        matchedDrugs = [...matchedDrugs, ...fallbackDrugs];
                    }
                } else {
                    matchedDrugs = [...matchedDrugs, ...drugs];
                }
            }
        }
        
        // If still no drugs found, try common symptoms as well
        if (matchedDrugs.length === 0 && structuredResponse.conditions?.common_symptoms) {
            for (const symptom of structuredResponse.conditions.common_symptoms) {
                const symptomName = typeof symptom === 'object' ? symptom.name : symptom;
                
                if (symptomName && typeof symptomName === 'string' && !processedConditions.has(symptomName.toLowerCase())) {
                    processedConditions.add(symptomName.toLowerCase());
                    
                    // Try fallback list first for common symptoms
                    const fallbackDrugs = getCommonMedicationsForCondition(symptomName);
                    if (fallbackDrugs.length > 0) {
                        matchedDrugs = [...matchedDrugs, ...fallbackDrugs];
                        break; // Just get drugs for one major symptom to avoid too many results
                    }
                }
            }
        }
        
        // Ensure we have at least some drugs by adding general headache treatments
        if (matchedDrugs.length === 0) {
            matchedDrugs = getCommonMedicationsForCondition("headache");
        }
        
        // Remove duplicates (based on name)
        const uniqueDrugs = [];
        const drugNames = new Set();
        
        for (const drug of matchedDrugs) {
            if (!drugNames.has(drug.name)) {
                drugNames.add(drug.name);
                uniqueDrugs.push(drug);
            }
        }
        
        // Categorize drugs by condition
        const categorizedDrugs = categorizeDrugs(uniqueDrugs, possibleConditions);
        
        // Find Indian alternatives for the drugs
        const indianAlternatives = await findIndianAlternatives(uniqueDrugs);
        
        // Add drug data to the final response
        structuredResponse.matchedDrugs = uniqueDrugs;
        structuredResponse.drugsByCondition = categorizedDrugs;
        structuredResponse.indianAlternatives = indianAlternatives;
        
        // Calculate statistics about alternatives found
        const totalDrugsWithAlternatives = Object.keys(indianAlternatives).length;
        const totalAlternatives = Object.values(indianAlternatives)
            .reduce((sum, drug) => sum + drug.indian_alternatives.length, 0);
            
        structuredResponse.alternativesStats = {
            drugsWithAlternatives: totalDrugsWithAlternatives,
            totalAlternatives: totalAlternatives,
            coverage: Math.round((totalDrugsWithAlternatives / uniqueDrugs.length) * 100)
        };
        
        res.json(structuredResponse);
        
        
    } catch (error) {
        console.error("Symptom Analysis Error:", error.message);
        res.status(500).json({ 
            error: "Failed to analyze symptoms: " + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/indian-alternatives/:genericName', async (req, res) => {
    try {
        const { genericName } = req.params;
        
        if (!genericName || genericName.length < 3) {
            return res.status(400).json({
                error: "Generic name must be at least 3 characters"
            });
        }
        
        const alternatives = await searchIndianMedicinesByGeneric(genericName);
        
        res.json({
            query: genericName,
            alternatives: alternatives.map(alt => ({
                drug_code: alt.Drug_Code,
                generic_name: alt.Generic_Name,
                unit_size: alt.Unit_Size,
                mrp: alt.MRP
            })),
            count: alternatives.length
        });
    } catch (error) {
        console.error("Error fetching Indian alternatives:", error.message);
        res.status(500).json({ error: "Failed to fetch Indian alternatives" });
    }
});

export { router };



