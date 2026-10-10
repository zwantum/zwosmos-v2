import { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { BlogAdmin } from '../../node_modules/@zwantum/blog-admin/src/index';
// Cache bust: update article button label on edit post
import { blogClient } from '../lib/blogClient';
import { PushNotificationContainer } from './PushNotification';
import '@zwantum/blog-admin/styles.css';
import '@zwantum/blog-editor/styles.css';
import '@zwantum/blog-editor/content.css';
import './BlogsManager.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class BlogAdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BlogAdminErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          margin: '24px auto',
          maxWidth: '800px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #fecaca',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
          color: '#991b1b',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: '#dc2626' }}>
            ⚠️ Blog Editor encountered an issue
          </h2>
          <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#4b5563' }}>
            An unexpected error occurred while rendering the editor:
          </p>
          <pre style={{
            background: '#fef2f2',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#b91c1c',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            margin: '0 0 16px 0'
          }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reload Editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <BlogAdminErrorBoundary>
        <BlogAdmin
          client={blogClient}
          title="Blog"
          subtitle="Manage articles & discussions"
          className="zw-blog-admin-boxed"
        />
      </BlogAdminErrorBoundary>
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
