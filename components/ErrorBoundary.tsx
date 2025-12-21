
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
// Fix: Import Component directly from 'react' to ensure correct inheritance and type discovery for class properties
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Fix: Initialize state which is now correctly inherited from Component
    this.state = {
      hasError: false,
      error: null
    };
  }

  // Update state so the next render will show the fallback UI.
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Lifecycle method for logging errors
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  // Reset error state and reload the app
  private handleRetry = () => {
    // Fix: setState is now recognized as a member of the Component class
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  // Render method to display fallback UI or children
  public render() {
    // Fix: state is recognized as a member of the Component class
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

    // Fix: props is recognized as a member of the Component class
    return this.props.children;
  }
}

export default ErrorBoundary;
