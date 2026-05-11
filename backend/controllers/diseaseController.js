import { Disease } from '../models/Disease.js';

// Get all diseases
export const getAllDiseases = async (req, res) => {
  try {
    const diseases = await Disease.find({ deleted_at: null });
    res.status(200).json({ success: true, data: diseases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching diseases', error: err.message });
  }
};

// Add a new disease (stub)
export const addDisease = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

// Update a disease (stub)
export const updateDisease = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

// Delete a disease (stub)
export const deleteDisease = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
}; 