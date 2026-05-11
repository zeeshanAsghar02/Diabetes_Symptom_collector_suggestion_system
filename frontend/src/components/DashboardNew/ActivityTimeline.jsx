import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, alpha } from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
// Icons removed in favor of a minimal colored dot for a cleaner look

const ActivityTimeline = ({ items = [] }) => {
  if (!items.length) {
    return (
      <Box 
        sx={{ 
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          background: (t) => t.palette.background.paper,
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          minHeight: 170,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            bgcolor: alpha('#A78BFA', 0.15),
            color: '#8B5CF6',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.25,
          }}
        >
          <AssignmentOutlinedIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
          No recent activity
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
          Your recent activities and updates
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
          will appear here.
        </Typography>
      </Box>
    );
  }
  return (
    <List dense={false} sx={{ px: 0, py: 0 }}>
      {items.map((it, idx) => (
        <ListItem 
          key={idx} 
          sx={{ 
            alignItems: 'flex-start',
            px: 3,
            py: 2.5,
            mb: idx < items.length - 1 ? 1.5 : 0,
            borderRadius: 2.5,
            background: (t) => t.palette.background.paper,
            border: (t) => `1px solid ${t.palette.divider}`,
            transition: 'background 0.2s ease, transform 0.2s ease',
            '&:hover': {
              background: (t) => alpha(t.palette.text.primary, 0.02),
              transform: 'translateX(2px)',
            }
          }}
        >
          <Box sx={{ mr: 2.5, mt: 0.75 }}>
            <Box 
              sx={{ 
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: (t) => t.palette[it.color] ? t.palette[it.color].main : t.palette.primary.main,
              }}
            />
          </Box>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={900} sx={{ color: 'text.primary' }}>
                  {it.title}
                </Typography>
                <Chip 
                  label={it.type || 'Update'} 
                  variant="outlined"
                  size="small" 
                  sx={{ 
                    height: 22,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }} 
                />
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  {it.description}
                </Typography>
                {it.time && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, letterSpacing: 0.5 }}>
                    {it.time}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ActivityTimeline;
