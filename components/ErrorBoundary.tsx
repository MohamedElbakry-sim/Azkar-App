import React, { ErrorInfo, ReactNode } from 'react';
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
// Fix: Use React.Component explicitly to resolve property access issues with setState, state, and props
class ErrorBoundary extends React.Component<Props, State> {
  // Fix: Explicitly define constructor and call super(props) to ensure base class initialization
  constructor(props: Props) {
    super(props);
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

  // Handle retry logic to reset state and attempt reload
  // Fix: Explicitly inherited setState from React.Component is now correctly recognized
  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  // Render method to display fallback UI or children
  public render(): ReactNode {
    // Fix: Explicitly inherited state from React.Component is now correctly recognized
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

    // Fix: Explicitly inherited props from React.Component is now correctly recognized
    return this.props.children;
  }
}

export default ErrorBoundary;
