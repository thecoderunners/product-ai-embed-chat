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
    url?: string;  // URL to direct users to product page
  }[];
  rating?: number;  // Optional rating out of 5
  discount?: number; // Optional discount percentage
  originalPrice?: number; // Optional original price before discount
  inStock?: boolean; // Optional stock status
  shipping?: string; // Optional shipping info
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

const productImages = {
  headphones: "https://placehold.co/400x300/6c5ce7/white?text=Premium+Headphones",
  earbuds: "https://placehold.co/400x300/1abc9c/white?text=Wireless+Earbuds",
  speaker: "https://placehold.co/400x300/e74c3c/white?text=Bluetooth+Speaker",
  watch: "https://placehold.co/400x300/3498db/white?text=Smart+Watch",
  charger: "https://placehold.co/400x300/f39c12/white?text=Fast+Charger"
};


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

const products = [
  {
    id: "prod_headphones",
    title: "Premium Wireless Headphones",
    description: "Experience crystal clear sound with our latest noise-cancelling technology. Features 30-hour battery life and premium comfort.",
    price: 199.99,
    originalPrice: 249.99,
    imageUrl: productImages.headphones,
    rating: 4.7,
    inStock: true,
    shipping: "Free 2-day shipping",
    category: "headphones"
  },
  {
    id: "prod_earbuds",
    title: "Wireless Earbuds Pro",
    description: "Compact and comfortable wireless earbuds with great sound quality. Water resistant with 8-hour battery life.",
    price: 79.99,
    originalPrice: 99.99,
    imageUrl: productImages.earbuds,
    rating: 4.5,
    inStock: true,
    shipping: "Free shipping",
    category: "headphones"
  },
  {
    id: "prod_speaker",
    title: "Portable Bluetooth Speaker",
    description: "Powerful 360° sound with deep bass. Waterproof design for beach and pool parties. 20-hour battery life.",
    price: 129.99,
    imageUrl: productImages.speaker,
    rating: 4.3,
    inStock: true,
    shipping: "Free shipping",
    category: "speakers"
  },
  {
    id: "prod_watch",
    title: "Smart Fitness Watch",
    description: "Track your workouts, heart rate, and sleep patterns. Water resistant with 7-day battery life.",
    price: 149.99,
    originalPrice: 179.99,
    imageUrl: productImages.watch,
    rating: 4.6,
    inStock: true,
    shipping: "Arrives tomorrow",
    category: "accessories"
  },
  {
    id: "prod_charger",
    title: "Fast Charging Power Bank",
    description: "20,000mAh capacity with fast charging support for all your devices. Charge up to 4 devices simultaneously.",
    price: 49.99,
    imageUrl: productImages.charger,
    rating: 4.2,
    inStock: true,
    shipping: "Free shipping",
    category: "accessories"
  }
];

// Helper function to generate a unique message ID
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to convert a product to a ProductMessage
function productToMessage(product: any): ProductMessage {
  return {
    type: "product",
    id: generateMessageId(),
    title: product.title,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    imageUrl: product.imageUrl,
    rating: product.rating,
    inStock: product.inStock,
    shipping: product.shipping,
    actions: [
      { 
        label: "Buy Now", 
        value: `buy_${product.id}`,
        url: `/products/${product.id}` 
      },
      { 
        label: "Add to Cart", 
        value: `cart_${product.id}` 
      },
      { 
        label: "View Details", 
        value: `details_${product.id}`,
        url: `/products/${product.id}?view=details` 
      }
    ]
  };
}

