import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Star, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Mood mappings (matching backend)
const MOOD_EMOJIS = {
  "Happy": "😊",
  "Calm": "🌊",
  "Anxious": "😰",
  "Energized": "⚡",
  "Sad": "😔",
  "Neutral": "😐",
  "Overwhelmed": "🌪️",
  "Excited": "🎉",
  "Lethargic": "😴",
  "Motivated": "💪"
};

const MOOD_COLORS = {
  "Happy": "#10B981",
  "Excited": "#F59E0B",
  "Motivated": "#06B6D4",
  "Energized": "#84CC16",
  "Calm": "#0EA5E9",
  "Neutral": "#6B7280",
  "Anxious": "#F97316",
  "Overwhelmed": "#EF4444",
  "Sad": "#8B5CF6",
  "Lethargic": "#9CA3AF"
};

const MOOD_TO_VALUE = {
  "Happy": 5,
  "Excited": 5,
  "Motivated": 5,
  "Energized": 4,
  "Calm": 4,
  "Neutral": 3,
  "Anxious": 2,
  "Overwhelmed": 2,
  "Sad": 1,
  "Lethargic": 1
};

const getMoodBaseName = (moodStr) => {
  for (const name of Object.keys(MOOD_EMOJIS)) {
    if (moodStr?.includes(name)) return name;
  }
  return "Neutral";
};

