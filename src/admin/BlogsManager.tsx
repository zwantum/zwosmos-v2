import { useEffect } from 'react';
import { BlogAdmin } from '@zwantum/blog/admin';
import { blogClient } from '../lib/blogClient';
import { PushNotificationContainer } from './PushNotification';
import '@zwantum/blog-admin/styles.css';
import '@zwantum/blog-editor/styles.css';
import '@zwantum/blog-editor/content.css';
import './BlogsManager.css';

export default function BlogsManager() {
  useEffect(() => {
    // Prevent toolbar buttons and bubble menu buttons from stealing focus / collapsing selection on mousedown
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const toolbarBtn = target?.closest?.('.zw-blog-toolbar-btn, .zw-blog-editor-toolbar button, .zw-blog-bubble-menu button');
      if (toolbarBtn) {
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <div className="zw-blog-admin-box-wrapper">
      <PushNotificationContainer />
      <BlogAdmin
        client={blogClient}
        title="Blog"
        subtitle="Manage articles & discussions"
        className="zw-blog-admin-boxed"
      />
      {/* Exactly one clean copyright line in the blog module */}
      <div className="zw-single-copyright-bar">
        <span>© {new Date().getFullYear()} Zwantum</span>
        <span className="zw-copyright-dot">•</span>
        <span>
          Powered by <strong style={{ color: '#0f172a', fontWeight: 600 }}>Zwantum</strong>
        </span>
      </div>
    </div>
  );
}
