# API Key and Short-Lived Token Security Tutorial

This tutorial explains how our system uses a public API key combined with a short-lived token mechanism to secure API calls. It highlights specific parts of our code—in both the server-side (`server.ts`) and the client-side (`script.js`)—that handle API key retrieval, token generation, token validation, and secure API calls.

---

## Overview

Our security flow involves two main steps:

1. **Token Generation**

   - **Client Side:** The public API key is embedded in the HTML via a `data-api-key` attribute in the `<script>` tag.
   - **Server Side:** The client sends the API key to the `/api/token` endpoint. The server validates the key, and if valid, generates a short-lived token (JWT-like) using a secure signing algorithm.

2. **Token-Based Secure API Calls**
   - The client stores the token and includes it in the `Authorization` header (as `Bearer <token>`) for subsequent API calls (e.g., initializing the chat, sending messages).
   - The server validates the token’s signature and expiry before processing requests.

---

## Server-Side Implementation (server.ts)

### API Key Validation

The server validates the public API key sent in the `X-Api-Key` header. In `server.ts`, the function below handles this:

```ts
function validateApiKey(request: Request): boolean {
  console.log("Validating API key...");
  console.log("API Key:", request.headers.get("X-Api-Key"));
  console.log("Environment:", process.env.NODE_ENV);
  // In development, skip validation
  if (process.env.NODE_ENV === "development") return true;
  const apiKey = request.headers.get("X-Api-Key");
  return apiKey === process.env.API_KEY;
}
```

### What It Does:

Checks that the API key in the request header matches the one stored in your environment (i.e., process.env.API_KEY).
Note: In development mode, validation is bypassed for easier testing.
Token Generation
The function below creates a short-lived JWT-like token, valid for 5 minutes (300 seconds by default):

```ts
function generateShortLivedToken(
  apiKey: string,
  expiresInSeconds = 300
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const payload = { apiKey, iat, exp };

  const base64Header = Buffer.from(JSON.stringify(header)).toString(
    "base64url"
  );
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  const signature = createHmac(
    "sha256",
    process.env.TOKEN_SECRET || "default_secret"
  )
    .update(`${base64Header}.${base64Payload}`)
    .digest("base64url");

  return `${base64Header}.${base64Payload}.${signature}`;
}
```

## Highlights:

Header & Payload: The token includes the API key, issued-at (iat), and expiration (exp) times.
Signature: Uses HMAC with SHA-256 and a secret (TOKEN_SECRET) to sign the token, ensuring its integrity.
Output: Returns a token string that the client will use for authentication.

## Token Validation

Every secure endpoint validates the token using the following function:

```ts
function validateToken(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return false;
  const token = parts[1];
  const segments = token.split(".");
  if (segments.length !== 3) return false;

  const [base64Header, base64Payload, signature] = segments;
  const expectedSignature = createHmac(
    "sha256",
    process.env.TOKEN_SECRET || "default_secret"
  )
    .update(`${base64Header}.${base64Payload}`)
    .digest("base64url");

  if (signature !== expectedSignature) return false;

  const payload = JSON.parse(
    Buffer.from(base64Payload, "base64url").toString("utf8")
  );
  if (payload.exp < Math.floor(Date.now() / 1000)) return false;

  return true;
}
```

### What It Does:

Extracts and verifies the token from the Authorization header by checking its signature and ensuring it hasn't expired.
Token Generation Endpoint
This part of the code handles token requests. When a client sends a POST request to /api/token, the server validates the API key and, if valid, returns a token:

```ts
if (url.pathname === "/api/token" && request.method === "POST") {
  if (!validateApiKey(request)) {
    return new Response(
      JSON.stringify(
        createApiResponse(false, undefined, "Invalid or missing API key")
      ),
      { status: 401, headers }
    );
  }
  const apiKey = request.headers.get("X-Api-Key") as string;
  const token = generateShortLivedToken(apiKey);
  return new Response(JSON.stringify(createApiResponse(true, { token })), {
    status: 200,
    headers: {
      ...Object.fromEntries(headers),
      "Content-Type": "application/json",
    },
  });
}
```

### Key Points:

