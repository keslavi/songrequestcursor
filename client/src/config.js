/*
  note: values are set for local development. 
  eventually, public/config-override.js 
  will be used to adjust with celestial variables in deployment.
*/
export const config = {
  api: "/api",
  API_URL: "/api",
  reduxLogger: false,
  env: "local",
  debug: true,
  AUTH0_DOMAIN: "reconcilepro.auth0.com",
  AUTH0_CLIENT_ID: "XPhuyoVc4NDXH69upO7TlNaqpVt8K0AF",
  AUTH0_AUDIENCE: "https://your-api-identifier.com",
  GOOGLE_MAPS_API_KEY: "AIzaSyDAye-oL5INXPKUWOGG3uttsZpdtymwSf0",
  APP_ENV: "prod",
  __clientConfigLoaded: false,
  __clientConfig: null,
  __clientConfigEnv: null
}

export default config;
