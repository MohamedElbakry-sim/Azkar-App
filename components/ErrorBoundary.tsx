import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorState from './ErrorState';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch rendering errors in the component tree.
 */
// Fix: Import Component directly and extend it to ensure TypeScript correctly resolves inherited members like setState and props.
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  // Update state so the next render will show the fallback UI.
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Lifecycle method for logging errors
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  // Handle retry logic to reset state and attempt reload
  // Fix: Component inheritance makes setState available to the class instance.
  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  // Render method to display fallback UI or children
  public render() {
    // Fix: Proper access to state and props from the Component base class.
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

    return this.props.children;
  }
}

export default ErrorBoundary;
