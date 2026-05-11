import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: 16,
        padding: theme.spacing(2),
        minWidth: '400px',
    },
}));

const DiabetesDiagnosisPopup = ({ open, onAnswer }) => {
    const handleAnswer = (answer) => {
        onAnswer(answer);
    };

    return (
        <StyledDialog
            open={open}
            disableEscapeKeyDown
            aria-labelledby="diabetes-diagnosis-dialog-title"
        >
            <DialogTitle id="diabetes-diagnosis-dialog-title">
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    Diabetes Diagnosis
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ py: 2 }}>
                    <Typography variant="body1" textAlign="center" gutterBottom>
                        Have you been previously diagnosed with diabetes?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                        This helps us personalize your experience.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => handleAnswer('yes')}
                    sx={{
                        minWidth: 120,
                        borderRadius: 2,
                        fontWeight: 'bold',
                    }}
                >
                    Yes
                </Button>
                <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={() => handleAnswer('no')}
                    sx={{
                        minWidth: 120,
                        borderRadius: 2,
                        fontWeight: 'bold',
                    }}
                >
                    No
                </Button>
            </DialogActions>
        </StyledDialog>
    );
};

export default DiabetesDiagnosisPopup;
