import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AccountabilityModal = ({ messages, onClose, onResolve }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!messages || messages.length === 0) return null;
  
  const currentMessage = messages[currentIndex];
  
  const handleDismiss = async () => {
    try {
      await axios.patch(
        `${API}/accountability/messages/${currentMessage.id}/dismiss`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      if (currentIndex < messages.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to dismiss message:', error);
      onClose();
    }
  };
  
  const handleLogNow = async () => {
    try {
      await axios.patch(
        `${API}/accountability/messages/${currentMessage.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      onResolve(currentMessage.habit_id);
      onClose();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      onClose();
    }
  };
  
  const goToNext = () => {
    if (currentIndex < messages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-red-500/30 animate-in slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-red-500/20">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
              <h2 className="text-2xl font-bold text-red-500">
                Your Accountability Coach Has Notes
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Agent A detected. Agent B has spoken.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Habit Badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-medium rounded-full border border-orange-500/30">
              {currentMessage.habit_name}
            </span>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
              Streak broken: {currentMessage.streak_broken_days} days
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

          {/* The Message */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-lg text-white italic leading-relaxed">
              "{currentMessage.message}"
            </p>
          </div>

          {/* Journal Reference */}
          {currentMessage.journal_reference && (
            <div className="text-sm text-slate-400 bg-slate-800/30 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">📓 Based on your journal:</p>
              <p className="italic">"{currentMessage.journal_reference}"</p>
            </div>
          )}

          {/* Previous Streak Info */}
          <div className="text-xs text-slate-500 text-center">
            You had a {currentMessage.previous_streak_length} day streak. Let's get it back.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
            >
              😤 I'll Do Better
            </Button>
            <Button
              onClick={handleLogNow}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              ✅ Log It Now
            </Button>
          </div>

          {/* Pagination */}
          {messages.length > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <Button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                variant="ghost"
                size="sm"
                className="text-slate-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-400">
                {currentIndex + 1} of {messages.length}
              </span>
              <Button
                onClick={goToNext}
                disabled={currentIndex === messages.length - 1}
                variant="ghost"
                size="sm"
                className="text-slate-400"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
