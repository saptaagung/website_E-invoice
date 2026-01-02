import { createContext, useContext, useEffect, useState } from 'react';
import { settings as settingsApi } from '../lib/api';

const SettingsContext = createContext(null);

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        companyName: '',
        logo: '',
        loading: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await settingsApi.get();
                setSettings({
                    companyName: data?.companyName || '',
                    logo: data?.logo || '',
                    loading: false,
                });
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                setSettings(prev => ({ ...prev, loading: false }));
            }
        };

        fetchSettings();
    }, []);

    const refreshSettings = async () => {
        try {
            const data = await settingsApi.get();
            setSettings({
                companyName: data?.companyName || '',
                logo: data?.logo || '',
                loading: false,
            });
        } catch (error) {
            console.error('Failed to refresh settings:', error);
        }
    };

    return (
        <SettingsContext.Provider value={{ ...settings, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}