export const EmotionalDashboard = () => {
  const [chartData, setChartData] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [commonThemes, setCommonThemes] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [dateRange, setDateRange] = useState(14);

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSentimentData(),
        fetchWeeklySummary(),
        fetchCommonThemes()
      ]);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentimentData = async () => {
    try {
      const res = await axios.get(`${API}/journal?limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const entries = res.data.data || [];
      
      // Get last 14 days
      const last14Days = [];
      for (let i = 13; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = entries.find(e => e.entry_date === dateStr);
        
        if (entry) {
          const moodName = getMoodBaseName(entry.mood);
          last14Days.push({
            date: format(date, 'MMM d'),
            fullDate: dateStr,
            mood: moodName,
            emoji: MOOD_EMOJIS[moodName],
            value: MOOD_TO_VALUE[moodName],
            color: MOOD_COLORS[moodName],
            content: entry.content
          });
        } else {
          last14Days.push({
            date: format(date, 'MMM d'),
            fullDate: dateStr,
            mood: null,
            value: 0,
            color: "#E5E7EB"
          });
        }
      }
      
      setChartData(last14Days);
      setCalendarData(last14Days);
    } catch (error) {
      console.error('Failed to fetch sentiment data:', error);
    }
  };

  const fetchWeeklySummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await axios.post(`${API}/ai/weekly-summary`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.data.success) {
        setWeeklySummary(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch weekly summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchCommonThemes = async () => {
    try {
      const res = await axios.get(`${API}/journal?limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const entries = res.data.data || [];
      const themeCounts = {};
      
      // Extract themes from content (simple keyword extraction)
      const keywords = ['work', 'exercise', 'meditation', 'reading', 'sleep', 'family', 'goals', 'stress', 'health', 'routine'];
      
      entries.forEach(entry => {
        const content = entry.content.toLowerCase();
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            themeCounts[keyword] = (themeCounts[keyword] || 0) + 1;
          }
        });
      });
      
      const themes = Object.entries(themeCounts)
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setCommonThemes(themes);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      if (!data.mood) return null;
      
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{data.date}</p>
          <p className="text-white text-lg">{data.emoji} {data.mood}</p>
          {data.content && (
            <p className="text-slate-300 text-sm mt-1 max-w-xs">
              {data.content.substring(0, 50)}...
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderWeeklySummary = () => {
    if (loadingSummary) {
      return (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
      );
    }

    if (!weeklySummary) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">No weekly summary available yet</p>
          <Button onClick={fetchWeeklySummary} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate Summary
          </Button>
        </div>
      );
    }

    const getRatingLabel = (rating) => {
      if (rating <= 2) return { label: "Tough Week", emoji: "😔", color: "text-red-400" };
      if (rating <= 4) return { label: "Mixed Week", emoji: "😐", color: "text-orange-400" };
      if (rating === 5) return { label: "Good Week", emoji: "😊", color: "text-blue-400" };
      if (rating === 6) return { label: "Great Week", emoji: "⚡", color: "text-green-400" };
      return { label: "Amazing Week", emoji: "🌟", color: "text-yellow-400" };
    };

    const ratingInfo = getRatingLabel(weeklySummary.rating || 3);

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            📊 Weekly Emotional Summary
          </h3>
          <p className="text-sm text-slate-400">
            Week of {format(subDays(new Date(), 7), 'MMM d')} - {format(new Date(), 'MMM d')}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{ratingInfo.emoji}</span>
            <span className={`text-lg font-semibold ${ratingInfo.color}`}>
              {weeklySummary.rating}/7 - {ratingInfo.label}
            </span>
          </div>
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < weeklySummary.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {weeklySummary.summary && (
          <p className="text-slate-300 leading-relaxed">{weeklySummary.summary}</p>
        )}

        {weeklySummary.patterns && (
          <div>
            <p className="text-sm font-semibold text-violet-400 mb-1">🔍 Patterns Noticed:</p>
            <p className="text-slate-300 text-sm">{weeklySummary.patterns}</p>
          </div>
        )}

        {weeklySummary.insight && (
          <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-3">
            <p className="text-sm font-semibold text-violet-300 mb-1">💡 This Week's Insight:</p>
            <p className="text-white text-sm">{weeklySummary.insight}</p>
          </div>
        )}

        <Button
          onClick={fetchWeeklySummary}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              🧠 Emotional Insights
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Your mental wellness patterns over time
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateRange === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(7)}
            >
              Last 7 days
            </Button>
            <Button
              variant={dateRange === 14 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(14)}
            >
              Last 14 days
            </Button>
            <Button
              variant={dateRange === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(30)}
            >
              Last 30 days
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <>
            {/* Section 1: Sentiment Timeline */}
            <Card className="p-6 bg-slate-900 border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4">
                📈 Sentiment Timeline
              </h2>
              {chartData.filter(d => d.mood).length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-4">📓</p>
                  <p className="text-slate-400 text-lg">
                    No journal entries yet. Start journaling to see your emotional timeline!
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#94A3B8"
                        tick={{ fill: '#94A3B8' }}
                      />
                      <YAxis
                        domain={[0, 6]}
                        ticks={[1, 2, 3, 4, 5]}
                        stroke="#94A3B8"
                        tick={{ fill: '#94A3B8' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {Object.entries(MOOD_COLORS).map(([mood, color]) => (
                      <div key={mood} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                        <span className="text-xs text-slate-400">
                          {MOOD_EMOJIS[mood]} {mood}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Section 2: Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Summary */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                {renderWeeklySummary()}
              </Card>

              {/* Common Themes */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-xl font-semibold text-white mb-4">
                  🏷️ Common Themes
                </h3>
                {commonThemes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No themes identified yet</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {commonThemes.map(({ theme, count }) => {
                      const size = count === 1 ? 'text-sm opacity-60' :
                                  count <= 3 ? 'text-base opacity-80' :
                                  count <= 5 ? 'text-lg opacity-90' :
                                  'text-xl font-bold opacity-100';
                      
                      return (
                        <span
                          key={theme}
                          className={`px-3 py-1.5 bg-violet-900/20 text-violet-300 rounded-full border border-violet-500/30 ${size} capitalize`}
                        >
                          {theme} ({count})
                        </span>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Section 3: 14-Day Calendar */}
            <Card className="p-6 bg-slate-900 border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4">
                📅 14-Day Mood Calendar
              </h2>
              <div className="grid grid-cols-7 gap-3">
                {calendarData.map((day, index) => {
                  const isToday = day.fullDate === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <button
                      key={index}
                      onClick={() => day.mood && setSelectedDay(day)}
                      className={`relative aspect-square rounded-lg p-3 transition-all ${
                        day.mood
                          ? 'hover:scale-105 hover:shadow-lg cursor-pointer'
                          : 'opacity-40 cursor-default'
                      } ${isToday ? 'ring-2 ring-violet-500' : ''}`}
                      style={{ backgroundColor: day.color }}
                    >
                      <div className="text-xs text-white/70 font-medium">
                        {format(new Date(day.fullDate), 'EEE')}
                      </div>
                      <div className="text-white font-bold">
                        {format(new Date(day.fullDate), 'd')}
                      </div>
                      {day.emoji && (
                        <div className="text-2xl mt-1">{day.emoji}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Side Panel for Selected Day */}
            {selectedDay && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end"
                   onClick={() => setSelectedDay(null)}>
                <div className="bg-slate-900 w-full max-w-md h-full p-6 overflow-y-auto animate-in slide-in-from-right"
                     onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      {format(new Date(selectedDay.fullDate), 'MMMM d, yyyy')}
                    </h3>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{selectedDay.emoji}</span>
                      <span className="text-2xl font-semibold text-white">
                        {selectedDay.mood}
                      </span>
                    </div>
                    
                    {selectedDay.content && (
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-300 leading-relaxed">
                          {selectedDay.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default EmotionalDashboard;
