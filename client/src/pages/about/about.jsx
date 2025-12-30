import { useEffect, useMemo, useState } from "react";
import config from "@/config";

const CLIENT_ENV_KEYS = [
    "VITE_PROXY",
    "VITE_AUTH0_DOMAIN",
    "VITE_AUTH0_CLIENT_ID",
    "VITE_AUTH0_AUDIENCE",
    "VITE_GOOGLE_MAPS_API_KEY",
    "VITE_API_URL",
    "VITE_APP_ENV"
];

const SERVER_ENV_KEYS = [
    "PORT",
    "NODE_ENV",
    "GOOGLE_MAPS_API_KEY",
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_SECURE",
    "EMAIL_USER",
    "EMAIL_PASSWORD",
    "EMAIL_FROM",
    "SPOTIFY_CLIENT_ID",
    "SPOTIFY_CLIENT_SECRET",
    "CLIENT_URL"
];

const kvToList = (entries) =>
    entries.map(([key, value]) => (
        <tr key={key}>
            <td>{key}</td>
            <td>{value ?? "(not set)"}</td>
        </tr>
    ));

export const About = () => {
    const [serverEnv, setServerEnv] = useState(null);
    const [serverError, setServerError] = useState(null);

    const clientEnv = useMemo(() => {
        return {
            AUTH0_DOMAIN: config.AUTH0_DOMAIN,
            AUTH0_CLIENT_ID: config.AUTH0_CLIENT_ID,
            AUTH0_AUDIENCE: config.AUTH0_AUDIENCE,
            GOOGLE_MAPS_API_KEY: config.GOOGLE_MAPS_API_KEY,
            API_URL: config.API_URL || config.api,
            APP_ENV: config.APP_ENV
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchServerEnv = async () => {
            try {
                const response = await fetch("/api/utils/env");
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`);
                }
                const data = await response.json();
                if (isMounted) {
                    setServerEnv(data?.server ?? {});
                }
            } catch (error) {
                if (isMounted) {
                    setServerError(error.message || "Failed to load server env");
                }
            }
        };

        fetchServerEnv();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div>
            <h4>About</h4>
            <p>Temporary diagnostics view of environment variables.</p>

            <section>
                <h5>Client Environment (configured)</h5>
                <table>
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>{kvToList(Object.entries(clientEnv))}</tbody>
                </table>
            </section>

            <section>
                <h5>Server Environment (via /api/utils/env)</h5>
                {serverError && <p style={{ color: "red" }}>{serverError}</p>}
                <table>
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serverEnv
                            ? kvToList(
                                    SERVER_ENV_KEYS.map((key) => [key, serverEnv?.[key] ?? null])
                                )
                            : null}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default About;