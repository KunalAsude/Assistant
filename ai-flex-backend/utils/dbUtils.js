
import mongoose from 'mongoose';

export const connectAndVerifyDB = async (uri) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully!');
    
    // Get a reference to the products collection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if products collection exists
    const productsCollection = collections.find(c => c.name === 'products');
    if (!productsCollection) {
      console.warn('Warning: products collection not found in database');
      return;
    }
    
    // Check count of documents in products collection
    const count = await db.collection('products').countDocuments();
    console.log(`Found ${count} documents in products collection`);
    
    // Sample a few documents to verify structure
    if (count > 0) {
      const samples = await db.collection('products').find().limit(2).toArray();
      console.log('Sample documents:', JSON.stringify(samples, null, 2));
    }
  } catch (error) {
    console.error('MongoDB connection or verification failed:', error.message);
    throw error;
  }
};