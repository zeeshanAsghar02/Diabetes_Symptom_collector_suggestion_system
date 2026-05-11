import { Symptom } from '../models/Symptom.js';
import { Disease } from '../models/Disease.js';
import mongoose from 'mongoose';

// Get all symptoms for a disease
export const getSymptomsByDisease = async (req, res) => {
  try {
    const { diseaseId } = req.params;
    console.log('Fetching symptoms for diseaseId:', diseaseId);
    
    let disease;
    // Check if diseaseId is a valid ObjectId or a disease name
    if (mongoose.Types.ObjectId.isValid(diseaseId)) {
      disease = await Disease.findById(diseaseId);
    } else {
      // Try to find by name
      disease = await Disease.findOne({ name: new RegExp(`^${diseaseId}$`, 'i') });
    }
    
    if (!disease) {
      return res.status(404).json({ success: false, message: 'Disease not found' });
    }
    
    const symptoms = await Symptom.find({ disease_id: disease._id, deleted_at: null });
    console.log('Symptoms found:', symptoms.length);
    res.json({ success: true, data: symptoms });
  } catch (err) {
    console.error('Error in getSymptomsByDisease:', err);
    res.status(500).json({ message: 'Error fetching symptoms', error: err.message });
  }
};

// Add a symptom to a disease
export const addSymptom = async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { name, description } = req.body;
    const newSymptom = new Symptom({ name, description, disease_id: diseaseId });
    await newSymptom.save();
    res.status(201).json({ success: true, data: newSymptom });
  } catch (err) {
    console.error('Error adding symptom:', err);
    res.status(500).json({ success: false, message: 'Error adding symptom', error: err.message });
  }
};

// Update a symptom
export const updateSymptom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updatedSymptom = await Symptom.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    if (!updatedSymptom) {
      return res.status(404).json({ success: false, message: 'Symptom not found' });
    }
    res.json({ success: true, data: updatedSymptom });
  } catch (err) {
    console.error('Error updating symptom:', err);
    res.status(500).json({ success: false, message: 'Error updating symptom', error: err.message });
  }
};

// Delete a symptom
export const deleteSymptom = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSymptom = await Symptom.findByIdAndDelete(id);
    if (!deletedSymptom) {
      return res.status(404).json({ success: false, message: 'Symptom not found' });
    }
    res.json({ success: true, message: 'Symptom deleted successfully' });
  } catch (err) {
    console.error('Error deleting symptom:', err);
    res.status(500).json({ success: false, message: 'Error deleting symptom', error: err.message });
  }
}; 