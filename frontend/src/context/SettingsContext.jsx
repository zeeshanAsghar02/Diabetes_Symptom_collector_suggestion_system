import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAllSettings, fetchPublicSettings } from '../utils/api';

const SettingsContext = createContext({
    siteTitle: 'DiabetesCare',
    contactEmail: 'support@diabetescare.com',
    contactPhone: '+92 323 300 4420',
    siteDescription: 'Comprehensive diabetes management and symptom tracking system',
    dateFormat: 'DD MMMM, YYYY',
    loading: true,
    refreshSettings: () => {},
});

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        siteTitle: 'DiabetesCare',
        contactEmail: 'support@diabetescare.com',
        contactPhone: '+92 323 300 4420',
        siteDescription: 'Comprehensive diabetes management and symptom tracking system',
        dateFormat: 'DD MMMM, YYYY',
    });
    const [loading, setLoading] = useState(true);

    const loadSettings = async () => {
        try {
            // Prefer backend public settings so title updates across devices.
            // Fallback to cached localStorage/defaults if the backend isn't reachable.
            let publicData = null;
            try {
                const response = await fetchPublicSettings();
                if (response?.success && response?.data) {
                    publicData = response.data;
                }
            } catch (_) {
                // ignore; fallback below
            }

            const siteTitle = publicData?.site_title || localStorage.getItem('site_title') || 'DiabetesCare';
            const contactEmail = publicData?.contact_email || localStorage.getItem('contact_email') || 'support@diabetescare.com';
            const contactPhone = publicData?.contact_phone || localStorage.getItem('contact_phone') || '+92 323 300 4420';
            const siteDescription = publicData?.site_description || localStorage.getItem('site_description') || 'Comprehensive diabetes management and symptom tracking system';
            const dateFormat = publicData?.date_format || localStorage.getItem('date_format') || 'DD MMMM, YYYY';

            setSettings({ siteTitle, contactEmail, contactPhone, siteDescription, dateFormat });

            // Cache public settings locally for faster subsequent loads.
            localStorage.setItem('site_title', siteTitle);
            localStorage.setItem('contact_email', contactEmail);
            localStorage.setItem('contact_phone', contactPhone);
            localStorage.setItem('site_description', siteDescription);
            localStorage.setItem('date_format', dateFormat);
        } catch (error) {
            console.log('Using default settings');
        } finally {
            setLoading(false);
        }
    };

    const refreshSettings = async () => {
        // Always refresh public fields; if authenticated, also refresh via admin endpoint.
        const hasToken = Boolean(localStorage.getItem('accessToken'));

        try {
            setLoading(true);

            let data = null;

            if (hasToken) {
                // Authenticated: fetch all settings from admin endpoint.
                const response = await fetchAllSettings();
                if (response.success && response.data) data = response.data;
            }

            if (!data) {
                // Public fallback
                const response = await fetchPublicSettings();
                if (response?.success && response?.data) data = response.data;
            }

            if (data) {
                const newSettings = {
                    siteTitle: data.site_title || 'DiabetesCare',
                    contactEmail: data.contact_email || 'support@diabetescare.com',
                    contactPhone: data.contact_phone || localStorage.getItem('contact_phone') || '+92 323 300 4420',
                    siteDescription: data.site_description || 'Comprehensive diabetes management and symptom tracking system',
                    dateFormat: data.date_format || 'DD MMMM, YYYY',
                };

                setSettings(newSettings);

                localStorage.setItem('site_title', newSettings.siteTitle);
                localStorage.setItem('contact_email', newSettings.contactEmail);
                localStorage.setItem('contact_phone', newSettings.contactPhone);
                localStorage.setItem('site_description', newSettings.siteDescription);
                localStorage.setItem('date_format', newSettings.dateFormat);
            }
        } catch (error) {
            console.log('Error loading settings, using defaults');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
        
        // Refresh when user logs in
        const handleStorageChange = () => {
            if (localStorage.getItem('accessToken')) {
                refreshSettings();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Also check on mount if user is logged in
        if (localStorage.getItem('accessToken')) {
            refreshSettings();
        }
        
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <SettingsContext.Provider value={{ ...settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
