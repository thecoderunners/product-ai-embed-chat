# How to run

## dev mode

0. `pnpm i` or `npm i` (if no `pnpm` can use `npm` as well)
1. `pnpm run dev && pnpm run dev:server`

## prod mode

1. `pnpm run build` to build the `dist` folder. it will read from vite.config.js and bundle the code
2. `pnpm run prod:server`
3. `http-server .` (use `npm i -g http-server` if not installed)
4. go to `localhost:8080/index-prod` and view the code with the chatboxloaded.

# Secure API Access via Short-Lived Tokens

This document explains the design and security model behind our API access system. We use a short-lived token mechanism to secure our API endpoints while allowing client-side scripts to pass in a public API key via a data attribute. This document covers:

- Overview
- Security Theory
- Implementation Details
- Usage Instructions
- Best Practices and Considerations
- Conclusion

---

## Overview

Our application uses a two-step process for securing API calls:

1. **Public API Key & Token Generation:**

   - The client embeds a public API key into the script tag via the `data-api-key` attribute.
   - The script reads this key and sends it to the server’s `/api/token` endpoint.
   - The server validates the API key (and optionally checks the origin or referer) and then generates a short-lived token (a JWT-like token valid for a limited time, e.g., 5 minutes).

2. **Token-Based Secure API Calls:**
   - For subsequent API calls (e.g., initializing chat or sending messages), the client includes the short-lived token in the `Authorization` header.
   - The server validates the token’s signature and expiry before processing the request.

---

## Security Theory

### Public vs. Secret Keys

- **Public API Key:**  
  The API key provided on the client side is intended to be public. It is used to identify the application or client integration. Because it is embedded in the HTML (via a `data-api-key` attribute), it must have **limited permissions** and is not considered a secret.

- **Secret Keys:**  
  Secret keys used for signing tokens and securing backend logic must remain on the server and never be exposed to the client. Our token signing secret (stored as an environment variable) is only used on the server to generate and validate tokens.

### Short-Lived Tokens

- **Why Short-Lived?**  
  Even though the public API key is exposed, the generated token is only valid for a short duration (e.g., 5 minutes). This limits the window during which an attacker could abuse a leaked token.

- **Token Structure & Generation:**  
  Tokens are generated using a signing algorithm (e.g., HMAC SHA-256) and include an expiration (`exp`) timestamp. The token structure is similar to a JSON Web Token (JWT):

  - **Header:** Specifies the algorithm and token type.
  - **Payload:** Contains the public API key and expiration details.
  - **Signature:** Created using a server-side secret to ensure the token is tamper-proof.

- **Token Validation:**  
  Every secure endpoint verifies:
  1. The presence of the token in the `Authorization` header.
  2. The validity of the signature (ensuring it was generated by our server).
  3. The expiration time to ensure the token is still valid.

### Using the `data-api-key` Attribute

- **Purpose:**  
  The `data-api-key` attribute is used to pass configuration data (the public API key) from the HTML into your module-based JavaScript. This method is safe for public keys since the key is meant to be visible to the client.

- **How It Works:**

  1. **Embedding the Key:**  
     In your HTML, include the script with the attribute:
     ```html
     <script type="module" src="/src/script.js" data-api-key="test123"></script>
     ```
  2. **Retrieving the Key:**  
     In your module code, retrieve the API key by querying the script element. For example:
     ```js
     const scriptTag = document.querySelector('script[src="/src/script.js"]');
     const PUBLIC_API_KEY = scriptTag
       ? scriptTag.getAttribute("data-api-key")
       : null;
     ```
     Alternatively, you can set a global variable before the module loads.

- **Security Implications:**  
  Since this API key is public, it must be scoped appropriately with limited permissions. Its main purpose is to allow the server to identify the client and issue a token rather than serve as a secure credential.

---

## Implementation Details

### Client-Side

- **Configuration:**  
  The API key is embedded in the script tag and then retrieved by the JavaScript module as shown above.

- **Token Request Flow:**

  - When the chat widget loads, it first calls the `/api/token` endpoint with the public API key.
  - If the key is valid, the server returns a short-lived token which is then stored (e.g., in a variable).
  - This token is added to the `Authorization` header of subsequent API calls.

- **API Calls:**  
  All chat API calls (e.g., initializing the chat or sending messages) include the header:

