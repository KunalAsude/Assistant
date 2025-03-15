// utils/indianAlternativeMatcher.js
import mongoose from 'mongoose';

/**
 * Extracts key components from a generic drug name
 * @param {string} genericName - The generic name from OpenFDA
 * @returns {Array} - Array of key drug components
 */
const extractDrugComponents = (genericName) => {
  if (!genericName || genericName === "Unknown") return [];
  
  // Remove strengths and common connecting words
  const sanitized = genericName
    .replace(/\d+\s*mg|\d+\s*ml|\d+\s*mcg|\d+%/gi, '')
    .replace(/tablet|capsule|injection|solution|suspension|syrup/gi, '')
    .replace(/and|with|plus|\+|,|\(|\)/g, ' ')
    .trim();
  
  // Split into components and filter out short terms
  return sanitized
    .split(/\s+/)
    .map(term => term.toLowerCase().trim())
    .filter(term => term.length > 3);
};

/**
 * Finds Indian alternatives for a list of OpenFDA drugs
 * @param {Array} openFdaDrugs - Array of drugs from OpenFDA
 * @returns {Object} - Mapping of original drugs to Indian alternatives
 */
export const findIndianAlternatives = async (openFdaDrugs) => {
  try {
    const results = {};
    
    // Verify connection
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB not connected when searching for Indian alternatives");
      return results;
    }
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    console.log(`Searching for Indian alternatives for ${openFdaDrugs.length} drugs`);
    
    for (const drug of openFdaDrugs) {
      const genericName = drug.generic;
      
      // Skip unknown generics
      if (!genericName || genericName === "Unknown") {
        continue;
      }
      
      console.log(`Finding alternatives for: ${genericName}`);
      
      // Extract key components from the generic name
      const components = extractDrugComponents(genericName);
      
      if (components.length === 0) {
        console.log(`No components extracted from: ${genericName}`);
        continue;
      }
      
      // Create a query to match any of the components in the Generic_Name field
      const queries = components.map(comp => {
        return { Generic_Name: { $regex: comp, $options: 'i' } };
      });
      
      // Execute query
      const indianAlternatives = await productsCollection.find({ $or: queries })
        .limit(5)
        .toArray();
      
      console.log(`Found ${indianAlternatives.length} alternatives for ${genericName}`);
      
      // Format the results
      if (indianAlternatives.length > 0) {
        results[drug.name] = {
          original_generic: drug.generic,
          original_manufacturer: drug.manufacturer,
          indian_alternatives: indianAlternatives.map(alt => ({
            drug_code: alt.Drug_Code || alt.Sr_No,
            generic_name: alt.Generic_Name,
            unit_size: alt.Unit_Size,
            mrp: alt.MRP
          }))
        };
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error finding Indian alternatives:", error.message);
    return {};
  }
};

/**
 * Find Indian medicines by generic name - for direct API calls
 * @param {string} genericName - Generic name to search for
 * @returns {Array} - Matching Indian medicines
 */
export const searchIndianMedicinesByGeneric = async (genericName) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB not connected when searching for Indian medicines");
      return [];
    }
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Extract components
    const components = extractDrugComponents(genericName);
    
    if (components.length === 0) {
      // Try a direct search if components extraction failed
      const directResults = await productsCollection.find({
        Generic_Name: { $regex: genericName, $options: 'i' }
      }).limit(10).toArray();
      
      if (directResults.length > 0) {
        return directResults;
      }
      
      return [];
    }
    
    // Create component queries
    const queries = components.map(comp => ({
      Generic_Name: { $regex: comp, $options: 'i' }
    }));
    
    // Find matching products
    return await productsCollection.find({ $or: queries }).limit(10).toArray();
  } catch (error) {
    console.error(`Error searching Indian medicines for ${genericName}:`, error.message);
    return [];
  }
};