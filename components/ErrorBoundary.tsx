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
// Fix: Using React.Component explicitly ensures that TypeScript correctly identifies inherited properties like setState, props, and state, avoiding potential name collisions with other 'Component' declarations.
class ErrorBoundary extends React.Component<Props, State> {
  // Fix: Explicitly typing the state property ensures the class-level field is correctly merged into the component's state type.
  public state: State = {
    hasError: false,
    error: null
  };

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
    // Fix: setState is a built-in method of React.Component and is now correctly identified through explicit inheritance.
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  // Render method to display fallback UI or children
  public render(): React.ReactNode {
    // Fix: state property is correctly inherited from the React.Component base class.
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

    // Fix: props property is correctly inherited from the React.Component base class.
    return this.props.children;
  }
}

export default ErrorBoundary;