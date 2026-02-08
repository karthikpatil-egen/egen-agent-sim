import { useState, useEffect, useCallback } from 'react';
import { loadConfig, saveConfig } from '../services/adminConfig';

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch((err) => {
        console.error('Failed to load config:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = useCallback(async (section, data) => {
    await saveConfig(section, data);
    setConfig(prev => ({ ...prev, [section]: data }));
  }, []);

  return { config, loading, updateConfig };
}
