
const BASES = {
  sandbox: "https://api.sandbox.mangopay.com",
  production: "https://api.mangopay.com"
};

let tokenCache = null;
let expiresAt = 0;

function config() {
  const mode = process.env.MANGOPAY_ENV;

  if (!["sandbox", "production"].includes(mode)) {
    throw new Error("Environnement Mangopay invalide");
  }

  const clientId = process.env.MANGOPAY_CLIENT_ID;
  const apiKey = process.env.MANGOPAY_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error("Identifiants Mangopay manquants");
  }

  return {
    base: BASES[mode],
    clientId,
    apiKey
  };
}

async function getToken() {
  if (tokenCache && Date.now() < expiresAt) {
    return tokenCache;
  }

  const {base,clientId,apiKey} = config();

  const credentials = Buffer.from(
    `${clientId}:${apiKey}`
  ).toString("base64");

  const response = await fetch(
    `${base}/v2.01/oauth/token`,
    {
      method:"POST",
      headers:{
        Authorization:`Basic ${credentials}`,
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body:"grant_type=client_credentials",
      signal:AbortSignal.timeout(10000)
    }
  );

  if (!response.ok) {
    throw new Error(
      `Authentification Mangopay : HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("Jeton Mangopay absent");
  }

  tokenCache = data.access_token;
  expiresAt = Date.now() +
    Math.max(0,Number(data.expires_in)-30)*1000;

  return tokenCache;
}

async function mangopayRequest(path, options={}) {
  const {base,clientId} = config();
  const token = await getToken();

  if (!path.startsWith("/")) {
    throw new Error("Chemin API invalide");
  }

  const response = await fetch(
    `${base}/v2.01/${encodeURIComponent(clientId)}${path}`,
    {
      ...options,
      headers:{
        Authorization:`Bearer ${token}`,
        "Content-Type":"application/json",
        ...options.headers
      },
      signal:AbortSignal.timeout(15000)
    }
  );

  if (!response.ok) {
    throw new Error(
      `Erreur Mangopay HTTP ${response.status}`
    );
  }

  return response.json();
}

module.exports = {getToken,mangopayRequest};
