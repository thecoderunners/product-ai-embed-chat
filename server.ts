import { serve } from "bun";

// Define message type interfaces for structured responses
interface BaseMessage {
  type: "text" | "product" | "action" | "image";
  id: string;
}

interface TextMessage extends BaseMessage {
  type: "text";
  content: string;
}

interface ProductMessage extends BaseMessage {
  type: "product";
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  actions: {
    label: string;
    value: string;
  }[];
}

interface ActionMessage extends BaseMessage {
  type: "action";
  question: string;
  options: {
    label: string;
    value: string;
  }[];
}

interface ImageMessage extends BaseMessage {
  type: "image";
  imageUrl: string;
  caption?: string;
}

type ChatMessage = TextMessage | ProductMessage | ActionMessage | ImageMessage;

// Sample messages for different types
const sampleMessages: ChatMessage[] = [
  {
    type: "text",
    id: "msg1",
    content: "Hello! I'm here to help you find the perfect product.",
  },
  {
    type: "product",
    id: "prod1",
    title: "Premium Wireless Headphones",
    description:
      "Experience crystal clear sound with our latest wireless headphones.",
    price: 199.99,
    imageUrl: "/products/headphones.jpg",
    actions: [
      { label: "Buy Now", value: "buy_headphones" },
      { label: "Add to Cart", value: "cart_headphones" },
      { label: "Learn More", value: "info_headphones" },
    ],
  },
  {
    type: "action",
    id: "act1",
    question: "What's your preferred price range?",
    options: [
      { label: "Under $100", value: "price_under_100" },
      { label: "$100 - $200", value: "price_100_200" },
      { label: "Over $200", value: "price_over_200" },
    ],
  },
];

// Helper function to generate a unique message ID
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to handle user actions and generate appropriate responses
function handleUserAction(action: string): ChatMessage[] {
  switch (action) {
    case "price_under_100":
      return [
        {
          type: "text",
          id: generateMessageId(),
          content: "Great! Here are our best products under $100:",
        },
        {
          type: "product",
          id: generateMessageId(),
          title: "Wireless Earbuds",
          description:
            "Compact and comfortable wireless earbuds with great sound quality.",
          price: 79.99,
          imageUrl: "/products/earbuds.jpg",
          actions: [
            { label: "Buy Now", value: "buy_earbuds" },
            { label: "Add to Cart", value: "cart_earbuds" },
          ],
        },
      ];
    case "buy_headphones":
      return [
        {
          type: "text",
          id: generateMessageId(),
          content: "Excellent choice! Let's proceed with your purchase.",
        },
        {
          type: "action",
          id: generateMessageId(),
          question: "Would you like to add extended warranty?",
          options: [
            { label: "Yes, add warranty", value: "add_warranty" },
            { label: "No, thanks", value: "skip_warranty" },
          ],
        },
      ];
    default:
      return [
        {
          type: "text",
          id: generateMessageId(),
          content: "I'm here to help! What would you like to know?",
        },
      ];
  }
}

// Function to get initial welcome message with product showcase
function getWelcomeMessage(): ChatMessage[] {
  return [
    {
      type: "text",
      id: generateMessageId(),
      content:
        "Welcome to our store! I'm here to help you find the perfect product.",
    },
    {
      type: "action",
      id: generateMessageId(),
      question: "What are you looking for today?",
      options: [
        { label: "Headphones", value: "category_headphones" },
        { label: "Speakers", value: "category_speakers" },
        { label: "Accessories", value: "category_accessories" },
      ],
    },
  ];
}

// Server setup with enhanced message handling
const server = serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url);
    const headers = new Headers();

    // CORS headers setup
    const allowedOrigins = ["http://localhost:8080", "https://yourdomain.com"];
    const requestOrigin = request.headers.get("Origin");
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      headers.set("Access-Control-Allow-Origin", requestOrigin);
    }
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Allow-Credentials", "true");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // Chat initialization endpoint
    if (url.pathname === "/api/chat/init" && request.method === "GET") {
      const welcomeMessages = getWelcomeMessage();
      return new Response(JSON.stringify({ messages: welcomeMessages }), {
        status: 200,
        headers: {
          ...Object.fromEntries(headers),
          "Content-Type": "application/json",
        },
      });
    }

    // Message handling endpoint
    if (url.pathname === "/api/chat/message" && request.method === "POST") {
      try {
        const body = await request.json();
        console.log("Received message from client:", body);

        // Simulate processing delay
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 1000 + 500),
        );

        // Handle different types of incoming messages
        let response;
        if (body.action) {
          // Handle action responses
          response = handleUserAction(body.action);
        } else if (body.message) {
          // Handle text messages
          // You could implement NLP or pattern matching here
          response = [
            {
              type: "text",
              id: generateMessageId(),
              content: `I received your message: "${body.message}". How can I help you further?`,
            },
            {
              type: "action",
              id: generateMessageId(),
              question: "Would you like to:",
              options: [
                { label: "See our products", value: "show_products" },
                { label: "Get support", value: "get_support" },
                { label: "Track order", value: "track_order" },
              ],
            },
          ];
        }

        return new Response(JSON.stringify({ messages: response }), {
          status: 200,
          headers: {
            ...Object.fromEntries(headers),
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Error processing request:", error);
        return new Response(
          JSON.stringify({
            error: "Error processing request",
            details: error.message,
          }),
          {
            status: 400,
            headers: {
              ...Object.fromEntries(headers),
              "Content-Type": "application/json",
            },
          },
        );
      }
    }

    // Handle 404
    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: {
        ...Object.fromEntries(headers),
        "Content-Type": "application/json",
      },
    });
  },
});

console.log("Enhanced chat server running on http://localhost:3000");
