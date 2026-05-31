import React, { useEffect, useRef, useState } from 'react';
import {
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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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
        bgcolor: '#050816',
        overflow: 'hidden',
        position: 'relative',
        isolation: 'isolate',
        fontFamily: '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -2,
          background: `
            radial-gradient(circle at 18% 8%, rgba(45, 212, 191, 0.14), transparent 30%),
            radial-gradient(circle at 78% 16%, rgba(34, 211, 238, 0.13), transparent 32%),
            radial-gradient(circle at 72% 86%, rgba(167, 139, 250, 0.12), transparent 34%),
            linear-gradient(135deg, #050816 0%, #07101c 52%, #050b13 100%)
          `,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.024) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.024) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(circle at 54% 30%, black, transparent 78%)',
        },
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: 0,
          px: inModal ? 0 : { xs: 2, md: 3 },
          maxWidth: '100%',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <Box
            sx={{
              p: { xs: 2, md: 2.35 },
              borderBottom: 'none',
              background: 'transparent',
            }}
          >
            <Stack direction="row" spacing={1.35} alignItems="center">
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  fontWeight={620}
                  sx={{
                    color: '#fff',
                    lineHeight: 1.18,
                    letterSpacing: '-0.035em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <HealthAndSafetyIcon sx={{ color: '#2dd4bf', fontSize: 20, filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.26))' }} />
                  Diavise AI Assistant
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.58)', mt: 0.35, display: 'block', fontWeight: 520 }}>
                  Personalized diabetes education and care suggestions from {siteTitle}.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: { xs: 2, md: 2.5 },
              pb: { xs: 13, md: 13 },
              bgcolor: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.03)' },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(148,163,184,0.32)', borderRadius: 10 },
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
                  gap: 2,
                  textAlign: 'center',
                }}
              >
                <HealthAndSafetyIcon sx={{ color: '#2dd4bf', fontSize: 38, filter: 'drop-shadow(0 0 18px rgba(45,212,191,0.3))' }} />
                <Box>
                  <Typography variant="h6" fontWeight={560} sx={{ color: '#fff', mb: 0.5, letterSpacing: '-0.04em' }}>
                    Ask Diavise about your diabetes care
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    maxWidth: 680,
                    textAlign: 'center',
                    color: 'rgba(203,213,225,0.5)',
                    fontWeight: 520,
                    lineHeight: 1.65,
                  }}
                >
                  For urgent symptoms or treatment decisions, contact a qualified healthcare professional.
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' },
                    gap: 1,
                    width: '100%',
                    maxWidth: 980,
                    mt: 0.5,
                  }}
                >
                  {starterPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="text"
                      onClick={() => sendMessage(prompt)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        justifyContent: 'center',
                        textAlign: 'left',
                        fontSize: '0.72rem',
                        lineHeight: 1.35,
                        fontWeight: 540,
                        minHeight: 44,
                        py: 0.85,
                        px: 1.1,
                        color: 'rgba(226,232,240,0.62)',
                        bgcolor: 'rgba(255,255,255,0.025)',
                        border: 'none',
                        transition: 'color 220ms ease, background 220ms ease, transform 220ms ease',
                        '&:hover': {
                          color: '#fff',
                          bgcolor: 'rgba(45,212,191,0.075)',
                          transform: 'translateY(-1px)',
                        },
                      }}
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
                  <Avatar sx={{ bgcolor: 'rgba(45,212,191,0.1)', color: '#2dd4bf', width: 36, height: 36 }}>
                    <HealthAndSafetyIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                )}

                <Box sx={{ maxWidth: { xs: '88%', md: '74%' } }}>
                  <Paper
                    elevation={0}
                    sx={{
                  p: 2,
                      bgcolor: msg.role === 'user' ? 'rgba(45,212,191,0.14)' : msg.isError ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.045)',
                      color: msg.role === 'user' ? '#fff' : 'rgba(226,232,240,0.86)',
                      borderRadius: 2.5,
                      border: 'none',
                      boxShadow: 'none',
                      '& p': { margin: 0, marginBottom: 1 },
                      '& p:last-child': { marginBottom: 0 },
                      '& ul, & ol': { margin: '8px 0', paddingLeft: '20px' },
                      '& strong': { fontWeight: 700 },
                      fontSize: '0.92rem',
                      lineHeight: 1.65,
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
                      <Chip
                        icon={<MenuBookIcon />}
                        label="Sources"
                        size="small"
                        sx={{
                          fontWeight: 750,
                          bgcolor: 'rgba(45,212,191,0.1)',
                          color: '#a7f3d0',
                          '& .MuiChip-icon': { color: '#a7f3d0' },
                        }}
                      />
                      {msg.sources.slice(0, 3).map((source) => (
                        <Chip
                          key={source.id}
                          label={`[${source.id}] ${String(source.title || 'Source').substring(0, 28)}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.72rem', color: 'rgba(226,232,240,0.7)', borderColor: 'rgba(255,255,255,0.08)' }}
                        />
                      ))}
                    </Stack>
                  )}

                  {msg.role === 'assistant' && msg.contextUsed && (
                    <Chip
                      icon={<MenuBookIcon sx={{ fontSize: 13 }} />}
                      label="Based on available guidance"
                      size="small"
                      sx={{ mt: 0.75, fontSize: '0.72rem', bgcolor: 'rgba(16,185,129,0.14)', color: '#a7f3d0', '& .MuiChip-icon': { color: '#a7f3d0' } }}
                    />
                  )}
                </Box>

                {msg.role === 'user' && (
                  <Avatar sx={{ bgcolor: 'rgba(34,211,238,0.13)', width: 36, height: 36 }}>
                    <Typography variant="caption" sx={{ color: '#e0f2fe', fontWeight: 800 }}>
                      You
                    </Typography>
                  </Avatar>
                )}
              </Box>
            ))}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(45,212,191,0.1)', color: '#2dd4bf', width: 36, height: 36 }}>
                  <HealthAndSafetyIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.045)', borderRadius: 2.5, border: 'none' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.72)', fontWeight: 700 }}>
                    Analyzing your question...
                  </Typography>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              px: { xs: 2, md: 3 },
              pb: { xs: 2, md: 3 },
              pt: 2,
              pointerEvents: 'none',
              background: 'linear-gradient(180deg, transparent 0%, rgba(5,8,22,0.72) 44%, rgba(5,8,22,0.94) 100%)',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="flex-end"
              sx={{
                maxWidth: 760,
                mx: 'auto',
                minHeight: 58,
                px: 1.35,
                py: 0.85,
                borderRadius: 999,
                bgcolor: '#0b0f19',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 80px rgba(2,6,23,0.34), inset 0 1px 0 rgba(255,255,255,0.04)',
                pointerEvents: 'auto',
              }}
            >
              <Box sx={{ display: 'grid', placeItems: 'center', width: 34, minHeight: 40, color: 'rgba(45,212,191,0.78)' }}>
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
              </Box>
              <TextField
                fullWidth
                minRows={1}
                maxRows={4}
                multiline
                placeholder="Type your question here..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                variant="standard"
                sx={{
                  alignSelf: 'center',
                  '& .MuiInputBase-root': {
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: 1.45,
                    py: 0.5,
                    '&:before': { borderBottom: 'none' },
                    '&:after': { borderBottom: 'none' },
                    '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                  },
                  '& textarea': { color: '#fff' },
                  '& textarea::placeholder': { color: 'rgba(203,213,225,0.48)', opacity: 1 },
                }}
              />
              <IconButton
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                sx={{
                  bgcolor: 'transparent',
                  color: '#2dd4bf',
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: 'rgba(45,212,191,0.08)', color: '#fff' },
                  '&:disabled': { bgcolor: 'transparent', color: 'rgba(148,163,184,0.32)' },
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
