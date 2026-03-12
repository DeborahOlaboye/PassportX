import React from 'react';

type Props = {
  children: React.ReactNode;
  fallback?:
    | React.ReactNode
    | ((error: Error, reset: () => void) => React.ReactNode);
  onReset?: () => void;
};
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Send to remote logging if desired
    // console.error('ErrorBoundary caught', error, info);
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }
      if (this.props.fallback) return this.props.fallback;
      return <div role="alert">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
