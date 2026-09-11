import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches unexpected render errors in the dashboard subtree so a failing page
 * shows a visible, reportable message instead of a silent blank white screen.
 * (React error boundaries must be class components.)
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Keep the error visible in dev tools/console for debugging and reporting.
    console.error('[ErrorBoundary] Uncaught render error:', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
          <div className="card max-w-md p-8 text-center">
            <div className="gradient-icon-badge mx-auto mb-4 h-12 w-12">
              <span className="text-xl">⚠️</span>
            </div>
            <h1 className="text-lg font-bold text-text-primary">Something went wrong</h1>
            <p className="mt-2 text-sm text-text-secondary">
              An unexpected error occurred while loading this page. Please refresh to try again, and check your
              console for details.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="btn-secondary mt-6 w-full"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}