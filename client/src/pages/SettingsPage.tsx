import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/layout/Header';
import { Card } from '../components/common/Card';
import { Switch } from '../components/common/Switch';
import { Button } from '../components/common/Button';
import type { AppSettings } from '../types/settings';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const { data: serverSettings, isLoading } = useSettings();
  const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateSettings();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (serverSettings) {
      setSettings(JSON.parse(JSON.stringify(serverSettings)));
    }
  }, [serverSettings]);

  const handleScheduleChange = (days: 60 | 30 | 14 | 7, checked: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      schedule: {
        ...settings.schedule,
        [days]: checked,
      },
    });
  };

  const handleChannelChange = (channel: 'push' | 'email' | 'sms', checked: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      channels: {
        ...settings.channels,
        [channel]: checked,
      },
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await saveSettings(settings);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedAt(timeStr);
      showToast('Settings saved successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      showToast(msg);
    }
  };

  const handleToggleTheme = () => {
    toggleTheme();
    showToast(theme === 'dark' ? 'Switched to Light mode' : 'Switched to Dark mode');
  };

  if (isLoading || !settings) {
    return (
      <Card className="empty">
        <p>Loading settings...</p>
      </Card>
    );
  }

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Choose when and how owners are reminded"
        actions={
          <>
            <Button variant="outline" onClick={handleToggleTheme}>
              {theme === 'dark' ? '☀️ Switch to light mode' : '🌙 Toggle dark mode'}
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save changes
            </Button>
          </>
        }
      />

      {/* Saved State Visual Feedback */}
      {lastSavedAt && (
        <div
          role="status"
          style={{
            background: 'var(--g)',
            color: 'var(--gt)',
            padding: '12px 18px',
            borderRadius: '14px',
            marginBottom: '18px',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ Settings saved successfully and applied to notification schedules.</span>
          <small style={{ color: 'var(--gt)', opacity: 0.85 }}>Last saved at {lastSavedAt}</small>
        </div>
      )}

      {/* Reminder Schedule */}
      <h2 style={{ marginBottom: '10px' }}>Reminder schedule</h2>
      <Card style={{ marginBottom: '24px' }}>
        <Switch
          label="60 days before"
          description="First gentle nudge"
          checked={settings.schedule[60]}
          onChange={(checked: boolean) => handleScheduleChange(60, checked)}
        />
        <Switch
          label="30 days before"
          description="Push and email"
          checked={settings.schedule[30]}
          onChange={(checked: boolean) => handleScheduleChange(30, checked)}
        />
        <Switch
          label="14 days before"
          description="Escalates to SMS"
          checked={settings.schedule[14]}
          onChange={(checked: boolean) => handleScheduleChange(14, checked)}
        />
        <Switch
          label="7 days before"
          description="Final warning, repeated until renewed"
          checked={settings.schedule[7]}
          onChange={(checked: boolean) => handleScheduleChange(7, checked)}
        />
      </Card>

      {/* Channels */}
      <h2 style={{ marginBottom: '10px' }}>Channels</h2>
      <Card>
        <Switch
          label="Push notification"
          description="Free, works from the installed app"
          checked={settings.channels.push}
          onChange={(checked: boolean) => handleChannelChange('push', checked)}
        />
        <Switch
          label="Email backup"
          description="Includes a calendar invite"
          checked={settings.channels.email}
          onChange={(checked: boolean) => handleChannelChange('email', checked)}
        />
        <Switch
          label="SMS fallback"
          description="For low-connectivity areas"
          checked={settings.channels.sms}
          onChange={(checked: boolean) => handleChannelChange('sms', checked)}
        />
      </Card>
    </div>
  );
};
