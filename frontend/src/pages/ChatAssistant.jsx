import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, Typography, TextField, IconButton, Avatar, Fade, Grow, Chip, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReactMarkdown from 'react-markdown';
import axiosInstance from '../utils/axiosInstance';
import { useSettings } from '../context/SettingsContext';

const ChatAssistant = ({ inModal = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { siteTitle } = useSettings();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
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
      const reply = res?.data?.reply || 'No response';
      const sources = res?.data?.sources || [];
      const contextUsed = res?.data?.context_used || false;
      
      setMessages([...nextMessages, { 
        role: 'assistant', 
        content: reply,
        sources: sources,
        contextUsed: contextUsed
      }]);
      setLoading(false);
      
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to get a response right now.';
      setMessages([...nextMessages, { role: 'assistant', content: `Error: ${msg}` }]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ 
      height: inModal ? '100%' : '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: inModal ? 'transparent' : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      overflow: 'hidden',
      position: 'relative',
      m: 0,
      p: 0,
      '&::before': inModal ? {} : {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(139,92,246,0.08), transparent 50%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.08), transparent 50%)',
        zIndex: 0
      }
    }}>
      <Container maxWidth={inModal ? false : "lg"} sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        py: 0,
        px: inModal ? 0 : 3,
        m: 0,
        maxWidth: inModal ? '100%' : undefined,
        position: 'relative',
        zIndex: 1
      }}>
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: inModal ? 0 : 4,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: inModal ? '#fff' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: inModal ? 'none' : 'blur(20px)',
            border: inModal ? 'none' : '1px solid rgba(255,255,255,0.3)',
            boxShadow: inModal ? 'none' : '0 20px 60px rgba(102,126,234,0.3)',
          }}
        >
          {/* Header with modern gradient - hide when inModal */}
          {!inModal && (
            <Box sx={{ 
              background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -50,
                bottom: -50,
                width: 200,
                height: 200,
                background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent)',
                borderRadius: '50%'
              }
            }}>
              <Avatar sx={{ 
                width: 56, 
                height: 56,
                bgcolor: '#8b5cf6',
                animation: loading ? 'pulse 1.5s ease-in-out infinite' : 'none',
                boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                },
              }}>
                <Box component="span" sx={{ fontSize: '2rem' }}>🧑‍⚕️</Box>
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="700" sx={{ color: '#1f2937', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span">🩺</Box> Dr. {siteTitle} AI <Box component="span">✨</Box>
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                {loading ? '🔍 Analyzing your query...' : '💡 Your personalized diabetes assistant'}
              </Typography>
            </Box>
            {/* Floating decorative elements */}
            <Box sx={{ position: 'absolute', top: 10, right: 80, fontSize: '1.5rem', opacity: 0.2, animation: 'float 3s ease-in-out infinite' }}>💬</Box>
            <Box sx={{ position: 'absolute', bottom: 15, right: 50, fontSize: '1.2rem', opacity: 0.15, animation: 'float 4s ease-in-out infinite', animationDelay: '1s' }}>❤️‍🩹</Box>
            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
            `}</style>
          </Box>
          )}

          {/* Chat messages */}
          <Box 
            ref={chatContainerRef}
            sx={{ 
              flex: 1,
              overflowY: 'auto',
              p: 3,
              background: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-track': { background: '#e9ecef', borderRadius: 10 },
              '&::-webkit-scrollbar-thumb': { background: '#1e3c72', borderRadius: 10 },
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                gap: 3,
                position: 'relative'
              }}>
                {/* Decorative floating elements */}
                <Box sx={{ position: 'absolute', top: '20%', left: '15%', fontSize: '2rem', opacity: 0.1, animation: 'float 3s ease-in-out infinite' }}>💊</Box>
                <Box sx={{ position: 'absolute', top: '30%', right: '20%', fontSize: '2.5rem', opacity: 0.1, animation: 'float 4s ease-in-out infinite', animationDelay: '1s' }}>🩺</Box>
                <Box sx={{ position: 'absolute', bottom: '25%', left: '10%', fontSize: '2rem', opacity: 0.1, animation: 'float 3.5s ease-in-out infinite', animationDelay: '0.5s' }}>📊</Box>
                <Box sx={{ position: 'absolute', bottom: '30%', right: '15%', fontSize: '2rem', opacity: 0.1, animation: 'float 4.5s ease-in-out infinite', animationDelay: '1.5s' }}>🧬</Box>
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                  }
                `}</style>
                
                <Box sx={{ fontSize: '4rem', animation: 'bounce 2s ease-in-out infinite' }}>🤖</Box>
                <style>{`
                  @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                  }
                `}</style>
                
                <Typography variant="h5" fontWeight="700" sx={{ color: '#1e3c72' }}>
                  👋 Welcome to {siteTitle} Assistant!
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 500 }}>
                  💬 Ask me anything about diabetes management, diet, exercise, medications, or symptoms
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
                  <Chip label="🍎 Diet Advice" sx={{ py: 2, px: 1, fontSize: '0.9rem', bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }} />
                  <Chip label="🏃 Exercise Tips" sx={{ py: 2, px: 1, fontSize: '0.9rem', bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                  <Chip label="💊 Medications" sx={{ py: 2, px: 1, fontSize: '0.9rem', bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }} />
                  <Chip label="📊 Health Tracking" sx={{ py: 2, px: 1, fontSize: '0.9rem', bgcolor: '#f3e5f5', color: '#6a1b9a', fontWeight: 600 }} />
                </Box>
              </Box>
            )}
            
            {messages.map((msg, idx) => (
              <Grow key={idx} in timeout={300}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                  gap: 1.5,
                  alignItems: 'flex-start',
                }}>
                  {msg.role === 'assistant' && (
                    <Avatar sx={{ 
                      bgcolor: 'white',
                      width: 36,
                      height: 36,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>🤖</Box>
                    </Avatar>
                  )}
                  
                  <Box sx={{ maxWidth: '75%' }}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        background: msg.role === 'user' 
                          ? '#1e3c72'
                          : 'white',
                        color: msg.role === 'user' ? '#fff' : '#2c3e50',
                        borderRadius: 2,
                        '& p': { margin: 0, marginBottom: 1 },
                        '& p:last-child': { marginBottom: 0 },
                        '& ul, & ol': { margin: '8px 0', paddingLeft: '20px' },
                        '& strong': { fontWeight: 600 },
                        '& code': { 
                          background: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : '#f1f3f5',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.9em',
                        },
                      }}
                    >
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#ffffff' }}>
                          {msg.content}
                        </Typography>
                      )}
                    </Paper>
                    
                    {/* Display sources for assistant messages */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                          <MenuBookIcon sx={{ fontSize: 14, color: '#1e3c72' }} />
                          <Typography variant="caption" sx={{ color: '#1e3c72', fontWeight: 600 }}>
                            Sources:
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {msg.sources.map((source) => (
                            <Chip
                              key={source.id}
                              label={`[${source.id}] ${source.title.substring(0, 30)}... (${source.country})`}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: 'auto',
                                py: 0.5,
                                '& .MuiChip-label': { px: 1, py: 0.25 },
                                bgcolor: '#e3f2fd',
                                color: '#1e3c72',
                                border: '1px solid #1e3c72',
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                    
                    {/* Context used indicator */}
                    {msg.role === 'assistant' && msg.contextUsed && (
                      <Chip
                        icon={<MenuBookIcon sx={{ fontSize: 12 }} />}
                        label="Based on guidelines"
                        size="small"
                        sx={{
                          mt: 0.5,
                          fontSize: '0.7rem',
                          height: 20,
                          bgcolor: '#10b981',
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    )}
                  </Box>
                  
                  {msg.role === 'user' && (
                    <Avatar sx={{ bgcolor: '#8b5cf6', width: 36, height: 36 }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>👤</Box>
                    </Avatar>
                  )}
                </Box>
              </Grow>
            ))}
            
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'white', width: 36, height: 36, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Box component="span" sx={{ fontSize: '1.2rem' }}>🤖</Box>
                </Avatar>
                <Paper sx={{ 
                  p: 2, 
                  background: 'white',
                  borderRadius: 2,
                }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#8b5cf6',
                          animation: `typing 1.4s ease-in-out ${i * 0.2}s infinite`,
                          '@keyframes typing': {
                            '0%, 60%, 100%': { transform: 'translateY(0)' },
                            '30%': { transform: 'translateY(-8px)' },
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Input area */}
          <Box sx={{ 
            p: 2.5, 
            background: 'white',
            borderTop: '1px solid #e9ecef',
            flexShrink: 0,
          }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'flex-end',
            }}>
              <TextField
                fullWidth
                minRows={1}
                maxRows={4}
                multiline
                placeholder="💬 Type your question here... (Press Enter to send)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '2px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(30,60,114,0.15)',
                      borderColor: '#667eea',
                    },
                    '&:hover fieldset': {
                      borderColor: 'transparent',
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 6px 20px rgba(30,60,114,0.2)',
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'transparent',
                      borderWidth: 0,
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '1rem',
                    fontWeight: 500,
                  }
                }}
              />
              <IconButton 
                onClick={handleSend} 
                disabled={loading || !input.trim()}
                sx={{
                  background: '#8b5cf6',
                  color: 'white',
                  width: 52,
                  height: 52,
                  boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                  '&:hover': {
                    background: '#7c3aed',
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 16px rgba(139,92,246,0.4)',
                  },
                  '&:disabled': {
                    bgcolor: '#e0e0e0',
                    color: '#9e9e9e',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {loading ? (
                  <Box sx={{ animation: 'spin 1s linear infinite' }}>⏳</Box>
                ) : (
                  <SendIcon />
                )}
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChatAssistant;
