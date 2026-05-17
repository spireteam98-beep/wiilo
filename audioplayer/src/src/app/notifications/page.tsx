'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

type NotificationType = 'deposit' | 'transfer';
type NotificationStatus = 'read' | 'unread';

interface Notification {
  id: string;
  type: NotificationType;
  amount: string;
  currency: string;
  time: string;
  date: string;
  status: NotificationStatus;
}

// Mock notifications data
const notifications: Notification[] = [
  { id: '1', type: 'deposit', amount: '0.000045', currency: 'BTC', time: '12:25 am', date: 'Today', status: 'unread' },
  { id: '2', type: 'transfer', amount: '0.000045', currency: 'BTC', time: '1:20 am', date: 'Today', status: 'unread' },
  { id: '3', type: 'deposit', amount: '0.000045', currency: 'BTC', time: '12:25 am', date: 'Today', status: 'unread' },
  { id: '4', type: 'deposit', amount: '2,000', currency: 'USDT', time: '1:20 am', date: 'Yesterday', status: 'unread' },
  { id: '5', type: 'transfer', amount: '0.000045', currency: 'BTC', time: '1:20 am', date: 'Yesterday', status: 'read' },
  { id: '6', type: 'deposit', amount: '2,000', currency: 'USDT', time: '1:20 am', date: '27 August 2022', status: 'read' },
  { id: '7', type: 'transfer', amount: '0.000045', currency: 'BTC', time: '1:20 am', date: '27 August 2022', status: 'read' },
];

// Group notifications by date
const groupByDate = (items: Notification[]) => {
  const groups: { [key: string]: Notification[] } = {};
  items.forEach(item => {
    if (!groups[item.date]) {
      groups[item.date] = [];
    }
    groups[item.date].push(item);
  });
  return groups;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notificationList, setNotificationList] = useState(notifications);

  const filteredNotifications = notificationList.filter(n => {
    if (activeFilter === 'all') return true;
    return n.status === activeFilter;
  });

  const groupedNotifications = groupByDate(filteredNotifications);

  const handleMarkAllAsRead = () => {
    setNotificationList(prev => prev.map(n => ({ ...n, status: 'read' as NotificationStatus })));
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-md relative bg-[#0A0A0A] min-h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-8 pb-6">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <button onClick={handleClose} className="p-1">
            <X className="w-6 h-6 text-white/60" />
          </button>
        </header>

        {/* Filter Tabs */}
        <div className="flex gap-3 px-5 mb-6">
          {(['all', 'unread', 'read'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 py-3 rounded-full text-sm font-medium capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-[#3D2A2A] text-white'
                  : 'bg-[#1E1E1E] text-white/50'
              }`}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Sub-header */}
        <div className="flex items-center justify-between px-5 mb-4">
          <span className="text-white/50 text-sm">All Notifications</span>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-[#F97316] text-sm font-medium"
          >
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className="px-5">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              {/* Date Label */}
              <p className="text-white/40 text-sm mb-4 mt-6 first:mt-0">{date}</p>
              
              {/* Notification Items */}
              {items.map((notification) => (
                <div key={notification.id} className="mb-1">
                  <div className="py-4">
                    {/* Title Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {notification.status === 'unread' && (
                          <div className="w-2 h-2 rounded-full bg-[#F97316]" />
                        )}
                        <span className={`font-semibold capitalize ${
                          notification.status === 'unread' ? 'text-white' : 'text-white/60'
                        }`}>
                          {notification.type}
                        </span>
                      </div>
                      <span className="text-white/40 text-sm">{notification.time}</span>
                    </div>
                    
                    {/* Message */}
                    <p className="text-white/60 text-sm">
                      Your {notification.type} of{' '}
                      <span className="text-[#F97316] font-semibold">
                        {notification.amount}{notification.currency}
                      </span>
                      {' '}was successful.
                    </p>
                  </div>
                  
                  {/* Separator */}
                  <div className="h-[1px] bg-white/10" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-white/40 text-sm">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
