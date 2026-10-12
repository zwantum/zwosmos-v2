import React from 'react';
import { Component, PropsWithChildren } from 'react';

import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
    constructor(props: PropsWithChildren) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('Portfolio rendering error:', error);
        console.error('Component stack:', errorInfo.componentStack);

        // maybe send this to an error reporting service
    }

    handleRefresh = (): void => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.errorContainer}>
                    <div className={styles.stars}></div>
                    <div className={styles.errorContent}>
                        <div className={styles.icon}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M15 9L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        <h2>Houston, we encountered a glitch</h2>

                        <p className={styles.message}>
                            Something unexpected occurred while loading this page.
                        </p>

                        <div className={styles.errorInfo}>
                            <div className={styles.errorCode}>
                                {this.state.error?.message || this.state.error?.name || 'Error'}
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button
                                onClick={this.handleRefresh}
                                className={`${styles.button} ${styles.primary}`}
                            >
                                <span className={styles.buttonText}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.buttonIcon}>
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                        <path d="M3 3v5h5"></path>
                                    </svg>
                                    Reload Experience
                                </span>
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className={`${styles.button} ${styles.secondary}`}
                            >
                                <span className={styles.buttonText}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.buttonIcon}>
                                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    Return to Home
                                </span>
                            </button>
                        </div>

                        <div className={styles.tip}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.tipIcon}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 8v4"></path>
                                <path d="M12 16h.01"></path>
                            </svg>
                            <p>If the problem persists, try using the latest Chrome or Firefox.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;