Authorization: Bearer <short-lived-token>

### Server-Side

- **Token Endpoint (`/api/token`):**
- Validates the public API key received in the request header (`X-Api-Key`).
- Generates a short-lived token using a secure signing algorithm.
- Returns the token to the client.

- **Secure Endpoints:**
- Endpoints like `/api/chat/init` and `/api/chat/message` require the short-lived token in the `Authorization` header.
- The server validates the token's signature and expiration before processing the request.

- **Error Handling:**  
  If the API key is invalid or the token is missing/expired, the server responds with a 401 Unauthorized error.

---

## Usage Instructions

1. **Embed the Script:**  
   Include the widget in your HTML with the public API key:

```html
<script type="module" src="/src/script.js" data-api-key="test123"></script>
```

2. **Server Configuration:**
   Set your environment variable for the API key (e.g., API_KEY=test123).
   Set a strong token signing secret (e.g., TOKEN_SECRET=your_strong_secret).
   Client Flow:
   The widget reads the API key from the script tag.
   It calls the /api/token endpoint to obtain a short-lived token.
   The token is used for all subsequent secure API calls.

## Best Practices and Considerations

1. Do Not Expose Sensitive Data:
   Only public keys should be embedded in client-side code. All sensitive secrets must remain on the server.

2. Use Short Token Lifetimes:
   Short-lived tokens reduce the risk of token misuse. Adjust the token lifetime based on your threat model.

3. Implement Rate Limiting and Monitoring:
   Apply rate limiting on both token requests and secure API endpoints. Monitor for unusual activity.

4. Enforce HTTPS:
   Ensure all communication between the client and server uses HTTPS to protect against man-in-the-middle attacks.

5. Origin/Referer Validation:
   Where possible, check the origin or referer headers to further restrict access to your API endpoints, although this should only serve as an additional layer of security.

# Embedded Chat Widget Deployment Guide

This guide explains how to deploy your chat widget to GitHub Pages using the provided workflow and configuration.

## Deployment Setup

### 1. Update Your Vite Configuration

1. Replace or update your `vite.config.js` with the provided configuration
2. The key addition is `base: '/product-ai-embed-chat/'` which ensures all assets are correctly referenced

### 2. Add the GitHub Action Workflow

1. Create a directory in your repository: `.github/workflows/`
2. Add the provided workflow file as `.github/workflows/deploy.yml`

### 3. Push to GitHub

1. Commit these changes to your repository
2. Push to the `main` branch of your `thecoderunners/product-ai-embed-chat` repository
3. The GitHub Action will automatically build and deploy your widget

### 4. Enable GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the sidebar
3. Under "Build and deployment", select "GitHub Actions" as the source
4. This should be done automatically by the workflow, but it's good to verify

## Using Your Deployed Widget

Once deployed, your chat widget will be available at:

```
https://thecoderunners.github.io/embed-chat/chat-widget.min.js
```

### Implementation Example

Add this script tag to any HTML page where you want to include the chat widget:

```html
<script
  type="module"
  src="https://thecoderunners.github.io/product-ai-embed-chat/chat-widget.min.js"
  data-api-key="YOUR_API_KEY"
></script>
```

Replace `YOUR_API_KEY` with your actual API key.

## Verifying Deployment

To verify that your widget has been deployed correctly:

1. Visit `https://thecoderunners.github.io/embed-chat/chat-widget.min.js` directly in your browser - you should see the minified JavaScript code
2. Create a test HTML page using the implementation example and make sure the chat widget appears
3. Check the browser console for any errors related to loading the widget

## Troubleshooting

### Widget Not Loading

If the widget doesn't load, check:

1. The browser console for errors
2. That GitHub Pages is enabled for your repository
3. That the workflow ran successfully (check the Actions tab in your repository)
4. That the base path in your Vite config matches your repository name

### API Connection Issues

If the widget loads but can't connect to your API:

1. Verify that your API server is running
2. Check for CORS issues - ensure your API allows requests from the GitHub Pages domain
3. Verify that the correct API endpoint is configured in your code

## Updating the Widget

To update your widget:

1. Make your changes to the code
2. Commit and push to the main branch
3. The GitHub Action will automatically rebuild and redeploy

The updated widget will be available at the same URL, but you may need to clear your browser cache to see the changes immediately.
