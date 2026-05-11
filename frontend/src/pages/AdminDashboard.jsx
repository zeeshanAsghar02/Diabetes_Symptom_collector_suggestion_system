import React, { useState, useEffect } from 'react';
import {
  Box, CssBaseline, Paper, GlobalStyles, IconButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ManageDiseases from '../admin/ManageDiseases';
import ManageSymptoms from '../admin/ManageSymptoms';
import ManageQuestions from '../admin/ManageQuestions';
import UserManagement from '../admin/UserManagement';
import ManageAdmins from '../admin/ManageAdmins';
import ManageRolesPermissions from '../admin/ManageRolesPermissions';
import DocumentUpload from '../admin/DocumentUpload';
import AdminFeedback from '../admin/AdminFeedback';
import AuditLogs from '../admin/AuditLogs';
import Settings from '../admin/Settings';
import { getCurrentUser, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import CMSManagement from '../cms/pages/CMSManagement';
import SuperAdminSidebar from '../components/Sidebar/SuperAdminSidebar';
import sidebarTokens from '../theme/sidebar-tokens.json';
import { getApiBaseUrl } from '../config/apiBase';

const fontFamily = `'Inter', 'Roboto', 'Open Sans', 'Helvetica Neue', Arial, sans-serif`;
const API_BASE_URL = getApiBaseUrl();

export default function AdminDashboard() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar collapse state
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile drawer state
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.getElementById('inter-font')) {
      const link = document.createElement('link');
      link.id = 'inter-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
    async function fetchUser() {
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptFetch = async () => {
        try {
          // Wait a bit for token to be set if this is right after login
          if (retryCount === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const userData = await getCurrentUser();
          setUser(userData);
          
          // Fetch user roles to determine available sections
          const token = localStorage.getItem('accessToken');
          const rolesResponse = await fetch(`${API_BASE_URL}/api/v1/users/roles`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json();
            setUserRoles(rolesData.data || []);
          }
        } catch (error) {
          // Retry if we haven't exceeded max retries
          if (retryCount < maxRetries && localStorage.getItem('accessToken')) {
            retryCount++;
            setTimeout(attemptFetch, 500);
          } else {
            // Only redirect if there's no token at all
            if (!localStorage.getItem('accessToken')) {
              navigate('/signin');
            }
          }
        }
      };
      
      attemptFetch();
    }
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  // Define sections based on user role
  const getSections = () => {
    const baseSections = [
      { label: 'Manage Diseases', component: <ManageDiseases /> },
      { label: 'Manage Symptoms', component: <ManageSymptoms /> },
      { label: 'Manage Questions', component: <ManageQuestions /> },
      { label: 'User Management', component: <UserManagement /> },
    ];

    // Add CMS management for users with content permissions
    if (userRoles.includes('super_admin') || userRoles.includes('admin')) {
      baseSections.push(
        { label: 'Content Management', component: <CMSManagement /> },
        { label: 'Feedback (Admin)', component: <AdminFeedback /> },
        { label: 'Audit Logs', component: <AuditLogs /> }
      );
    }

    // Add super admin sections if user has super admin role
    if (userRoles.includes('super_admin')) {
      baseSections.push(
        { label: 'Document Upload', component: <DocumentUpload /> },
        { label: 'Manage Admins', component: <ManageAdmins /> },
        { label: 'Manage Roles & Permissions', component: <ManageRolesPermissions /> },
        { label: 'Settings', component: <Settings /> }
      );
    }

    return baseSections;
  };

  const sections = getSections();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <GlobalStyles styles={{ body: { fontFamily }, '*': { fontFamily } }} />
      
      {/* Mobile Sidebar */}
      <SuperAdminSidebar
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggle={() => setMobileOpen(!mobileOpen)}
        selectedIndex={selectedIndex}
        onSectionChange={setSelectedIndex}
        sections={sections}
        user={user}
        onLogout={handleLogout}
        isMobile={true}
      />
      
      {/* Desktop Sidebar */}
      <SuperAdminSidebar
        variant="permanent"
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedIndex={selectedIndex}
        onSectionChange={setSelectedIndex}
        sections={sections}
        user={user}
        onLogout={handleLogout}
        isMobile={false}
      />
      
      {/* Main Content */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 3, md: 4 },
        ml: 0,
        mt: 0,
        minHeight: '100vh',
        bgcolor: 'background.default',
        transition: 'margin 0.3s ease',
        width: { 
          xs: '100%', 
          md: `calc(100% - ${sidebarOpen ? sidebarTokens.width.expanded : sidebarTokens.width.collapsed})` 
        },
      }}>
        {/* Mobile Menu Button */}
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'white',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {sections[selectedIndex]?.component}
        </Box>
      </Box>
    </Box>
  );
} 
