import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from './useSocket';
import { toast } from 'sonner';

interface SystemSettingsContextType {
  features: {
    FEATURE_CHAT: boolean;
    FEATURE_REPORTS: boolean;
    FEATURE_TASKS: boolean;
  };
  isFeatureEnabled: (key: 'FEATURE_CHAT' | 'FEATURE_REPORTS' | 'FEATURE_TASKS') => boolean;
  toggleFeature: (key: 'FEATURE_CHAT' | 'FEATURE_REPORTS' | 'FEATURE_TASKS', value: boolean) => Promise<void>;
  isLoading: boolean;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const [features, setFeatures] = useState({
    FEATURE_CHAT: true,
    FEATURE_REPORTS: true,
    FEATURE_TASKS: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial feature flags
  const fetchFeatures = useCallback(async () => {
    try {
      const res = await api.get('/settings/features');
      if (res.data.success) {
        setFeatures(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch system feature flags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Listen for real-time WebSocket updates
  useEffect(() => {
    if (!socket) return;

    const handleFeatureUpdate = (payload: { key: string; value: boolean }) => {
      console.log('Real-time feature flag updated:', payload);
      setFeatures((prev) => {
        const next = { ...prev, [payload.key]: payload.value };
        
        // Optionally notify the user via a toast if it affects their active view
        const label =
          payload.key === 'FEATURE_CHAT' ? 'Messaging' :
          payload.key === 'FEATURE_REPORTS' ? 'Reports' :
          'Tasks';

        if (!payload.value) {
          toast.warning(`The ${label} module has been temporarily disabled by an administrator.`);
        } else {
          toast.success(`The ${label} module has been enabled by an administrator.`);
        }

        return next;
      });
    };

    socket.on('feature_flag_update', handleFeatureUpdate);

    return () => {
      socket.off('feature_flag_update', handleFeatureUpdate);
    };
  }, [socket]);

  // Toggle feature flag (restricted to SUPER_ADMIN/ADMIN on backend)
  const toggleFeature = async (key: 'FEATURE_CHAT' | 'FEATURE_REPORTS' | 'FEATURE_TASKS', value: boolean) => {
    try {
      const res = await api.put('/settings/features', { key, value });
      if (res.data.success) {
        setFeatures((prev) => ({ ...prev, [key]: value }));
        toast.success(`Feature toggle updated successfully`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update feature toggle';
      toast.error(msg);
      throw err;
    }
  };

  const isFeatureEnabled = useCallback(
    (key: 'FEATURE_CHAT' | 'FEATURE_REPORTS' | 'FEATURE_TASKS') => {
      return features[key] !== false;
    },
    [features]
  );

  return (
    <SystemSettingsContext.Provider value={{ features, isFeatureEnabled, toggleFeature, isLoading }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
}
