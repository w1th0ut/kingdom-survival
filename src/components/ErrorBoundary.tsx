import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error?: Error }) {
  return (
    <div style={{
      padding: '20px',
      background: '#1e1b4b',
      color: '#ffffff',
      borderRadius: '8px',
      margin: '20px',
      textAlign: 'center'
    }}>
      <h2>🏰 Kingdom: Survival</h2>
      <p>Something went wrong. Please refresh the page to try again.</p>
      {error && (
        <details style={{ marginTop: '10px', textAlign: 'left' }}>
          <summary>Error details</summary>
          <pre style={{ 
            background: '#312e81', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {error.message}
          </pre>
        </details>
      )}
      <button 
        onClick={() => window.location.reload()}
        style={{
          background: '#6366f1',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          marginTop: '15px'
        }}
      >
        Refresh Page
      </button>
    </div>
  );
}
