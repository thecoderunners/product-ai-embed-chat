// server.ts
import { serve } from "bun";

// Sample chat messages to simulate a conversation
const chatMessages = [
  "Hello! How can I help you today?",
  "Hi there! What can I do for you?",
  "Good day! Do you need any assistance?",
  "Hey! Feel free to ask me anything.",
  "Welcome! How's your day going?",
  "Hi! I'm here if you need any support.",
];

function randomMessage(): string {
  const randomIndex = Math.floor(Math.random() * chatMessages.length);
  return chatMessages[randomIndex];
}

function setCorsHeaders(request: Request, headers: Headers) {
  const allowedOrigins = ["http://localhost:8080", "https://yourdomain.com"]; // Add allowed origins here
  const requestOrigin = request.headers.get("Origin");

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    headers.set("Access-Control-Allow-Origin", requestOrigin);
  }

  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Allow-Credentials", "true");
}

const server = serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url);
    const headers = new Headers();
    setCorsHeaders(request, headers);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // GET /api/chat/init: Return a random initial chat message
    if (url.pathname === "/api/chat/init" && request.method === "GET") {
      const responseData = { initialContent: randomMessage() };
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          ...Object.fromEntries(headers),
          "Content-Type": "application/json",
        },
      });
    }

    // POST /api/chat/message: Simulate chat response with a random delay
    if (url.pathname === "/api/chat/message" && request.method === "POST") {
      try {
        const body = await request.json();
        console.log("Received message from client:", body.message);

        // Simulate a delay between 500ms and 2500ms
        const delay = Math.floor(Math.random() * 2000) + 500;
        await new Promise((resolve) => setTimeout(resolve, delay));

        const responseData = { response: randomMessage() };
        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: {
            ...Object.fromEntries(headers),
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Error processing the request:", error);
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: {
            ...Object.fromEntries(headers),
            "Content-Type": "application/json",
          },
        });
      }
    }

    // If the endpoint is not found, return 404
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        ...Object.fromEntries(headers),
        "Content-Type": "application/json",
      },
    });
  },
});

console.log("Dummy chat server running on http://localhost:3000");
