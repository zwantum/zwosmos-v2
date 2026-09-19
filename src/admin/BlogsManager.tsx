import { BlogAdmin } from '@zwantum/blog/admin';
import { blogClient } from '../lib/blogClient';
import { PushNotificationContainer } from './PushNotification';
import '@zwantum/blog-admin/styles.css';
import '@zwantum/blog-editor/styles.css';
import '@zwantum/blog-editor/content.css';
import './BlogsManager.css';

export default function BlogsManager() {
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
