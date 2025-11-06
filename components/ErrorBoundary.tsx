import * as React from 'react';

// Fix: Corrected a TypeScript error by explicitly defining the `children` prop,
// which is more robust and avoids potential tooling issues.
interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4" role="alert">
            <div className="bg-gray-800/50 p-8 rounded-xl shadow-lg border border-gray-700 text-center max-w-md">
                <h1 className="text-2xl font-bold text-red-400 mb-4">Oops! Something went wrong.</h1>
                <p className="text-gray-400 mb-6">
                    An unexpected error occurred within the application. Please try refreshing the page to resolve the issue.
                </p>
                <button
                    onClick={this.handleRefresh}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                >
                    Refresh Page
                </button>
            </div>
        </div>
      );
    }

    // FIX: The destructuring on the next line was causing a type error.
    // By returning `this.props.children` directly, we avoid the type inference issue.
    return this.props.children;
  }
}

export default ErrorBoundary;
