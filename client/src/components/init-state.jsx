
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import config from "@/config";

const buildClientConfigUrl = () => {
  const base = config.API_URL || config.api || "/api";
  if (!base) {
    return "/api/utils/client-config";
  }

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalizedBase}/utils/client-config`;
};

const applyClientConfig = (clientConfig = {}, clientEnv = {}) => {
  const entries = Object.entries(clientConfig);

  entries.forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    if (key === "API_URL") {
      config.API_URL = value;
      config.api = value;
      return;
    }

    config[key] = value;
  });

  config.__clientConfig = { ...clientConfig };
  config.__clientConfigEnv = { ...clientEnv };
  config.__clientConfigLoaded = true;
};

export const InitState = ({ children }) => {
  const [ready, setReady] = useState(Boolean(config.__clientConfigLoaded));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      if (config.__clientConfigLoaded) {
        setReady(true);
        return;
      }

      try {
        const url = buildClientConfigUrl();
        const response = await fetch(url, { credentials: "include" });

        if (!response.ok) {
          throw new Error(`Failed to load client config: ${response.status}`);
        }

        const data = await response.json();
        if (!cancelled) {
          applyClientConfig(data?.client, data?.clientEnv);
          setReady(true);
        }
      } catch (err) {
        console.error("Error loading client configuration", err);
        if (!cancelled) {
          setError(err);
          config.__clientConfigEnv = null;
          config.__clientConfigLoaded = true;
          setReady(true);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Loading application configuration&hellip;</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "red" }}>Failed to load remote configuration. Using defaults.</p>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

InitState.propTypes = {
  children: PropTypes.node
};