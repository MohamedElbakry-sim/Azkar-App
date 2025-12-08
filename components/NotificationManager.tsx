
import React, { useEffect, useRef } from 'react';
import * as storage from '../services/storage';

const NotificationManager: React.FC = () => {
  const lastCheckedMinute = useRef<string | null>(null);

  useEffect(() => {
    // Check permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
        // We generally don't want to spam request on load, but for a web app feature
        // it's often better to wait for a user action. 
        // However, the manager needs permission to work.
        // We will rely on the Settings page to trigger the initial request,
        // but this effect ensures we are ready if permission was already granted.
    }

    const checkReminders = () => {
      // 1. Get current time
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Prevent multiple triggers in the same minute
      if (lastCheckedMinute.current === currentTime) return;
      lastCheckedMinute.current = currentTime;

      // 2. Check against reminders
      const reminders = storage.getReminders();
      const matchingReminders = reminders.filter(r => r.enabled && r.time === currentTime);

      if (matchingReminders.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
        matchingReminders.forEach(reminder => {
          try {
            // Try to use Service Worker registration if available (better for mobile)
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('تذكير من نور', {
                        body: reminder.label,
                        icon: '/pwa-192x192.png', // Assuming pwa icon path, browser usually handles default
                        tag: `nour-reminder-${reminder.id}`,
                        lang: 'ar',
                        dir: 'rtl'
                    });
                });
            } else {
                // Fallback to standard Notification API
                new Notification('تذكير من نور', {
                    body: reminder.label,
                    icon: '/pwa-192x192.png',
                    tag: `nour-reminder-${reminder.id}`,
                    lang: 'ar',
                    dir: 'rtl'
                });
            }
          } catch (e) {
            console.error("Failed to show notification", e);
          }
        });
      }
    };

    // Check every 20 seconds to be safe without consuming too much
    const intervalId = setInterval(checkReminders, 20000);

    return () => clearInterval(intervalId);
  }, []);

  return null; // Headless component
};

export default NotificationManager;
