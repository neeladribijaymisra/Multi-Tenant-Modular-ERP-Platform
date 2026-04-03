import React from "react";

const STORAGE_KEY = "erp-user-session";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected application error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AYRA ERP runtime error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup errors and still reload.
    }

    window.location.href = "/cgu/login";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef6f3_100%)] px-6 py-10">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-rose-200 bg-white p-8 shadow-2xl shadow-slate-200/70">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-600">Recovery Mode</p>
            <h1 className="mt-3 text-3xl font-extrabold text-slate-950">The dashboard hit a runtime error.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Your project files are still present. The app has been stopped from showing a blank screen so
              we can recover cleanly.
            </p>
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Error Message</p>
              <p className="mt-3 break-words font-mono text-sm text-slate-700">{this.state.errorMessage}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Clear Session and Return to Login
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
