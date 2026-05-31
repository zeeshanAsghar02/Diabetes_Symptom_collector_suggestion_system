import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import axiosInstance from '../../../utils/axiosInstance';

const monoFont = '"JetBrains Mono", "Roboto Mono", Consolas, monospace';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const formatDob = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function LockedProfileLine({ label, value }) {
  return (
    <Box sx={{ opacity: 0.5, cursor: 'not-allowed' }}>
      <Typography
        sx={{
          color: '#64748B',
          fontFamily: monoFont,
          fontSize: '0.68rem',
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          mb: 0.8,
        }}
      >
        {label}
      </Typography>
      <input
        value={value || 'Not recorded'}
        readOnly
        aria-label={label}
        style={{
          width: '100%',
          border: 0,
          outline: 0,
          padding: '0 0 10px',
          color: '#FFFFFF',
          background: 'transparent',
          fontSize: '1.05rem',
          fontWeight: 760,
          cursor: 'not-allowed',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      />
    </Box>
  );
}

function PasswordField({ label, name, value, onChange }) {
  return (
    <Box sx={{ mb: 2.6 }}>
      <Typography
        sx={{
          color: '#64748B',
          fontFamily: monoFont,
          fontSize: '0.68rem',
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          mb: 0.7,
        }}
      >
        {label}
      </Typography>
      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        autoComplete="off"
        style={{
          width: '100%',
          border: 0,
          outline: 0,
          background: 'transparent',
          color: '#FFFFFF',
          fontSize: '1rem',
          letterSpacing: '0.03em',
          padding: '2px 0 12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
        }}
        onFocus={(event) => {
          event.currentTarget.style.borderBottomColor = '#22D3EE';
          event.currentTarget.style.boxShadow = '0 1px 0 rgba(34,211,238,0.85)';
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.1)';
          event.currentTarget.style.boxShadow = 'none';
        }}
      />
    </Box>
  );
}

export default function MyProfileView({ user }) {
  const isDiagnosed = user?.diabetes_diagnosed === 'yes';
  const diagnosedCanvasBackground = `
    radial-gradient(circle at 14% 12%, rgba(52, 211, 153, 0.16), transparent 30%),
    radial-gradient(circle at 82% 10%, rgba(34, 211, 238, 0.15), transparent 32%),
    radial-gradient(circle at 70% 82%, rgba(167, 139, 250, 0.13), transparent 34%),
    linear-gradient(135deg, #050816 0%, #07101c 50%, #050b13 100%)
  `;
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const securitySubtitle = useMemo(() => {
    const provider = user?.auth_provider || user?.provider || 'password';
    return `Account security status: authenticated via ${String(provider).toUpperCase()} layer`;
  }, [user]);

  const canSubmit = form.currentPassword
    && form.newPassword
    && form.confirmNewPassword
    && form.newPassword === form.confirmNewPassword
    && passwordPattern.test(form.newPassword);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({
        type: 'error',
        message: 'Use 8+ characters with letters, a number, a special character, and matching confirmation.',
      });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: '', message: '' });
      await axiosInstance.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setStatus({ type: 'success', message: 'Password rotation completed successfully.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Password rotation failed. Please verify your current password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        minHeight: '100vh',
        bgcolor: isDiagnosed ? 'transparent' : '#090D16',
        background: isDiagnosed ? diagnosedCanvasBackground : '#090D16',
        color: '#FFFFFF',
        px: { xs: 2, md: isDiagnosed ? '42px' : 4 },
        py: { xs: 3, md: isDiagnosed ? '34px' : 4.5 },
        fontFamily: '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        '&::before': isDiagnosed ? {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -3,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.026) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.026) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(circle at 54% 30%, black, transparent 78%)',
        } : {},
      }}
    >
      {isDiagnosed && (
        <>
          <Box sx={{ position: 'absolute', zIndex: -2, width: 520, height: 520, left: -210, top: -190, borderRadius: '999px', filter: 'blur(18px)', opacity: 0.8, background: 'radial-gradient(circle, rgba(45, 212, 191, 0.27), transparent 64%)' }} />
          <Box sx={{ position: 'absolute', zIndex: -2, width: 620, height: 620, right: -230, bottom: -260, borderRadius: '999px', filter: 'blur(18px)', opacity: 0.8, background: 'radial-gradient(circle, rgba(129, 140, 248, 0.22), transparent 66%)' }} />
          <Box sx={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', opacity: 0.17, background: `
            radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.44) 0 1px, transparent 1px),
            radial-gradient(circle at 72% 30%, rgba(255, 255, 255, 0.28) 0 1px, transparent 1px),
            radial-gradient(circle at 62% 78%, rgba(255, 255, 255, 0.18) 0 1px, transparent 1px)
          `, backgroundSize: '170px 170px, 230px 230px, 310px 310px' }} />
        </>
      )}

      <Box sx={{ maxWidth: isDiagnosed ? 'none' : 1180 }}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ color: '#FFFFFF', fontWeight: 880, fontSize: { xs: '1.8rem', md: '2.35rem' }, letterSpacing: '-0.02em' }}>
            My Profile
          </Typography>
          <Typography sx={{ color: 'rgba(203,213,225,0.64)', mt: 0.7, fontFamily: monoFont, fontSize: '0.78rem' }}>
            {securitySubtitle}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.95fr) minmax(420px, 1.05fr)' },
            gap: { xs: 3, md: 4 },
            alignItems: 'start',
          }}
        >
          <Box>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.02)',
                borderRadius: 1.5,
                px: { xs: 2, md: 2.5 },
                py: 2.2,
                mb: 3.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    bgcolor: isDiagnosed ? '#F59E0B' : '#5EEAD4',
                    boxShadow: isDiagnosed ? '0 0 18px rgba(245,158,11,0.62)' : '0 0 18px rgba(94,234,212,0.62)',
                  }}
                />
                <Typography sx={{ color: '#FFFFFF', fontFamily: monoFont, fontWeight: 850, fontSize: { xs: '0.76rem', sm: '0.84rem' }, letterSpacing: '0.08em' }}>
                  {isDiagnosed
                    ? 'SYSTEM PROFILE LAYOUT: DIAGNOSED (DIABETIC)'
                    : 'SYSTEM PROFILE LAYOUT: PRE-DIAGNOSTIC (UNDIAGNOSED)'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gap: 3 }}>
              <LockedProfileLine label="Full Name" value={user?.fullName || user?.name} />
              <LockedProfileLine label="Date Of Birth" value={formatDob(user?.date_of_birth || user?.dateOfBirth || user?.dob)} />
              <LockedProfileLine label="Email Address" value={user?.email} />
            </Box>
          </Box>

          <Box
            sx={{
              bgcolor: '#111827',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 1.5,
              p: { xs: 2.4, md: 3 },
              boxShadow: '0 24px 80px rgba(0,0,0,0.24)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.4, mb: 3 }}>
              <Box sx={{ color: '#67E8F9', display: 'inline-flex', mt: 0.2 }}>
                <ShieldOutlinedIcon />
              </Box>
              <Box>
                <Typography sx={{ color: '#FFFFFF', fontWeight: 840, fontSize: '1.15rem' }}>
                  Change Password
                </Typography>
                <Typography sx={{ color: 'rgba(203,213,225,0.56)', fontSize: '0.82rem', mt: 0.3 }}>
                  Rotate your access credential through the secure password terminal.
                </Typography>
              </Box>
            </Box>

            {status.message && (
              <Alert
                severity={status.type || 'info'}
                sx={{
                  mb: 2.4,
                  bgcolor: status.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                  color: status.type === 'success' ? '#A7F3D0' : '#FDA4AF',
                  border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.22)' : 'rgba(244,63,94,0.22)'}`,
                  '& .MuiAlert-icon': { color: 'inherit' },
                }}
              >
                {status.message}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <PasswordField label="Current Password" name="currentPassword" value={form.currentPassword} onChange={handleChange} />
              <PasswordField label="New Password" name="newPassword" value={form.newPassword} onChange={handleChange} />
              <PasswordField label="Confirm New Password" name="confirmNewPassword" value={form.confirmNewPassword} onChange={handleChange} />

              <Button
                type="submit"
                disabled={loading || !canSubmit}
                startIcon={loading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <LockOutlinedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  mt: 0.6,
                  px: 2.4,
                  py: 1,
                  borderRadius: 1.1,
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  bgcolor: 'rgba(255,255,255,0.02)',
                  textTransform: 'none',
                  fontWeight: 820,
                  '&:hover': {
                    bgcolor: 'rgba(34,211,238,0.08)',
                    borderColor: 'rgba(34,211,238,0.42)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(203,213,225,0.34)',
                    borderColor: 'rgba(255,255,255,0.06)',
                  },
                }}
              >
                {loading ? 'Updating Password' : 'Update Password'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
