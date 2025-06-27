# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `pnpm i` or `npm i` - Install dependencies
- `pnpm run dev` - Start Vite dev server (frontend)
- `pnpm run dev:server` - Start Bun development server (backend)
- For full development: `pnpm run dev && pnpm run dev:server` (run both concurrently)

### Production Build & Deploy
- `pnpm run build` - Build the widget for production (creates dist folder)
- `pnpm run prod:server` - Start production server
- `http-server .` - Serve static files (requires `npm i -g http-server`)
- Access at `localhost:8080/index-prod.html`

### Testing
- No specific test framework configured - check with user before assuming test commands

## Architecture Overview

This is an **embeddable chat widget** system with two main components:

### Frontend Widget (`src/script.js`)
- **Self-contained chat widget** that can be embedded in any website
- **API key retrieval**: Uses `data-api-key` attribute from script tag for configuration
- **Token-based authentication**: Exchanges public API key for short-lived JWT tokens
- **Mobile-responsive**: Full-screen on mobile, floating window on desktop
- **Voice input support**: Web Speech API integration
- **Message rendering**: Supports text, product cards, action buttons, and images

### Backend Server (`src/server.ts`)
- **Bun-based TypeScript server** running on port 3000
- **Two-tier security**: Public API key validation → Short-lived token generation
- **Product catalog**: Sample e-commerce products with categories, pricing, ratings
- **Message types**: Structured responses (text, product, action, image)
- **CORS configured**: Supports localhost:5173, localhost:8080, and production domains

## Security Model

### Token Flow
1. **Client**: Embeds public API key in `<script data-api-key="test123">`
2. **Client**: Calls `/api/token` with `X-Api-Key` header
3. **Server**: Validates API key, returns short-lived JWT (5min expiry)
4. **Client**: Uses `Authorization: Bearer <token>` for secure API calls

### Environment Variables
- `API_KEY` - Public API key for development/production
- `TOKEN_SECRET` - JWT signing secret (server-side only)
- `NODE_ENV` - Environment mode (development skips API key validation)

## Deployment Configuration

### Vite Build Settings
- **Library mode**: Builds as IIFE (Immediately Invoked Function Expression)
- **Output**: Single file `chat-widget.min.js`
- **Base path**: `/product-ai-embed-chat/` for GitHub Pages
- **CSS inlining**: Handles CSS injection for production builds

### GitHub Pages Deployment
- Configured for `thecoderunners/product-ai-embed-chat` repository
- Widget accessible at: `https://thecoderunners.github.io/product-ai-embed-chat/chat-widget.min.js`
- Supports automated deployment via GitHub Actions

## Key Implementation Details

### Widget Integration
```html
<script type="module" 
        src="path/to/chat-widget.min.js" 
        data-api-key="your-api-key">
</script>
```

### API Endpoints
- `POST /api/token` - Exchange API key for short-lived token
- `GET /api/chat/init` - Initialize chat with welcome messages  
- `POST /api/chat/message` - Send user messages and receive responses

### Message Processing
- **Action-based**: Handles category selection, price filtering, product actions
- **Natural language**: Basic keyword matching for product searches
- **Structured responses**: Returns arrays of typed message objects

## File Structure Notes
- `index.html` - Development HTML page
- `index-prod.html` - Production HTML page
- `src/styles.css` - Widget styling (mobile-first responsive design)
- `vite.config.js` - Build configuration for widget bundling