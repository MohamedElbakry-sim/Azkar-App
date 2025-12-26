import React from 'react';
import ErrorState from './ErrorState';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch rendering errors in the component tree.
 */
// Fix: Explicitly extending React.Component ensures base class members like props, state, and setState are correctly recognized
class ErrorBoundary extends React.Component<Props, State> {
  // Use property initializer for state
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  // Update state so the next render will show the fallback UI.
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Lifecycle method for logging errors
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  // Handle retry logic to reset state and attempt reload
  private handleRetry = () => {
    // Fix: Access setState from the inherited React.Component class
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  // Render method to display fallback UI or children
  public render() {
    // Check inherited state
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4">
            <ErrorState 
                title="عذراً، حدث خطأ ما"
                message="واجه التطبيق خطأ غير متوقع. يرجى المحاولة مرة أخرى أو تحديث الصفحة."
                onRetry={this.handleRetry}
                fullScreen={true}
            />
        </div>
      );
    }

    // Fix: Access inherited props to return children
    return this.props.children;
  }
}

export default ErrorBoundary;
