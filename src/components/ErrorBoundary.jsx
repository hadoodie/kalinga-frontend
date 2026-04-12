import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * ErrorBoundary — catches unhandled React render errors and displays
 * a user-friendly fallback instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console (swap for a remote error reporter later)
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => window.location.reload();
  handleHome = () => (window.location.href = "/#hero");

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>

          <h1 className="text-xl font-bold text-slate-800">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            An unexpected error occurred. You can try reloading the page or
            going back to the home screen.
          </p>

          {/* Error detail (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-600">
              <summary className="cursor-pointer font-semibold">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>
            <button
              onClick={this.handleHome}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
