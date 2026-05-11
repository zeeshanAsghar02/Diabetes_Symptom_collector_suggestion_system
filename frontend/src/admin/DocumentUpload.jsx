import React, { useState, useCallback } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    LinearProgress,
    Alert,
    Card,
    CardContent,
    Chip,
    Stack,
    Switch,
    FormControlLabel,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';

const DocumentUpload = () => {
    const { formatDate } = useDateFormat();
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        source: '',
        country: '',
        doc_type: 'guideline',
        version: '1.0',
        force: false,
    });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    // Fetch documents on mount
    React.useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoadingDocs(true);
            const response = await axiosInstance.get('/admin/docs');
            if (response.data.success) {
                setDocuments(response.data.documents || []);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
        } finally {
            setLoadingDocs(false);
        }
    };

    // Handle drag events
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    }, []);

    // Validate file
    const validateAndSetFile = (selectedFile) => {
        const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];
        const fileName = selectedFile.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!isValid) {
            setError('Invalid file type. Please upload PDF, DOCX, DOC, TXT, MD, or CSV files.');
            toast.error('Invalid file type');
            return;
        }
        
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File size exceeds 50MB limit.');
            toast.error('File too large');
            return;
        }
        
        setFile(selectedFile);
        setError(null);
        setUploadResult(null);
    };

    // Handle file input change
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle force toggle
    const handleForceToggle = (e) => {
        setFormData(prev => ({ ...prev, force: e.target.checked }));
    };

    // Handle upload
    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload');
            return;
        }
        
        if (!formData.title || !formData.source || !formData.country || !formData.doc_type) {
            setError('Please fill in all required fields');
            return;
        }
        
        try {
            setUploading(true);
            setUploadProgress(0);
            setError(null);
            setUploadResult(null);
            
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                setError('Authentication required. Please login again.');
                toast.error('Please login again');
                return;
            }
            
            console.log('Uploading document with token:', token ? 'Token present' : 'No token');
            
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('title', formData.title);
            uploadFormData.append('source', formData.source);
            uploadFormData.append('country', formData.country);
            uploadFormData.append('doc_type', formData.doc_type);
            uploadFormData.append('version', formData.version);
            uploadFormData.append('force', formData.force.toString());
            
            const response = await axiosInstance.post(
                '/admin/docs/upload',
                uploadFormData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    },
                }
            );
            
            if (response.data.success) {
                setUploadResult(response.data);
                toast.success('Document ingested successfully!');
                
                // Reset form
                setFile(null);
                setFormData({
                    title: '',
                    source: '',
                    country: '',
                    doc_type: 'guideline',
                    version: '1.0',
                    force: false,
                });
                
                // Refresh document list
                fetchDocuments();
            }
        } catch (err) {
            console.error('Upload error:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            console.error('Error message from server:', JSON.stringify(err.response?.data, null, 2));
            
            if (err.response?.status === 401) {
                setError('Authentication failed. Please login again.');
                toast.error('Authentication failed');
            } else if (err.response?.status === 403) {
                setError('Access denied. Super admin access required.');
                toast.error('Access denied');
            } else if (err.response?.status === 409) {
                setError('Document already exists. Enable "Force Override" to replace it.');
                toast.error('Document already exists');
            } else if (err.response?.data?.code === 'OCR_REQUIRED') {
                const errorMsg = `${err.response.data.message}: ${err.response.data.error}`;
                const suggestion = err.response.data.suggestion;
                setError(`${errorMsg}\n\n${suggestion}`);
                toast.error('Scanned PDF detected - OCR required', { autoClose: 5000 });
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to upload document');
                toast.error(err.response?.data?.message || 'Upload failed');
            }
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Handle document deletion
    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) {
            return;
        }
        
        try {
            await axiosInstance.delete(`/admin/docs/${docId}`);
            toast.success('Document deleted successfully');
            fetchDocuments();
        } catch (err) {
            toast.error('Failed to delete document');
            console.error('Delete error:', err);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Document Upload & Ingestion
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Upload diabetes-related documents for the personalized suggestion system
            </Typography>
            
            <Grid container spacing={3}>
                {/* Upload Section */}
                <Grid item xs={12} lg={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Upload Document
                        </Typography>
                        
                        {/* Drag & Drop Area */}
                        <Box
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            sx={{
                                border: 2,
                                borderStyle: 'dashed',
                                borderColor: dragActive ? 'primary.main' : 'divider',
                                borderRadius: 2,
                                p: 4,
                                textAlign: 'center',
                                bgcolor: dragActive ? 'action.hover' : 'background.default',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                mb: 3,
                            }}
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".pdf,.docx,.doc,.txt,.md,.csv"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="body1" fontWeight={500} gutterBottom>
                                {file ? file.name : 'Drag & drop file here or click to browse'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Supported: PDF, DOCX, DOC, TXT, MD, CSV (Max 50MB)
                            </Typography>
                            
                            {file && (
                                <Chip
                                    icon={<DescriptionIcon />}
                                    label={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                    color="primary"
                                    sx={{ mt: 2 }}
                                    onDelete={() => setFile(null)}
                                />
                            )}
                        </Box>
                        
                        {/* Metadata Form */}
                        <Stack spacing={2}>
                            <TextField
                                label="Document Title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                variant="outlined"
                            />
                            
                            <TextField
                                label="Source"
                                name="source"
                                value={formData.source}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                placeholder="e.g., WHO, ADA, Ministry of Health"
                            />
                            
                            <TextField
                                label="Country/Region"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                placeholder="e.g., USA, Pakistan, Global"
                            />
                            
                            <FormControl fullWidth required>
                                <InputLabel>Document Type</InputLabel>
                                <Select
                                    name="doc_type"
                                    value={formData.doc_type}
                                    onChange={handleInputChange}
                                    label="Document Type"
                                >
                                    <MenuItem value="guideline">Guideline</MenuItem>
                                    <MenuItem value="research_paper">Research Paper</MenuItem>
                                    <MenuItem value="diet_chart">Diet Chart</MenuItem>
                                    <MenuItem value="exercise_recommendation">Exercise Recommendation</MenuItem>
                                    <MenuItem value="clinical_material">Clinical Material</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <TextField
                                label="Version"
                                name="version"
                                value={formData.version}
                                onChange={handleInputChange}
                                fullWidth
                                placeholder="e.g., 1.0, 2023.1"
                            />
                            
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.force}
                                        onChange={handleForceToggle}
                                        color="warning"
                                    />
                                }
                                label="Force Override (replace duplicate)"
                            />
                            
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<CloudUploadIcon />}
                                onClick={handleUpload}
                                disabled={uploading || !file}
                                fullWidth
                            >
                                {uploading ? 'Uploading...' : 'Upload & Ingest'}
                            </Button>
                        </Stack>
                        
                        {/* Progress Bar */}
                        {uploading && (
                            <Box sx={{ mt: 2 }}>
                                <LinearProgress variant="determinate" value={uploadProgress} />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    {uploadProgress}% - Processing document...
                                </Typography>
                            </Box>
                        )}
                        
                        {/* Error Message */}
                        {error && (
                            <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                        
                        {/* Success Result */}
                        {uploadResult && (
                            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
                                <Typography variant="body2" fontWeight={600}>
                                    Document ingested successfully!
                                </Typography>
                                <Typography variant="caption">
                                    Document ID: {uploadResult.doc_id}
                                </Typography>
                                <br />
                                <Typography variant="caption">
                                    Chunks Created: {uploadResult.chunks_created}
                                </Typography>
                            </Alert>
                        )}
                    </Paper>
                </Grid>
                
                {/* Document List */}
                <Grid item xs={12} lg={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Uploaded Documents ({documents.length})
                        </Typography>
                        
                        {loadingDocs ? (
                            <LinearProgress />
                        ) : documents.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                No documents uploaded yet
                            </Typography>
                        ) : (
                            <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                                {documents.map((doc) => (
                                    <Card key={doc.doc_id} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {doc.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {doc.original_filename}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                        <Chip label={doc.doc_type} size="small" color="primary" />
                                                        <Chip label={doc.country} size="small" variant="outlined" />
                                                        <Chip label={`${doc.chunk_count} chunks`} size="small" variant="outlined" />
                                                    </Stack>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                        Uploaded: {formatDate(doc.ingested_on)}
                                                    </Typography>
                                                </Box>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDeleteDocument(doc.doc_id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DocumentUpload;
