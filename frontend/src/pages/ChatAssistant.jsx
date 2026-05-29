import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReactMarkdown from 'react-markdown';
import axiosInstance from '../utils/axiosInstance';
import { useSettings } from '../context/SettingsContext';

const starterPrompts = [
  'Suggest a light dinner for tonight',
  'Explain my latest diet plan',
  'How can I reduce post-meal sugar spikes?',
  'What should I ask my doctor?',
  'Give me safe exercise ideas',
];

const ChatAssistant = ({ inModal = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { siteTitle } = useSettings();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/chat/send', {
        message: trimmed,
        history: messages,
      });

      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: res?.data?.reply || 'No response was returned.',
          sources: res?.data?.sources || [],
          contextUsed: Boolean(res?.data?.context_used),
        },
      ]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to get a response right now.';
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: `I could not complete that request. ${msg}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      sx={{
        height: inModal ? '100%' : '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: inModal ? 'transparent' : '#f8fbff',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth={inModal ? false : 'lg'}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: 0,
          px: inModal ? 0 : 3,
          maxWidth: inModal ? '100%' : undefined,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: inModal ? 0 : 4,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: '#fff',
            border: inModal ? 'none' : '1px solid #e2e8f0',
            boxShadow: inModal ? 'none' : '0 20px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Box
            sx={{
              p: { xs: 2, md: 2.75 },
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#0ea5e9', boxShadow: '0 8px 20px rgba(14,165,233,0.22)' }}>
                <HealthAndSafetyIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={850} sx={{ color: '#0f172a', lineHeight: 1.2 }}>
                  Diavise AI Assistant
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.35 }}>
                  Personalized diabetes education and care suggestions from {siteTitle}.
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.35 }}>
                  Educational support only. This assistant does not diagnose or replace a clinician.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: { xs: 2, md: 3 },
              bgcolor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-track': { background: '#e2e8f0' },
              '&::-webkit-scrollbar-thumb': { background: '#94a3b8', borderRadius: 10 },
            }}
          >
            {messages.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                  gap: 2.5,
                  textAlign: 'center',
                }}
              >
                <Avatar sx={{ width: 72, height: 72, bgcolor: '#e0f2fe', color: '#0369a1' }}>
                  <HealthAndSafetyIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={850} sx={{ color: '#0f172a', mb: 1 }}>
                    Ask Diavise about your diabetes care
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620, mx: 'auto', lineHeight: 1.7 }}>
                    Get educational suggestions about diet, exercise, symptoms, medications, and care planning.
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ maxWidth: 680, borderRadius: 2, textAlign: 'left' }}>
                  For urgent symptoms or treatment decisions, contact a qualified healthcare professional.
                </Alert>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.25, width: '100%', maxWidth: 680 }}>
                  {starterPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outlined"
                      onClick={() => sendMessage(prompt)}
                      sx={{ borderRadius: 2, textTransform: 'none', justifyContent: 'flex-start', fontWeight: 750, py: 1.1 }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

            {messages.map((msg, index) => (
              <Box
                key={`${msg.role}-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                  gap: 1.5,
                  alignItems: 'flex-start',
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0369a1', width: 36, height: 36 }}>
                    <HealthAndSafetyIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                )}

                <Box sx={{ maxWidth: { xs: '88%', md: '74%' } }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: msg.role === 'user' ? '#2563eb' : msg.isError ? '#fff7ed' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#1f2937',
                      borderRadius: 2.5,
                      border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                      boxShadow: msg.role === 'assistant' ? '0 8px 22px rgba(15, 23, 42, 0.05)' : 'none',
                      '& p': { margin: 0, marginBottom: 1 },
                      '& p:last-child': { marginBottom: 0 },
                      '& ul, & ol': { margin: '8px 0', paddingLeft: '20px' },
                      '& strong': { fontWeight: 700 },
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#fff' }}>
                        {msg.content}
                      </Typography>
                    )}
                  </Paper>

                  {msg.role === 'assistant' && msg.sources?.length > 0 && (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip icon={<MenuBookIcon />} label="Sources" size="small" sx={{ fontWeight: 750 }} />
                      {msg.sources.slice(0, 3).map((source) => (
                        <Chip
                          key={source.id}
                          label={`[${source.id}] ${String(source.title || 'Source').substring(0, 28)}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.72rem' }}
                        />
                      ))}
                    </Stack>
                  )}

                  {msg.role === 'assistant' && msg.contextUsed && (
                    <Chip
                      icon={<MenuBookIcon sx={{ fontSize: 13 }} />}
                      label="Based on available guidance"
                      size="small"
                      sx={{ mt: 0.75, fontSize: '0.72rem', bgcolor: '#10b981', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
                    />
                  )}
                </Box>

                {msg.role === 'user' && (
                  <Avatar sx={{ bgcolor: '#2563eb', width: 36, height: 36 }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800 }}>
                      You
                    </Typography>
                  </Avatar>
                )}
              </Box>
            ))}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0369a1', width: 36, height: 36 }}>
                  <HealthAndSafetyIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700 }}>
                    Analyzing your question...
                  </Typography>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: { xs: 1.75, md: 2.25 }, bgcolor: '#fff', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-end">
              <TextField
                fullWidth
                minRows={1}
                maxRows={4}
                multiline
                placeholder="Type your question here... (Press Enter to send)"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#fff',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    '&:hover fieldset': { borderColor: '#0ea5e9' },
                    '&.Mui-focused fieldset': { borderColor: '#0ea5e9' },
                  },
                }}
              />
              <IconButton
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                sx={{
                  bgcolor: '#2563eb',
                  color: '#fff',
                  width: 52,
                  height: 52,
                  boxShadow: '0 8px 20px rgba(37,99,235,0.22)',
                  '&:hover': { bgcolor: '#1d4ed8' },
                  '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
                }}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChatAssistant;
