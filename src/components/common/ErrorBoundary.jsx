import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'white', background: '#050608', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ color: '#f43f5e' }}>Something went wrong.</h2>
          <p style={{ color: '#94a3b8', marginTop: '12px' }}>{this.state.error?.message}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '24px', alignSelf: 'center' }}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
