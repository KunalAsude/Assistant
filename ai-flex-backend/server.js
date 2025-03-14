import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { router as symptomRoutes } from "./routes/symptomRoutes.js";

dotenv.config();
connectDB();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()) 
app.use(express.json()) 

// Routes
app.use('/api/symptoms', symptomRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
