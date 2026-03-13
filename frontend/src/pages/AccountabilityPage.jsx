import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AlertTriangle, CheckCircle, Loader2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AccountabilityPage = () => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, resolved, dismissed
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [messagesRes, statsRes] = await Promise.all([
        axios.get(`${API}/accountability/messages/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API}/accountability/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setMessages(messagesRes.data.data.messages || []);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Failed to fetch accountability data:', error);
      toast.error('Failed to load accountability data');
    } finally {
      setLoading(false);
    }
  };
  
  const runCheck = async () => {
    setChecking(true);
    toast.info('🔍 Agent A: Scanning habits...');
    
    try {
      const response = await axios.post(
        `${API}/accountability/check`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      const { messages: newMessages, broken_streaks } = response.data.data;
      
      if (newMessages.length > 0) {
        toast.success(`📨 Generated ${newMessages.length} new accountability message(s)`);
        fetchData();
      } else {
        toast.success('✅ No broken streaks found!');
      }
    } catch (error) {
      console.error('Accountability check failed:', error);
      toast.error('Failed to run accountability check');
    } finally {
      setChecking(false);
    }
  };
  
  const markResolved = async (messageId) => {
    try {
      await axios.patch(
        `${API}/accountability/messages/${messageId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      toast.success('✅ Habit redeemed!');
      fetchData();
    } catch (error) {
      console.error('Failed to resolve message:', error);
      toast.error('Failed to mark as resolved');
    }
  };
  
  const dismissMessage = async (messageId) => {
    try {
      await axios.patch(
        `${API}/accountability/messages/${messageId}/dismiss`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      toast.success('Message dismissed');
      fetchData();
    } catch (error) {
      console.error('Failed to dismiss message:', error);
      toast.error('Failed to dismiss message');
    }
  };
  
  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return !msg.is_read;
    if (filter === 'resolved') return msg.is_resolved;
    if (filter === 'dismissed') return msg.is_dismissed;
    return true;
  });
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            Accountability Report
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Your AI agents have been watching
          </p>
        </div>
        <Button
          onClick={runCheck}
          disabled={checking}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              🔍 Auditing...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 mr-2" />
              Run Check Now
            </>
          )}
        </Button>
      </div>
      
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Messages</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {stats.total_messages || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Habits Redeemed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {stats.resolved_count || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Unread</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {stats.unread_count || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Most Broken</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
              {stats.most_broken_habit || 'None'}
            </p>
          </Card>
        </div>
      )}
      
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {['all', 'unread', 'resolved', 'dismissed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            🎉 No accountability messages!
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Your agents found no broken streaks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-6 border-l-4 ${
                !message.is_read
                  ? 'border-red-500'
                  : message.is_resolved
                  ? 'border-emerald-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {message.habit_name}
                  </h3>
                  <span className="px-2 py-1 bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                    {message.streak_broken_days} days missed
                  </span>
                </div>
                {message.is_resolved && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-full">
                    ✅ Redeemed
                  </span>
                )}
                {!message.is_read && !message.is_resolved && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-full">
                    Unread
                  </span>
                )}
                {message.is_dismissed && (
                  <span className="px-3 py-1 bg-slate-500/20 text-slate-600 dark:text-slate-400 text-sm font-medium rounded-full">
                    Dismissed
                  </span>
                )}
              </div>
              
              {/* Message */}
              <p className="text-lg italic text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">
                "{message.message}"
              </p>
              
              {/* Journal Reference */}
              {message.journal_reference && (
                <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-1">📓 Based on:</p>
                  <p className="italic">"{message.journal_reference}"</p>
                </div>
              )}
              
              {/* Agent Reasoning */}
              <div className="text-xs text-slate-500 mb-4">
                🤖 Agent reasoning: {message.agent_reasoning}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-sm text-slate-500">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
                <div className="flex gap-2">
                  {!message.is_resolved && !message.is_dismissed && (
                    <>
                      <Button
                        onClick={() => markResolved(message.id)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        onClick={() => dismissMessage(message.id)}
                        size="sm"
                        variant="outline"
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default AccountabilityPage;
