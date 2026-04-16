import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught render error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearDraft = () => {
    try {
      localStorage.removeItem("pcr_draft");
      localStorage.removeItem("pcr:print-preview:v1");
    } catch (error) {
      console.error("Failed to clear PCR draft data:", error);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-rose-700">Patient Care Report Error</h1>
            <p className="mt-2 text-sm text-slate-700">
              The Patient Care Report module encountered an error.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Reload Component
              </button>
              <button
                type="button"
                onClick={this.handleClearDraft}
                className="rounded-lg border border-rose-600 px-4 py-2 text-sm font-semibold text-rose-700"
              >
                Clear Draft Data
              </button>
            </div>
            {this.state.error ? (
              <pre className="mt-4 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
