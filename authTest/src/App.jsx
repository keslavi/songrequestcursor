import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';

// Auth0 Configuration
const domain = 'reconcilepro.auth0.com';
const clientId = 'FuHyrH98UFNo5GxLLnjiqX8sxsXo5v63';

// Debug logging
console.log('=== AUTH0 DEBUG INFO ===');
console.log('Domain:', domain);
console.log('Client ID:', clientId);
console.log('Current URL:', window.location.href);
console.log('Origin:', window.location.origin);
console.log('Protocol:', window.location.protocol);
console.log('Host:', window.location.host);
console.log('Port:', window.location.port);
console.log('========================');

// Main App Component
const AppContent = () => {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading, error } = useAuth0();

  // Log any Auth0 errors
  if (error) {
    console.error('Auth0 Error:', error);
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="card">
          <h1>Auth0 Test App</h1>
          <p>Please log in to view your profile information.</p>
          {error && (
            <div style={{ 
              padding: '12px', 
              margin: '12px 0', 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb', 
              borderRadius: '4px',
              color: '#721c24'
            }}>
              <strong>Error:</strong> {error.message}
            </div>
          )}
          <button className="btn" onClick={() => loginWithRedirect()}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="profile-section">
          {user?.picture && (
            <img 
              src={user.picture} 
              alt="Profile" 
              className="profile-image"
            />
          )}
          <div className="profile-info">
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email}</p>
            <button 
              className="btn btn-secondary" 
              onClick={() => logout({ returnTo: window.location.origin })}
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <h4>Full Name</h4>
            <p>{user?.name || 'Not provided'}</p>
          </div>
          
          <div className="info-item">
            <h4>Email</h4>
            <p>{user?.email || 'Not provided'}</p>
          </div>
          
          <div className="info-item">
            <h4>Phone Number</h4>
            <p>{user?.phone_number || 'Not provided'}</p>
          </div>
          
          <div className="info-item">
            <h4>Zip Code</h4>
            <p>{user?.address?.postal_code || user?.['https://your-namespace/zip_code'] || 'Not provided'}</p>
          </div>
          
          <div className="info-item">
            <h4>Provider</h4>
            <p>{user?.sub?.split('|')[0] || 'Unknown'}</p>
          </div>
          
          <div className="info-item">
            <h4>Email Verified</h4>
            <p>{user?.email_verified ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4>Raw User Data (Debug)</h4>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

// App with Auth0 Provider
function App() {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        scope: "openid profile email phone address"
      }}
    >
      <AppContent />
    </Auth0Provider>
  );
}

export default App; 