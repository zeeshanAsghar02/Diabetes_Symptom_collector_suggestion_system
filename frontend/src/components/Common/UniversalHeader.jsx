import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import {
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Modal,
  TextField,
  Alert,
  IconButton,
  Button,
  Container,
  useTheme,
  LinearProgress,
  Chip,
  Popover,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { differenceInYears, parseISO } from 'date-fns';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import axiosInstance from '../../utils/axiosInstance';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../../utils/auth';
import ThemeToggle from './ThemeToggle';
import { useSettings } from '../../context/SettingsContext';

/** App shell navigation (no duplicate routes; labels are sentence case). */
const NAV_LINKS = [
  { label: 'Home', path: '/dashboard', match: (p) => p === '/dashboard' },
  {
    label: 'Articles',
    path: '/articles',
    match: (p) => p.startsWith('/articles'),
  },
  {
    label: 'Services',
    path: '/personalized-suggestions',
    children: [
      { label: 'Overview', path: '/personalized-suggestions' },
      { label: 'Diet plan', path: '/personalized-suggestions/diet-plan' },
      { label: 'Exercise plan', path: '/personalized-suggestions/exercise-plan' },
    ],
  },
  {
    label: 'Remote monitoring',
    path: '/symptom-assessment',
    children: [
      { label: 'Symptom assessment', path: '/symptom-assessment' },
      { label: 'Assessment (signed in)', path: '/assessment' },
    ],
  },
  { label: 'Media', path: '/content', match: (p) => p.startsWith('/content') },
  { label: 'Community', path: '/feedback', match: (p) => p.startsWith('/feedback') },
];

/** Section anchors on the marketing landing page (`/`). */
const LANDING_NAV = [
  { label: 'Home', hash: '#home' },
  { label: 'About', hash: '#about' },
  { label: 'Blogs & Articles', hash: '#blogs-articles' },
  { label: 'Forum', path: '/feedback' },
  { label: 'Contact', hash: '#contact' },
];

const SOCIALS = [
  { Icon: FacebookIcon, href: 'https://facebook.com', bg: '#1877F2' },
  { Icon: TwitterIcon, href: 'https://twitter.com', bg: '#1DA1F2' },
  { Icon: YouTubeIcon, href: 'https://youtube.com', bg: '#FF0000' },
  { Icon: InstagramIcon, href: 'https://instagram.com', bg: '#000000' },
  { Icon: MusicNoteIcon, href: 'https://tiktok.com', bg: '#010101' },
  { Icon: LinkedInIcon, href: 'https://linkedin.com', bg: '#0A66C2' },
];

/**
 * Header layout — tweak spacing and bar height here (MUI `spacing` units use theme, usually 4px each).
 * `tier2MinHeight` is the main lever for a taller main nav row (plus `tier2Py`).
 */
const HEADER_LAYOUT = {
  tier1Py: { xs: 3, md: 3.5 },
  tier1GridSpacing: 2.75,
  tier1ContactGap: { xs: 2.75, md: 4.5 },
  tier1SocialGap: 1.35,
  containerPx: { xs: 3, sm: 4 },
  tier2Py: { xs: 2.75, md: 3.5 },
  tier2MinHeight: { xs: 80, md: 98 },
  tier2GridSpacing: 3.25,
  logoSlotGap: 2,
  navRowGap: { md: 0.875, lg: 1.65 },
  actionsGap: { xs: 1.35, sm: 1.85, md: 2.15 },
  logoMark: { xs: 48, sm: 52 },
  socialIconBtn: 40,
  authBtnPy: 1.35,
  authBtnPx: { xs: 2.15, sm: 2.85 },
  navLinkMinHeight: { xs: 52, md: 56 },
  navLinkPx: { xs: 1.75, md: 2.5 },
  navLinkPy: { xs: 1.45, md: 1.75 },
  avatarSize: 52,
};

/**
 * Approximate distance from viewport top to the bottom of the sticky header (px).
 * Used by fixed UI (e.g. Dashboard hamburger). On xs, tier1 may stack (contact + social), so this is an upper-bound estimate — adjust if you change `HEADER_LAYOUT`.
 */
export const STICKY_HEADER_OFFSET_PX = { xs: 176, sm: 180 };

const BRAND_TELECARE_FALLBACK = {
  cyan: '#29ABE2',
  lime: '#7AC943',
  navPillBlue: '#3B82F6',
  navPillGradient: 'linear-gradient(90deg, #3B82F6 0%, #29ABE2 100%)',
  topBarGradient: 'linear-gradient(90deg, #29ABE2 0%, #7AC943 100%)',
  ctaGradient: 'linear-gradient(90deg, #7AC943 0%, #29ABE2 100%)',
  onGradient: '#FFFFFF',
  navText: '#1A1A1A',
  navMuted: '#4B5563',
};

export default function UniversalHeader() {
  const theme = useTheme();
  const brand = theme.palette.brandTelecare ?? BRAND_TELECARE_FALLBACK;
  const { siteTitle, contactEmail, contactPhone } = useSettings();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchAnchor, setSearchAnchor] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [dropdownAnchor, setDropdownAnchor] = useState(null);
  const [dropdownLink, setDropdownLink] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const isLanding = pathname === '/';
  const navIdleColor = theme.palette.mode === 'dark' ? theme.palette.text.primary : brand.navText;

  const normalizedTitle = (siteTitle || 'Diabetes Care').trim();
  const titleWords = normalizedTitle.split(/\s+/).filter(Boolean);
  const brandLine1 = titleWords[0] || 'Diabetes';
  const brandLine2 = titleWords.slice(1).join(' ');
  const brandMark = (normalizedTitle[0] || 'D').toUpperCase();
  const supportEmail = (contactEmail || 'support@diabetescare.com').trim();
  const supportPhone = (contactPhone || '+92 323 300 4420').trim();
  const phoneHref = `tel:${supportPhone.replace(/\s+/g, '')}`;

  const linkIsActive = (link) => {
    if (link.match) return link.match(pathname);
    return pathname === link.path || pathname.startsWith(`${link.path}/`);
  };

  const landingLinkActive = (item) => {
    if (!isLanding) return false;
    if (item.path) return pathname.startsWith(item.path);
    const h = location.hash || '';
    const target = item.hash || '#home';
    if (target === '#home') return h === '' || h === '#home';
    return h === target;
  };

  const handleLandingNav = (item) => {
    if (item.path) {
      navigate(item.path);
      return;
    }
    const h = item.hash || '#home';
    if (pathname !== '/') {
      navigate({ pathname: '/', hash: h.replace(/^#/, '') });
      window.requestAnimationFrame(() => {
        document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }
    if (h === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

  /** Shared desktop nav control: larger type + animated underline (scaleX) on hover and when active. */
  const mainNavUnderlineSx = (active, hasChevron) => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: active ? brand.cyan : navIdleColor,
    fontWeight: 600,
    fontSize: { xs: '0.875rem', md: '0.9375rem' },
    letterSpacing: '0.02em',
    lineHeight: 1.45,
    fontFamily: theme.typography.fontFamily,
    px: { xs: HEADER_LAYOUT.navLinkPx.xs, md: HEADER_LAYOUT.navLinkPx.md },
    py: { xs: HEADER_LAYOUT.navLinkPy.xs, md: HEADER_LAYOUT.navLinkPy.md },
    minHeight: { xs: HEADER_LAYOUT.navLinkMinHeight.xs, md: HEADER_LAYOUT.navLinkMinHeight.md },
    minWidth: 0,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    borderRadius: '6px',
    overflow: 'visible',
    transition: 'color 0.2s ease, background-color 0.2s ease',
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '0.75rem',
      right: hasChevron ? '2rem' : '0.75rem',
      bottom: 8,
      height: 2,
      borderRadius: 2,
      bgcolor: brand.cyan,
      transform: active ? 'scaleX(1)' : 'scaleX(0)',
      transformOrigin: 'center',
      opacity: 0.92,
      transition: 'transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
      pointerEvents: 'none',
    },
    '&:hover': {
      bgcolor: alpha(brand.cyan, 0.08),
      color: brand.cyan,
    },
    '&:hover::after': {
      transform: 'scaleX(1)',
    },
    '&:focus-visible': {
      outline: `2px solid ${alpha(brand.cyan, 0.45)}`,
      outlineOffset: 2,
    },
  });

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'One number', test: (pwd) => /\d/.test(pwd) },
    { label: 'One special character', test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
  ];

  const getPasswordStrength = () => {
    const passed = passwordRequirements.filter((req) => req.test(newPassword)).length;
    return (passed / passwordRequirements.length) * 100;
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for global requests to open the Change Password modal (from My Account page)
  useEffect(() => {
    const openHandler = () => handleChangePwOpen();
    window.addEventListener('openChangePassword', openHandler);
    return () => window.removeEventListener('openChangePassword', openHandler);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const userData = await getCurrentUser();
        setUser(userData);
        setEmail(userData.email || '');
      }
    } catch {
      console.log('User not authenticated');
    } finally {
      setLoading(false);
    }
  };

  // Calculate age
  let age = '';
  if (user?.date_of_birth) {
    const dob = typeof user.date_of_birth === 'string' ? parseISO(user.date_of_birth) : user.date_of_birth;
    age = differenceInYears(new Date(), dob);
  }

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLoginClick = () => {
    navigate('/signin');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAnchorEl(null);
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleResendClick = () => {
    setResendSuccess('');
    setResendError('');
    setModalOpen(true);
    setAnchorEl(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleResendSubmit = async (e) => {
    e.preventDefault();
    setResendSuccess('');
    setResendError('');
    setResendLoading(true);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        setResendError('Please enter a valid email address.');
        setResendLoading(false);
        return;
      }
      const res = await axiosInstance.post('/auth/resend-activation', { email });
      const data = res.data;
      if (res.status === 200) {
        setResendSuccess(data.message || 'If your account is inactive, a new activation link has been sent.');
        await checkAuthStatus(); // Refresh user data
      } else {
        setResendError(data.message || 'Failed to send activation link.');
      }
    } catch (err) {
      setResendError(err.response?.data?.message || 'Failed to send activation link.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangePwOpen = () => {
    setChangePwOpen(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwSuccess('');
    setPwError('');
    setAnchorEl(null);
  };

  const handleChangePwClose = () => {
    setChangePwOpen(false);
    // reset modal state when closing
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwSuccess('');
    setPwError('');
  };

  const handleChangePwSubmit = async (e) => {
    e.preventDefault();
    setPwSuccess('');
    setPwError('');
    setPwLoading(true);
    // Frontend validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All fields are required.');
      setPwLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      setPwLoading(false);
      return;
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPwError('Password must be at least 8 characters and include at least 1 letter, 1 number, and 1 symbol.');
      setPwLoading(false);
      return;
    }
    try {
      const res = await axiosInstance.post('/auth/change-password', { currentPassword, newPassword });
      const data = res.data;
      if (res.status === 200) {
        setPwSuccess(data.message || 'Password changed successfully.');
        // Close automatically after success so the modal disappears
        setTimeout(() => {
          handleChangePwClose();
        }, 800);
      } else {
        setPwError(data.message || 'Failed to change password.');
      }
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const closeDropdown = () => {
    setDropdownAnchor(null);
    setDropdownLink(null);
  };

  const openDropdown = (event, link) => {
    if (!link.children?.length) return;
    setDropdownAnchor(event.currentTarget);
    setDropdownLink(link);
  };

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          bgcolor: 'background.paper',
          alignSelf: 'flex-start',
        }}
      >
        {/* Tier 1 — contact + social (Grid: main | auto) */}
        <Box
          sx={{
            background: brand.topBarGradient,
            color: brand.onGradient,
            py: HEADER_LAYOUT.tier1Py,
          }}
        >
          <Container maxWidth="xl" sx={{ px: HEADER_LAYOUT.containerPx }}>
            <Grid container spacing={HEADER_LAYOUT.tier1GridSpacing} alignItems="center" columns={12}>
              <Grid size={{ xs: 12, md: 'grow' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: HEADER_LAYOUT.tier1ContactGap,
                    justifyContent: { xs: 'center', md: 'flex-start' },
                  }}
                >
                  <Box
                    component="a"
                    href={phoneHref}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'inherit',
                      textDecoration: 'none',
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      transition: 'opacity 0.2s ease',
                      '&:hover': { opacity: 0.9, textDecoration: 'underline', textUnderlineOffset: 4 },
                    }}
                  >
                    <PhoneOutlinedIcon sx={{ fontSize: { xs: 20, sm: 22 }, opacity: 0.95 }} />
                    {supportPhone}
                  </Box>
                  <Box
                    component="a"
                    href={`mailto:${supportEmail}`}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'inherit',
                      textDecoration: 'none',
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      transition: 'opacity 0.2s ease',
                      '&:hover': { opacity: 0.9, textDecoration: 'underline', textUnderlineOffset: 4 },
                    }}
                  >
                    <EmailOutlinedIcon sx={{ fontSize: { xs: 20, sm: 22 }, opacity: 0.95 }} />
                    {supportEmail}
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 'auto' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-end' },
                    gap: HEADER_LAYOUT.tier1SocialGap,
                    flexWrap: 'wrap',
                  }}
                >
                  {SOCIALS.map(({ Icon, href, bg }, i) => (
                    <IconButton
                      key={`${href}-${i}`}
                      component="a"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      aria-label="Social link"
                      sx={{
                        width: HEADER_LAYOUT.socialIconBtn,
                        height: HEADER_LAYOUT.socialIconBtn,
                        borderRadius: 1.5,
                        bgcolor: bg,
                        color: '#fff',
                        transition: 'transform 0.2s ease, opacity 0.2s ease',
                        '&:hover': { bgcolor: bg, opacity: 0.92, transform: 'scale(1.06)' },
                      }}
                    >
                      <Icon sx={{ fontSize: 21 }} />
                    </IconButton>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Tier 2 — logo | centered nav | search + CTA (Grid: auto | grow | auto) */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            boxShadow: theme.palette.mode === 'light' ? '0 4px 18px rgba(15, 23, 42, 0.06)' : 'none',
          }}
        >
          <Container maxWidth="xl" sx={{ px: HEADER_LAYOUT.containerPx }}>
            <Grid
              container
              columns={12}
              alignItems="center"
              spacing={HEADER_LAYOUT.tier2GridSpacing}
              sx={{
                py: HEADER_LAYOUT.tier2Py,
                minHeight: HEADER_LAYOUT.tier2MinHeight,
              }}
            >
              <Grid size={{ xs: 'auto', lg: 'auto' }} sx={{ display: 'flex', alignItems: 'center', gap: HEADER_LAYOUT.logoSlotGap }}>
                <IconButton
                  sx={{ display: { xs: 'inline-flex', lg: 'none' }, color: navIdleColor }}
                  onClick={() => setMobileDrawerOpen(true)}
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </IconButton>
                <Box
                  onClick={handleLogoClick}
                  sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: HEADER_LAYOUT.logoSlotGap }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLogoClick();
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: HEADER_LAYOUT.logoMark.xs, sm: HEADER_LAYOUT.logoMark.sm },
                      height: { xs: HEADER_LAYOUT.logoMark.xs, sm: HEADER_LAYOUT.logoMark.sm },
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${brand.cyan} 0%, ${brand.lime} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: brand.onGradient,
                      fontWeight: 800,
                      fontSize: { xs: '1.2rem', sm: '1.35rem' },
                      fontFamily: 'inherit',
                      boxShadow: `0 4px 14px ${alpha(brand.cyan, 0.35)}`,
                    }}
                  >
                    {brandMark}
                  </Box>
                  <Box sx={{ lineHeight: 1.1, display: { xs: 'none', sm: 'block' } }}>
                    <Typography sx={{ fontWeight: 800, fontSize: { sm: '1.125rem', md: '1.1875rem' }, color: brand.cyan, letterSpacing: '-0.02em' }}>
                      {brandLine1}
                    </Typography>
                    {brandLine2 ? (
                      <Typography sx={{ fontWeight: 800, fontSize: { sm: '0.9375rem', md: '1rem' }, color: brand.lime, letterSpacing: '-0.02em' }}>
                        {brandLine2}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              </Grid>

              <Grid
                size={{ xs: false, lg: 'grow' }}
                sx={{
                  display: { xs: 'none', lg: 'flex' },
                  justifyContent: 'center',
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <Box
                  component="nav"
                  aria-label="Main"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: HEADER_LAYOUT.navRowGap,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  {isLanding
                    ? LANDING_NAV.map((item) => {
                        const active = landingLinkActive(item);
                        return (
                          <Button
                            key={item.label}
                            onClick={() => handleLandingNav(item)}
                            sx={mainNavUnderlineSx(active, false)}
                          >
                            {item.label}
                          </Button>
                        );
                      })
                    : NAV_LINKS.map((link) => {
                        const active = linkIsActive(link);
                        const hasSub = Boolean(link.children?.length);
                        return (
                          <Box key={link.label} sx={{ display: 'flex', alignItems: 'center' }}>
                            {hasSub ? (
                              <Button
                                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 20, opacity: 0.85 }} />}
                                onClick={(e) => openDropdown(e, link)}
                                aria-expanded={Boolean(dropdownAnchor && dropdownLink && dropdownLink.path === link.path)}
                                aria-haspopup="true"
                                sx={mainNavUnderlineSx(active, true)}
                              >
                                {link.label}
                              </Button>
                            ) : (
                              <Button component={RouterLink} to={link.path} sx={mainNavUnderlineSx(active, false)}>
                                {link.label}
                              </Button>
                            )}
                          </Box>
                        );
                      })}
                </Box>
              </Grid>

              <Grid
                size={{ xs: 'grow', lg: 'auto' }}
                sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: HEADER_LAYOUT.actionsGap, flexWrap: 'wrap' }}
              >
                <ThemeToggle size="medium" showTooltip />
                <IconButton
                  size="medium"
                  onClick={(e) => setSearchAnchor(e.currentTarget)}
                  aria-label="Search"
                  sx={{ color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : brand.navMuted }}
                >
                  <SearchIcon sx={{ fontSize: 24 }} />
                </IconButton>
                {!loading && user ? (
                  <IconButton onClick={handleAvatarClick} size="large" aria-label="Account menu">
                    <Avatar
                      src={user.avatar || undefined}
                      alt={user.fullName || 'User'}
                      sx={{ bgcolor: brand.cyan, width: HEADER_LAYOUT.avatarSize, height: HEADER_LAYOUT.avatarSize }}
                    >
                      {user.fullName?.[0] || <AccountCircleIcon />}
                    </Avatar>
                  </IconButton>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleLoginClick}
                    sx={{
                      px: HEADER_LAYOUT.authBtnPx,
                      py: HEADER_LAYOUT.authBtnPy,
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      minHeight: 44,
                      textTransform: 'none',
                      color: brand.onGradient,
                      background: isLanding ? brand.navPillGradient : brand.ctaGradient,
                      boxShadow: 'none',
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        background: isLanding ? brand.navPillGradient : brand.ctaGradient,
                        opacity: 0.95,
                        boxShadow: `0 4px 14px ${alpha(brand.cyan, 0.35)}`,
                      },
                    }}
                  >
                    Sign up / Sign in
                  </Button>
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Menu
          anchorEl={dropdownAnchor}
          open={Boolean(dropdownAnchor && dropdownLink)}
          onClose={closeDropdown}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{ paper: { sx: { minWidth: 228, py: 0.5, mt: 0.5, borderRadius: '8px' } } }}
        >
          {dropdownLink?.children?.map((c) => (
            <MenuItem
              key={c.path}
              component={RouterLink}
              to={c.path}
              onClick={closeDropdown}
              sx={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                py: 1.25,
                px: 2,
                borderRadius: '6px',
                mx: 0.5,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(brand.cyan, 0.1),
                  textDecoration: 'underline',
                  textUnderlineOffset: 5,
                  textDecorationColor: brand.cyan,
                },
              }}
            >
              {c.label}
            </MenuItem>
          ))}
        </Menu>

        <Popover
          open={Boolean(searchAnchor)}
          anchorEl={searchAnchor}
          onClose={() => setSearchAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, width: 280 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Search
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search articles, services…"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate('/articles');
                  setSearchAnchor(null);
                }
              }}
            />
          </Box>
        </Popover>

        <Drawer anchor="left" open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)}>
          <Box sx={{ width: 280, pt: 2 }} role="presentation">
            <List>
              {isLanding
                ? LANDING_NAV.map((item) => (
                    <ListItemButton
                      key={item.label}
                      selected={landingLinkActive(item)}
                      onClick={() => {
                        handleLandingNav(item);
                        setMobileDrawerOpen(false);
                      }}
                    >
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} />
                    </ListItemButton>
                  ))
                : NAV_LINKS.map((link) => (
                    <React.Fragment key={link.label}>
                      <ListItemButton
                        component={RouterLink}
                        to={link.path}
                        selected={linkIsActive(link)}
                        onClick={() => setMobileDrawerOpen(false)}
                      >
                        <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 700 }} />
                      </ListItemButton>
                      {link.children?.map((c) => (
                        <ListItemButton
                          key={c.path}
                          component={RouterLink}
                          to={c.path}
                          sx={{ pl: 4 }}
                          onClick={() => setMobileDrawerOpen(false)}
                        >
                          <ListItemText primary={c.label} />
                        </ListItemButton>
                      ))}
                    </React.Fragment>
                  ))}
              {isLanding && !user && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <ListItemButton
                    onClick={() => {
                      handleLoginClick();
                      setMobileDrawerOpen(false);
                    }}
                  >
                    <ListItemText primary="Sign up / Sign in" primaryTypographyProps={{ fontWeight: 700 }} />
                  </ListItemButton>
                </>
              )}
            </List>
          </Box>
        </Drawer>
      </Box>

      {/* User Menu Dropdown */}
      {user && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 1 }}
        >
          <Box px={2} py={1}>
            <Typography variant="subtitle1" fontWeight="bold">{user?.fullName}</Typography>
            <Typography variant="body2" color="textSecondary">{user?.email}</Typography>
            <Typography variant="body2" mt={1}>
              Age: <b>{age}</b>
            </Typography>
            <Typography variant="body2" mt={1}>
              Account status: <b style={{ color: user?.isActivated ? 'green' : 'orange' }}>{user?.isActivated ? 'Active' : 'Inactive'}</b>
            </Typography>
          </Box>
          <Divider />
          <MenuItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeToggle size="small" showTooltip={false} />
            <Typography>Theme</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleChangePwOpen} sx={{ color: '#1976d2', fontWeight: 'bold' }}>
            Change Password
          </MenuItem>
          {!user?.isActivated && (
            <MenuItem onClick={handleResendClick} sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Resend Activation Link
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout} sx={{ color: 'red', fontWeight: 'bold' }}>
            Logout
          </MenuItem>
        </Menu>
      )}

      {/* Resend Activation Modal */}
      <Modal open={modalOpen} onClose={handleModalClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 360,
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Resend Activation Link
          </Typography>
          <form onSubmit={handleResendSubmit}>
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={email}
              onChange={e => setEmail(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {resendSuccess && <Alert severity="success" sx={{ mb: 2 }}>{resendSuccess}</Alert>}
            {resendError && <Alert severity="error" sx={{ mb: 2 }}>{resendError}</Alert>}
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2, fontWeight: 'bold', borderRadius: 2 }}
              type="submit"
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending...' : 'Send Activation Link'}
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={changePwOpen} onClose={handleChangePwClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 360,
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Change Password
          </Typography>
          <form onSubmit={handleChangePwSubmit}>
            <TextField
              label="Current Password"
              type={showCurrentPw ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowCurrentPw((show) => !show)} edge="end">
                    {showCurrentPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="New Password"
              type={showNewPw ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowNewPw((show) => !show)} edge="end">
                    {showNewPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            {newPassword && (
              <Box sx={{ mt: 0.5, mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={getPasswordStrength()}
                  sx={{
                    height: 6,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPasswordStrength() >= 80 ? 'success.main' : getPasswordStrength() >= 50 ? 'warning.main' : 'error.main',
                    },
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {passwordRequirements.map((req, idx) => (
                    <Chip
                      key={idx}
                      icon={req.test(newPassword) ? <CheckCircleIcon /> : undefined}
                      label={req.label}
                      size="small"
                      color={req.test(newPassword) ? 'success' : 'default'}
                      variant={req.test(newPassword) ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <TextField
              label="Confirm New Password"
              type={showConfirmPw ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowConfirmPw((show) => !show)} edge="end">
                    {showConfirmPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            {pwSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwSuccess}</Alert>}
            {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2, fontWeight: 'bold', borderRadius: 2 }}
              type="submit"
              disabled={pwLoading}
            >
              {pwLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </Box>
      </Modal>
    </>
  );
} 
