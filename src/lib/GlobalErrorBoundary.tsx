import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              padding: '2rem',
              fontFamily: 'system-ui, sans-serif',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
            }}
          >
            <div
              style={{
                padding: '2rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '100%',
                background: 'white',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            >
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#dc2626',
                  marginBottom: '0.5rem',
                }}
              >
                Terjadi Kesalahan
              </h1>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Aplikasi mengalami error. Silakan refresh halaman atau hubungi admin.
              </p>
              {this.state.error && (
                <pre
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    color: '#dc2626',
                    overflow: 'auto',
                    maxHeight: '200px',
                  }}
                >
                  {this.state.error.message}
                </pre>
              )}
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Refresh Halaman
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
