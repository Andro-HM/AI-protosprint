import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bell, Mail, Users, Award, Download } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Settings = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await axios.get(`${API}/notifications/preferences`);
      setPreferences(res.data.data);
    } catch (error) {
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (field, value) => {
    try {
      const res = await axios.put(`${API}/notifications/preferences`, {
        [field]: value,
      });
      setPreferences(res.data.data);
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  const handleExport = async (type, format) => {
    try {
      const response = await axios.get(`${API}/export/${type}/${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8" data-testid="settings-page">
        {/* Header */}
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Settings
          </h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
            Manage your preferences and data
          </p>
        </div>

        {/* Notifications */}
        <Card className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-6 w-6 text-emerald-600" />
            <h2 className="font-heading text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Notifications
            </h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-slate-500" />
                <div>
                  <Label>Email Reminders</Label>
                  <p className="text-sm text-slate-500">
                    Get daily reminders for your habits
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.email_reminders}
                onCheckedChange={(value) =>
                  updatePreference('email_reminders', value)
                }
                data-testid="email-reminders-toggle"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-slate-500" />
                <div>
                  <Label>Daily Summary</Label>
                  <p className="text-sm text-slate-500">
                    Receive end-of-day progress summary
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.daily_summary}
                onCheckedChange={(value) => updatePreference('daily_summary', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-slate-500" />
                <div>
                  <Label>Friend Activity</Label>
                  <p className="text-sm text-slate-500">
                    Notifications when friends complete habits
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.friend_activity}
                onCheckedChange={(value) => updatePreference('friend_activity', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-slate-500" />
                <div>
                  <Label>Streak Milestones</Label>
                  <p className="text-sm text-slate-500">
                    Celebrate when you hit streak milestones
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.streak_milestones}
                onCheckedChange={(value) =>
                  updatePreference('streak_milestones', value)
                }
              />
            </div>

            <div>
              <Label htmlFor="reminder-time">Daily Reminder Time</Label>
              <Input
                id="reminder-time"
                type="time"
                value={preferences?.reminder_time || '09:00'}
                onChange={(e) => updatePreference('reminder_time', e.target.value)}
                className="mt-2 max-w-xs"
                data-testid="reminder-time-input"
              />
            </div>
          </div>
        </Card>

        {/* Data Export */}
        <Card className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Download className="h-6 w-6 text-violet-600" />
            <h2 className="font-heading text-2xl font-semibold text-slate-800 dark:text-slate-100">
              Export Your Data
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Habits Data
                </p>
                <p className="text-sm text-slate-500">
                  Download your habits and completion history
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('habits', 'csv')}
                  data-testid="export-habits-csv"
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('habits', 'pdf')}
                  data-testid="export-habits-pdf"
                >
                  PDF
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Journal Entries
                </p>
                <p className="text-sm text-slate-500">
                  Download all your journal entries
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('journal', 'csv')}
                  data-testid="export-journal-csv"
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('journal', 'pdf')}
                  data-testid="export-journal-pdf"
                >
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
