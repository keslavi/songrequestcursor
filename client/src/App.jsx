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
  
  // Callback URL for redirect flow (mobile devices)
  const callbackUrl = window.location.origin + '/auth/callback';
  
  console.log("=== AUTH0 DEBUG INFO ===");
  console.log("domain:", import.meta.env.VITE_AUTH0_DOMAIN);
  console.log("clientId:", import.meta.env.VITE_AUTH0_CLIENT_ID);
  console.log("window.location.origin:", window.location.origin);
  console.log("window.location.href:", window.location.href);
  console.log("callbackUrl for mobile redirects:", callbackUrl);
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
        scope: "openid profile email phone address"
      }}
      // Allow Auth0 to handle redirects properly for social auth
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
