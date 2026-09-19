import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './PushNotification.css';

export type PushNotificationType = 'success' | 'error' | 'warning' | 'info';

export interface PushNotificationItem {
  id: string;
  type: PushNotificationType;
  title: string;
  message: string;
  duration?: number;
  leaving?: boolean;
}

export function pushNotify(
  message: string,
  options?: {
    type?: PushNotificationType;
    title?: string;
    duration?: number;
  }
) {
  let inferredType: PushNotificationType = options?.type || 'info';
  let inferredTitle: string = options?.title || '';

  const lower = message.toLowerCase();

  if (!options?.type) {
    if (lower.includes('success') || lower.includes('restored') || lower.includes('copied')) {
      inferredType = 'success';
      if (!inferredTitle) inferredTitle = 'Success';
    } else if (lower.includes('error') || lower.includes('failed') || lower.includes('fail')) {
      inferredType = 'error';
      if (!inferredTitle) inferredTitle = 'Action Failed';
    } else if (lower.includes('required') || lower.includes('invalid') || lower.includes('warning') || lower.includes('please')) {
      inferredType = 'warning';
      if (!inferredTitle) inferredTitle = 'Notice';
    } else {
      inferredType = 'info';
      if (!inferredTitle) inferredTitle = 'Notification';
    }
  }

  if (!inferredTitle) {
    inferredTitle =
      inferredType === 'success'
        ? 'Success'
        : inferredType === 'error'
        ? 'Action Failed'
        : inferredType === 'warning'
        ? 'Notice'
        : 'Update';
  }

  // Clean up message if it has prefix like "Error saving category: Error: "
  let cleanMsg = message.replace(/^Error:\s*/i, '').trim();

  const detail: PushNotificationItem = {
    id: 'zw-push-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    type: inferredType,
    title: inferredTitle,
    message: cleanMsg,
    duration: options?.duration || (inferredType === 'error' ? 6000 : 4500)
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zw-push-notify', { detail }));
  }
}

let containerMounted = false;

export const PushNotificationContainer: React.FC = () => {
  const [isPrimary, setIsPrimary] = useState(false);
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, leaving: true } : n))
    );
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 280);
  }, []);

  useEffect(() => {
    if (containerMounted) {
      // Already an active container mounted
      return;
    }

    containerMounted = true;
    setIsPrimary(true);

    const handlePushEvent = (e: Event) => {
      const customEvent = e as CustomEvent<PushNotificationItem>;
      if (customEvent.detail) {
        setNotifications(prev => [customEvent.detail, ...prev].slice(0, 5));
      }
    };

    window.addEventListener('zw-push-notify', handlePushEvent);

    // Override window.alert across the admin / blog module so alerts never appear in modal popups
    const originalAlert = window.alert;
    (window as any).alert = (msg: any) => {
      const text = typeof msg === 'object' ? JSON.stringify(msg) : String(msg ?? '');
      pushNotify(text);
    };

    return () => {
      containerMounted = false;
      window.removeEventListener('zw-push-notify', handlePushEvent);
      window.alert = originalAlert;
    };
  }, []);

  if (!isPrimary || notifications.length === 0) return null;

  return (
    <div className="zw-push-notifications-wrapper" aria-live="polite">
      {notifications.map(item => (
        <ToastItem key={item.id} item={item} onDismiss={() => removeNotification(item.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  item: PushNotificationItem;
  onDismiss: () => void;
}> = ({ item, onDismiss }) => {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = item.duration || 4500;

  useEffect(() => {
    if (paused) return;

    const interval = 40;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= decrement) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [paused, duration, onDismiss]);

  const renderIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'info':
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div
      className={`zw-push-toast zw-push-toast-${item.type} ${item.leaving ? 'is-leaving' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="alert"
    >
      <div className="zw-push-icon-badge">{renderIcon()}</div>

      <div className="zw-push-content">
        <div className="zw-push-header">
          <div className="zw-push-title">{item.title}</div>
          <button className="zw-push-close" onClick={onDismiss} aria-label="Close notification">
            <X size={15} />
          </button>
        </div>
        <div className="zw-push-message">{item.message}</div>
      </div>

      <div className="zw-push-progress">
        <div
          className="zw-push-progress-bar"
          style={{
            transform: `scaleX(${progress / 100})`,
            transition: 'transform 40ms linear'
          }}
        />
      </div>
    </div>
  );
};
