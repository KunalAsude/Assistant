// scripts/testMongoDB.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medicalApp';

/**
 * Test MongoDB connection and query the products collection
 */
const testMongoDB = async () => {
  try {
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if products collection exists
    if (!collections.find(c => c.name === 'products')) {
      console.error('products collection not found!');
      process.exit(1);
    }
    
    // Count documents in products collection
    const count = await db.collection('products').countDocuments();
    console.log(`Found ${count} documents in products collection`);
    
    // Sample query for a common drug
    const testDrugs = [
      'NAPROXEN',
      'AZITHROMYCIN',
      'AMOXICILLIN',
      'POVIDONE-IODINE'
    ];
    
    for (const drug of testDrugs) {
      console.log(`\nTesting search for: ${drug}`);
      
      // Extract search terms
      const searchTerms = drug.toLowerCase().split(/[,\s]+/).filter(term => term.length > 3);
      console.log(`Search terms: ${searchTerms.join(', ')}`);
      
      // Create query
      const query = {
        $or: searchTerms.map(term => ({
          Generic_Name: { $regex: term, $options: 'i' }
        }))
      };
      
      // Execute query
      const results = await db.collection('products').find(query).limit(5).toArray();
      
      console.log(`Found ${results.length} results for ${drug}`);
      if (results.length > 0) {
        console.log('Sample result:', results[0]);
      }
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('MongoDB test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the test
testMongoDB();