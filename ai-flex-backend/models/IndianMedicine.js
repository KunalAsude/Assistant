// models/IndianMedicine.js
import mongoose from 'mongoose';

const IndianMedicineSchema = new mongoose.Schema({
  Sr_No: { type: Number },
  Drug_Code: { type: Number },
  Generic_Name: { 
    type: String, 
    required: true,
    index: true
  },
  Unit_Size: { type: String },
  MRP: { type: Number }
});

IndianMedicineSchema.index({ Generic_Name: 'text' });


IndianMedicineSchema.pre('save', function(next) {
  if (this.Generic_Name) {
    this.Generic_Name = this.Generic_Name.trim();
  }
  next();
});


IndianMedicineSchema.statics.findByGenericComponents = async function(genericName) {

  const components = genericName.toLowerCase().split(/[,\s]+/).filter(comp => 
    comp.length > 3 && 
    !['and', 'with', 'plus', 'mg', 'ml', 'tablet', 'tablets', 'capsule', 'capsules'].includes(comp)
  );
  
  if (components.length === 0) return [];
  
 
  const searchTerms = components.map(comp => `(?=.*${comp})`).join('');
  const regex = new RegExp(searchTerms, 'i');
  
  return this.find({ Generic_Name: regex }).limit(10);
};

const IndianMedicine = mongoose.model('IndianMedicine', IndianMedicineSchema);

export default IndianMedicine;