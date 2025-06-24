//import './app.css';
import { Outlet as RouterOutlet } from "react-router-dom";
import { useEffect } from "react";
import { ContainerFullWidth } from "@/components";
import { Header } from "./components/header";
import { Auth0Provider } from "@auth0/auth0-react";
import { store } from "@/store/store";

export const App = (props) => {
  const { menu } = props;
  const checkAuth = store.use.checkAuth();
  
  // Use static callback URL to avoid IP address changes
  // You can change this to your preferred IP address
  const callbackUrl = `${window.location.origin}/auth/callback`;//'http://localhost:3000/auth/callback';
  
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  console.log("=== AUTH0 DEBUG INFO ===");
  console.log("domain:", import.meta.env.VITE_AUTH0_DOMAIN);
  console.log("clientId:", import.meta.env.VITE_AUTH0_CLIENT_ID);
  console.log("window.location.origin:", window.location.origin);
  console.log("window.location.href:", window.location.href);
  console.log("callbackUrl:", callbackUrl);
  console.log("isDevelopment:", isDevelopment);
  console.log("Current IP detected:", window.location.hostname);
  console.log("Auth0 configured for social auth with proper redirect handling");
  console.log("=========================");

  // Initialize authentication on app startup
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: callbackUrl,
        scope: "openid profile email phone address offline_access"
      }}
      // Allow Auth0 to handle redirects properly for social auth
      useRefreshTokens={true}
      cacheLocation="localstorage"
      // Add configuration to help with COOP policy issues
      skipRedirectCallback={window.location.pathname === '/auth/callback'}
    >
      <Header menu={menu} />
      <ContainerFullWidth>
      <div style={{ width: "100%" }}>
        <RouterOutlet />
      </div>
      </ContainerFullWidth>
    </Auth0Provider>
  );
};

export default App;