Validates the public API key.
Uses the generateShortLivedToken function to create a token.
Responds with the token in a JSON payload.

# Client-Side Implementation (script.js)

## Retrieving the API Key from the Script Tag

The client script retrieves the API key from the data-api-key attribute of the `<script>` tag. A helper function is used for a resilient approach:

```ts
function getApiKey() {
  // Method 1: Try document.currentScript
  const currentScript = document.currentScript;
  if (currentScript && currentScript.getAttribute("data-api-key")) {
    return currentScript.getAttribute("data-api-key");
  }
  // Method 2: Look through all module scripts
  const scripts = document.querySelectorAll('script[type="module"]');
  for (const script of scripts) {
    if (
      script.getAttribute("data-api-key") &&
      (script.src.includes("chat-widget") || script.src.includes("script.js"))
    ) {
      return script.getAttribute("data-api-key");
    }
  }
  // Method 3: Fallback query
  const scriptWithKey = document.querySelector("script[data-api-key]");
  if (scriptWithKey) {
    return scriptWithKey.getAttribute("data-api-key");
  }
  console.warn("Could not find API key from script tag");
  return null;
}
```

### Purpose:

Ensures that the public API key (e.g., "test123") is correctly retrieved from the script tag.
Requesting a Short-Lived Token
Once the API key is retrieved, the client sends a request to the /api/token endpoint to obtain a token:

```ts
function getAuthToken() {
  logger.info("Requesting auth token...");
  return fetch("http://localhost:3000/api/token", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": PUBLIC_API_KEY,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.data.token) {
        authToken = data.data.token;
        logger.info("Received auth token:", authToken);
      } else {
        logger.error("Failed to retrieve auth token:", data.error);
      }
    })
    .catch((err) => {
      logger.error("Error fetching auth token:", err);
    });
}
```

### Highlights:

The API key is sent in the X-Api-Key header.
If successful, the received token is stored in the authToken variable.
Using the Token for Secure API Calls
Subsequent API calls include the token in the Authorization header. For example, during chat initialization:

```ts
function callChatInit() {
  fetch("http://localhost:3000/api/chat/init", {
    method: "GET",
    credentials: "include",
    headers: { Authorization: `Bearer ${authToken}` },
  })
    .then((response) => {
      logger.info("Chat init API response received");
      return response.json();
    })
    .then((data) => {
      // Process and render the chat interface...
    })
    .catch((err) => {
      logger.error("Error loading chat interface:", err);
      // Display error state...
    });
}
```

### Key Point:

The token (stored in authToken) is attached to the Authorization header to authenticate the request.

## Tutorial Summary

1. Server-Side Process:

- API Key Validation: The server checks the public API key (from the X-Api-Key header) using validateApiKey().
- Token Generation: If the API key is valid, generateShortLivedToken() creates a token.
- Token Validation: Secure endpoints validate incoming tokens with validateToken().
- Endpoint Example: The /api/token endpoint demonstrates this process.

2. Client-Side Process:

- Embedding the API Key: The API key is embedded in the `<script>` tag with a data-api-key attribute.
- Retrieving the API Key: The helper function getApiKey() extracts the API key from the script tag.
- Token Request: getAuthToken() sends the API key to the server to obtain a short-lived token.
- Secure Calls: The token is used in the Authorization header (e.g., in callChatInit()) for secure API interactions.

3. Security Considerations:

- Public API Key: Must be limited in scope; it is safe to expose.
- Short-Lived Token: Reduces the risk of token abuse due to its limited lifespan.
- HTTPS: Always use HTTPS to secure data in transit.
- Rate Limiting & Monitoring: Implement additional safeguards on both the token endpoint and secure API endpoints.

## Conclusion

This tutorial has detailed the implementation of our API key and short-lived token security mechanism. By embedding a public API key via the data-api-key attribute and using it to request a short-lived token, the system ensures that:

The API key is only used for identification.
The short-lived token (with its expiration and signature verification) protects secure API calls.
Even if the public API key is exposed, its limited permissions and the token's short lifespan minimize security risks.
Following this approach helps maintain a secure and robust API environment for client-side integrations.
