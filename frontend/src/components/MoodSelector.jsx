import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Mood mappings
const MOOD_OPTIONS = [
  {
    emoji: '😊',
    label: 'Happy',
    keywords: ['happy', 'joy', 'great', 'amazing', 'wonderful', 'fantastic', 'good', 'cheerful']
  },
  {
    emoji: '😔',
    label: 'Sad',
    keywords: ['sad', 'down', 'depressed', 'low', 'unhappy', 'blue', 'gloomy']
  },
  {
    emoji: '😰',
    label: 'Anxious',
    keywords: ['anxious', 'worried', 'stressed', 'nervous', 'tense', 'uneasy', 'concerned']
  },
  {
    emoji: '⚡',
    label: 'Energized',
    keywords: ['energized', 'excited', 'motivated', 'pumped', 'hyped', 'enthusiastic', 'eager']
  },
  {
    emoji: '😐',
    label: 'Neutral',
    keywords: ['neutral', 'okay', 'fine', 'average', 'alright', 'meh', 'normal']
  },
  {
    emoji: '😤',
    label: 'Angry',
    keywords: ['angry', 'frustrated', 'mad', 'irritated', 'annoyed', 'upset', 'furious']
  },
  {
    emoji: '😌',
    label: 'Calm',
    keywords: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'zen', 'chill']
  },
  {
    emoji: '😴',
    label: 'Tired',
    keywords: ['tired', 'exhausted', 'lethargic', 'sleepy', 'fatigued', 'drained', 'weary']
  }
];

const detectMoodFromText = (text) => {
  if (!text || text.trim().length === 0) return null;
  
  const lowerText = text.toLowerCase().trim();
  
  // Find mood that has matching keywords
  for (const mood of MOOD_OPTIONS) {
    if (mood.keywords.some(keyword => lowerText.includes(keyword))) {
      return mood;
    }
  }
  
  return null;
};

export const MoodSelector = ({ value, onChange, className = '' }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [customText, setCustomText] = useState('');
  const [suggestedMood, setSuggestedMood] = useState(null);

  // Initialize from value
  useEffect(() => {
    if (value) {
      // Try to find matching mood from value
      const mood = MOOD_OPTIONS.find(m => 
        value.includes(m.emoji) || value.toLowerCase().includes(m.label.toLowerCase())
      );
      if (mood) {
        setSelectedMood(mood);
        setCustomText('');
      } else {
        setCustomText(value);
      }
    }
  }, []);

  // Detect mood as user types
  useEffect(() => {
    if (customText && !selectedMood) {
      const detected = detectMoodFromText(customText);
      setSuggestedMood(detected);
    } else {
      setSuggestedMood(null);
    }
  }, [customText, selectedMood]);

  const handleMoodClick = (mood) => {
    setSelectedMood(mood);
    setCustomText('');
    setSuggestedMood(null);
    // Send formatted value: "Label Emoji"
    onChange(`${mood.label} ${mood.emoji}`);
  };

  const handleCustomTextChange = (e) => {
    const text = e.target.value;
    setCustomText(text);
    setSelectedMood(null);
    
    // If text matches a keyword, auto-select mood
    const detected = detectMoodFromText(text);
    if (detected) {
      onChange(`${detected.label} ${detected.emoji}`);
    } else {
      onChange(text);
    }
  };

  const handleSuggestionClick = () => {
    if (suggestedMood) {
      handleMoodClick(suggestedMood);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Emoji Selector Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {MOOD_OPTIONS.map((mood) => (
          <Button
            key={mood.label}
            type="button"
            variant="outline"
            onClick={() => handleMoodClick(mood)}
            className={`h-auto py-3 flex flex-col items-center gap-1 transition-all ${
              selectedMood?.label === mood.label
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md scale-105'
                : 'hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
            }`}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className={`text-xs font-medium ${
              selectedMood?.label === mood.label
                ? 'text-violet-700 dark:text-violet-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {mood.label}
            </span>
          </Button>
        ))}
      </div>

      {/* Custom Text Input (Optional) */}
      <div className="space-y-2">
        <label className="text-sm text-slate-600 dark:text-slate-400">
          Or describe your mood:
        </label>
        <input
          type="text"
          value={customText}
          onChange={handleCustomTextChange}
          placeholder="How are you feeling?"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        
        {/* Suggestion Chip */}
        {suggestedMood && !selectedMood && (
          <button
            type="button"
            onClick={handleSuggestionClick}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
          >
            <span className="text-lg">{suggestedMood.emoji}</span>
            <span>Did you mean "{suggestedMood.label}"?</span>
          </button>
        )}
      </div>

      {/* Selected Mood Display */}
      {selectedMood && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
          <span className="text-2xl">{selectedMood.emoji}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
              Feeling {selectedMood.label}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedMood(null);
              onChange('');
            }}
            className="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default MoodSelector;