function handleUserAction(action: string): ChatMessage[] {
  // Handle category selection
  if (action.startsWith("category_")) {
    const category = action.replace("category_", "");
    const categoryProducts = products.filter(p => p.category === category);
    
    if (categoryProducts.length === 0) {
      return [
        {
          type: "text",
          id: generateMessageId(),
          content: `Sorry, we couldn't find any products in the ${category} category.`
        }
      ];
    }
    
    const responses: ChatMessage[] = [
      {
        type: "text",
        id: generateMessageId(),
        content: `Here are our best ${category}:`
      }
    ];
    
    // Add up to 3 products from the category
    categoryProducts.slice(0, 3).forEach(product => {
      responses.push(productToMessage(product));
    });
    
    return responses;
  }
  
  // Handle price range selection
  if (action.startsWith("price_")) {
    let minPrice = 0;
    let maxPrice = Infinity;
    
    if (action === "price_under_100") {
      maxPrice = 100;
    } else if (action === "price_100_200") {
      minPrice = 100;
      maxPrice = 200;
    } else if (action === "price_over_200") {
      minPrice = 200;
    }
    
    const filteredProducts = products.filter(
      p => p.price >= minPrice && p.price < maxPrice
    );
    
    if (filteredProducts.length === 0) {
      return [
        {
          type: "text",
          id: generateMessageId(),
          content: `Sorry, we couldn't find any products in this price range.`
        }
      ];
    }
    
    const responses: ChatMessage[] = [
      {
        type: "text",
        id: generateMessageId(),
        content: `Here are our products ${minPrice === 0 ? "under $" + maxPrice : 
          maxPrice === Infinity ? "over $" + minPrice : 
          "between $" + minPrice + " and $" + maxPrice}:`
      }
    ];
    
    // Add up to 3 products from the filtered list
    filteredProducts.slice(0, 3).forEach(product => {
      responses.push(productToMessage(product));
    });
    
    return responses;
  }
  
  // Handle product actions
  if (action.startsWith("buy_") || action.startsWith("cart_")) {
    const productId = action.split("_")[1];
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return [
        {
          type: "text",
          id: generateMessageId(),
          content: "Sorry, we couldn't find that product."
        }
      ];
    }
    
    if (action.startsWith("buy_")) {
      return [
        {
          type: "text",
          id: generateMessageId(),
          content: `Great choice! You're about to purchase the ${product.title}.`
        },
        {
          type: "action",
          id: generateMessageId(),
          question: "Would you like to add extended warranty?",
          options: [
            { label: "Yes, add warranty", value: `warranty_${productId}` },
            { label: "No, thanks", value: `checkout_${productId}` }
          ]
        }
      ];
    } else {
      return [
        {
          type: "text",
          id: generateMessageId(),
          content: `${product.title} has been added to your cart!`
        },
        {
          type: "action",
          id: generateMessageId(),
          question: "What would you like to do next?",
          options: [
            { label: "Checkout", value: "view_cart" },
            { label: "Continue Shopping", value: "show_categories" }
          ]
        }
      ];
    }
  }
  
  // Handle showing all categories
  if (action === "show_products" || action === "show_categories") {
    return [
      {
        type: "text",
        id: generateMessageId(),
        content: "Here are our product categories:"
      },
      {
        type: "action",
        id: generateMessageId(),
        question: "What are you interested in?",
        options: [
          { label: "Headphones", value: "category_headphones" },
          { label: "Speakers", value: "category_speakers" },
          { label: "Accessories", value: "category_accessories" }
        ]
      }
    ];
  }
  
  // Handle showing random featured product
  if (action === "featured_products") {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    
    return [
      {
        type: "text",
        id: generateMessageId(),
        content: "Check out this featured product:"
      },
      productToMessage(randomProduct)
    ];
  }
  
  // Default response
  return [
    {
      type: "text",
      id: generateMessageId(),
      content: "I'm here to help! What would you like to know?"
    },
    {
      type: "action",
      id: generateMessageId(),
      question: "Would you like to:",
      options: [
        { label: "Browse Products", value: "show_categories" },
        { label: "See Featured Items", value: "featured_products" },
        { label: "Shop by Price", value: "show_price_ranges" }
      ]
    }
  ];
}

// Function to get initial welcome message with product showcase
function getWelcomeMessage(): ChatMessage[] {
  return [
    {
      type: "text",
      id: generateMessageId(),
      content: "Welcome to our store! I'm here to help you find the perfect product."
    },
    {
      type: "action",
      id: generateMessageId(),
      question: "What are you looking for today?",
      options: [
        { label: "Headphones", value: "category_headphones" },
        { label: "Speakers", value: "category_speakers" },
        { label: "Accessories", value: "category_accessories" }
      ]
    },
    {
      type: "text",
      id: generateMessageId(),
      content: "Here's one of our best sellers:"
    },
    productToMessage(products[0]) // Show the first product as a featured item
  ];
}

// Handle price range selection
function handlePriceRanges(): ChatMessage[] {
  return [
    {
      type: "text",
      id: generateMessageId(),
      content: "What's your budget?"
    },
    {
      type: "action",
      id: generateMessageId(),
      question: "Price range:",
      options: [
        { label: "Under $100", value: "price_under_100" },
        { label: "$100 - $200", value: "price_100_200" },
        { label: "Over $200", value: "price_over_200" }
      ]
    }
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
    } else {
      // Allow all origins for development
      headers.set("Access-Control-Allow-Origin", "*");
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
        if (body.action === "show_price_ranges") {
          response = handlePriceRanges();
        } else if (body.action) {
          // Handle action responses
          response = handleUserAction(body.action);
        } else if (body.message) {
          // Simple keyword matching for message handling
          const message = body.message.toLowerCase();
          
          if (message.includes("headphone") || message.includes("earphone") || message.includes("earbuds")) {
            response = handleUserAction("category_headphones");
          } else if (message.includes("speaker")) {
            response = handleUserAction("category_speakers");
          } else if (message.includes("accessory") || message.includes("accessories")) {
            response = handleUserAction("category_accessories");
          } else if (message.includes("cheap") || message.includes("affordable") || message.includes("budget")) {
            response = handleUserAction("price_under_100");
          } else if (message.includes("premium") || message.includes("high end") || message.includes("expensive")) {
            response = handleUserAction("price_over_200");
          } else {
            // Default text message response
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
                  { label: "Browse Products", value: "show_categories" },
                  { label: "Shop by Price", value: "show_price_ranges" },
                  { label: "See Featured Items", value: "featured_products" },
                ],
              },
            ];
          }
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
