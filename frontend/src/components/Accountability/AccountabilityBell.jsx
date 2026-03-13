import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AccountabilityBell = ({ onMessageClick }) => {
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const fetchUnreadMessages = async () => {
    try {
      const response = await axios.get(`${API}/accountability/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUnreadMessages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
    }
  };
  
  const handleMessageClick = (message) => {
    setIsOpen(false);
    onMessageClick(message);
  };
  
  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      for (const msg of unreadMessages) {
        await axios.patch(
          `${API}/accountability/messages/${msg.id}/read`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
        );
      }
      setUnreadMessages([]);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const unreadCount = unreadMessages.length;
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Accountability Messages
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
                >
                  {loading ? 'Marking...' : 'Mark All Read'}
                </button>
              )}
            </div>
          </div>
          
          {/* Messages List */}
          <div className="max-h-96 overflow-y-auto">
            {unreadMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm">No new accountability messages</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {unreadMessages.slice(0, 5).map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
                          {message.habit_name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {message.message.substring(0, 80)}...
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/accountability');
              }}
              className="w-full text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
            >
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
