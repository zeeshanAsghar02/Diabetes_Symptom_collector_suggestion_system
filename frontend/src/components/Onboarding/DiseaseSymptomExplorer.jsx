import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import axiosInstance from '../../utils/axiosInstance';
import SymptomCard from './SymptomCard';

const DiseaseSymptomExplorer = () => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const response = await axiosInstance.get('/diseases/public');
        let data = response.data;
        if (Array.isArray(data)) setDiseases(data);
        else if (Array.isArray(data.data)) setDiseases(data.data);
        else setDiseases([]);
        setLoading(false);
      } catch (err) {
        setError('Error fetching diseases. Please try again later.');
        setLoading(false);
      }
    };
    fetchDiseases();
  }, []);

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!diseases.length) return <Typography color="text.secondary" align="center" sx={{ mt: 8 }}>No diseases found in the database.</Typography>;

  return (
    <Box>
      {diseases.map((disease) => (
        <Box key={disease._id} mb={6}>
          <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
            {disease.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mb={3}>
            {disease.description}
          </Typography>
          <SymptomCard diseaseId={disease._id} />
        </Box>
      ))}
    </Box>
  );
};

export default DiseaseSymptomExplorer; 
