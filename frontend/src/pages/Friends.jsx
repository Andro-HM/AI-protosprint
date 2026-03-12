import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [friendsRes, requestsRes, feedRes] = await Promise.all([
        axios.get(`${API}/friends`),
        axios.get(`${API}/friends/requests`),
        axios.get(`${API}/social/feed`),
      ]);
      setFriends(friendsRes.data.data);
      setRequests(requestsRes.data.data);
      setActivityFeed(feedRes.data.data);
    } catch (error) {
      toast.error('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    try {
      await axios.post(`${API}/friends/request`, { friend_email: friendEmail });
      toast.success('Friend request sent!');
      setFriendEmail('');
      setAddDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await axios.post(`${API}/friends/requests/${requestId}/accept`);
      toast.success('Friend request accepted!');
      fetchData();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      await axios.delete(`${API}/friends/${friendId}`);
      toast.success('Friend removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove friend');
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
      <div className="space-y-8" data-testid="friends-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Friends
            </h1>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
              Connect with friends and share your progress
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" data-testid="add-friend-button">
                <UserPlus className="mr-2 h-5 w-5" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Friend</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Friend's email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  data-testid="friend-email-input"
                />
                <Button onClick={sendRequest} className="w-full" data-testid="send-request-button">
                  Send Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Friend Requests */}
        {requests.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Friend Requests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => (
                <Card key={req.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {req.sender?.name}
                      </p>
                      <p className="text-sm text-slate-500">{req.sender?.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => acceptRequest(req.id)}
                        data-testid={`accept-request-${req.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 className="font-heading text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Your Friends ({friends.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend, idx) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {friend.name}
                      </p>
                      <p className="text-sm text-slate-500">{friend.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFriend(friend.id)}
                      className="text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="font-heading text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Recent Activity
          </h2>
          <Card className="p-6">
            {activityFeed.length > 0 ? (
              <div className="space-y-3">
                {activityFeed.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                  >
                    <Users className="h-5 w-5 text-emerald-600" />
                    <div className="flex-1">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {activity.user_name}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400"> completed </span>
                      <span className="font-medium">{activity.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                No recent activity from friends
              </p>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};
