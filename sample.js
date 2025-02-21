(function () {
  // Add viewport meta tag if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(viewportMeta);
  }

  // Debug logger setup
  const DEBUG = true;
  const logger = {
    info: (...args) => DEBUG && console.log("📱 [Chat Widget]:", ...args),
    error: (...args) => DEBUG && console.error("❌ [Chat Widget]:", ...args),
    warn: (...args) => DEBUG && console.warn("⚠️ [Chat Widget]:", ...args),
  };

  logger.info("Initializing chat widget...");

  // Create container for the widget
  const chatContainer = document.createElement("div");
  chatContainer.id = "my-chat-widget";
  chatContainer.style.position = "fixed";
  chatContainer.style.bottom = "20px";
  chatContainer.style.right = "20px";
  chatContainer.style.zIndex = "10000";
  document.body.appendChild(chatContainer);

  logger.info("Chat container created");

  // Add enhanced styles with animations and additional rules for images
  const style = document.createElement("style");
  style.innerHTML = `
    /* General Reset */
    #my-chat-widget * {
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Chat Toggle Button */
    #my-chat-widget button.chat-toggle {
        background: #6c5ce7;
        color: white;
        border: none;
        border-radius: 50%;
        width: clamp(60px, 15vw, 80px);
        height: clamp(60px, 15vw, 80px);
        font-size: clamp(24px, 4vw, 32px);
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        position: relative;
    }

    #my-chat-widget button.chat-toggle:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(108, 92, 231, 0.5);
    }
    
    #my-chat-widget button.chat-toggle:active {
        transform: scale(0.95);
    }

    @media (max-width: 767px) {
        #my-chat-widget button.chat-toggle {
            width: 80px;
            height: 80px;
            right: 0;
            bottom: 0;
            font-size: 32px;
            /* Position at bottom right with some padding */
            position: fixed;
            bottom: 20px;
            right: 20px;
        }
    }

    /* Chat Window */
    #my-chat-window {
        display: none;
        width: min(450px, calc(100vw - 40px));
        height: min(650px, 80vh);
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        position: fixed;
        bottom: 100px;
        right: 20px;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
        z-index: 10002;
        transition: all 0.3s ease;
    }
    
    /* Mobile Full Screen Mode */
    @media (max-width: 767px) {
        #my-chat-window {
            width: 100%;
            height: 100%;
            bottom: 0;
            right: 0;
            left: 0;
            top: 0;
            border-radius: 0;
            max-height: none;
            position: fixed;
            margin: 0;
            padding: 0;
        }
        
        #my-chat-window.chat-show {
            animation: slideUpFullScreen 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        #my-chat-window.chat-hide {
            animation: slideDownFullScreen 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
    }
    
    /* Medium Sized Devices */
    @media (min-width: 768px) and (max-width: 1023px) {
        #my-chat-window {
            width: min(600px, 85vw);
            height: min(700px, 85vh);
        }
    }
    
    /* Large Screens */
    @media (min-width: 1024px) {
        #my-chat-window {
            width: min(450px, 35vw);
            height: min(650px, 75vh);
        }
    }

    /* Show/Hide Animations */
    .chat-show {
      display: block !important;
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .chat-hide {
      animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
    }
    
    @keyframes slideUpFullScreen {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideDownFullScreen {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }
    
    /* Ensure proper mobile layout */
    @media (max-width: 767px) {
      html.chat-open,
      body.chat-open {
        overflow: hidden !important;
        position: fixed;
        width: 100%;
        height: 100%;
      }
    }

    /* Chat Header */
    #chat-header {
      background: #6c5ce7;
      color: #fff;
      padding: clamp(16px, 5vw, 20px);
      font-size: clamp(16px, 4vw, 18px);
      font-weight: 600;
      text-align: center;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    @media (max-width: 767px) {
      #chat-header {
        padding: 1rem;
        position: sticky;
        top: 0;
        z-index: 10003;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        font-size: 20px;
      }
    }

    .close-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: clamp(6px, 1.5vw, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .close-button svg {
      width: clamp(18px, 5vw, 20px);
      height: clamp(18px, 5vw, 20px);
    }

    /* Chat Body */
    #chat-body {
      padding: clamp(16px, 5vw, 20px);
      overflow-y: auto;
      height: calc(100% - clamp(120px, 25vh, 140px));
      background: #f8f9fa;
      scroll-behavior: smooth;
    }
    
    @media (max-width: 767px) {
      #chat-body {
        height: calc(100vh - 130px); /* Fixed calculation for mobile */
        padding: 1rem;
        -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
      }
    }

    /* Message Styling */
    .message {
      display: flex;
      margin-bottom: 16px;
      animation: messageFadeIn 0.3s ease forwards;
      opacity: 0;
    }

    @keyframes messageFadeIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-content {
      max-width: 85%;
      padding: clamp(10px, 3vw, 16px);
      border-radius: 16px;
      font-size: clamp(14px, 4vw, 16px);
      line-height: 1.5;
      position: relative;
      word-wrap: break-word;
    }
    
    @media (max-width: 767px) {
      .message-content {
        max-width: 90%;
        font-size: 1rem;
      }
    }

    .server-message .message-content {
      background: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
      border-bottom-left-radius: 4px;
      margin-right: auto;
    }

    .user-message {
      justify-content: flex-end;
    }

    .user-message .message-content {
      background: #6c5ce7;
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }

    /* Chat Footer */
    #chat-footer {
      padding: clamp(12px, 4vw, 16px);
      background: #ffffff;
      display: flex;
      gap: clamp(8px, 2vw, 12px);
      align-items: center;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: clamp(70px, 10vh, 80px);
      box-sizing: border-box;
    }
    
    @media (max-width: 767px) {
      #chat-footer {
        padding: 12px;
        gap: 12px;
        height: 70px;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
      }
    }

    #chat-input {
      flex: 1;
      padding: clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px);
      border: 1px solid #e1e1e1;
      border-radius: 20px;
      outline: none;
      font-size: clamp(14px, 4vw, 15px);
      line-height: 1.5;
      background: #f8f9fa;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    #chat-input:focus {
      border-color: #6c5ce7;
      box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.12);
    }

    #chat-footer button {
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 50%;
      width: clamp(36px, 10vw, 44px);
      height: clamp(36px, 10vw, 44px);
      padding: 0;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    #chat-footer button svg {
      width: clamp(16px, 5vw, 20px);
      height: clamp(16px, 5vw, 20px);
    }
    
    @media (max-width: 767px) {
      #chat-footer button {
        width: 48px;
        height: 48px;
      }
      
      #chat-footer button svg {
        width: 24px;
        height: 24px;
      }
    }

    #chat-footer button:hover {
      background: #5b4cc4;
      transform: scale(1.05);
    }

    #chat-footer button:active {
      transform: scale(0.95);
    }

    #voice-button.recording {
      animation: pulseRecording 1.5s ease infinite;
    }

    @keyframes pulseRecording {
      0% { transform: scale(1); background: #ff4757; }
      50% { transform: scale(1.1); background: #ff6b81; }
      100% { transform: scale(1); background: #ff4757; }
    }

    /* Additional styling for product and action messages */
    .product-card {
      border: 1px solid #e1e1e1;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #fff;
      width: 100%;
      max-width: 100%;
    }

    .product-card img {
      width: 100%;
      height: auto;
      max-height: 35vh;
      object-fit: cover;
    }
    
    @media (max-width: 767px) {
      .product-card img {
        max-height: 30vh;
      }
    }

    .product-details {
      padding: clamp(10px, 3vw, 12px);
    }
    
    .product-details h4 {
      margin: 8px 0;
      font-size: clamp(14px, 4vw, 16px);
    }
    
    .product-details p {
      margin: 8px 0;
      color: #666;
      font-size: clamp(12px, 3.5vw, 14px);
    }
    
    .product-details strong {
      display: block;
      margin: 8px 0;
      font-size: clamp(16px, 4.5vw, 18px);
      color: #6c5ce7;
    }

    .product-actions {
      display: flex;
      gap: 8px;
      padding: clamp(10px, 3vw, 12px);
      justify-content: flex-end;
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .action-button, .product-action-button {
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 20px;
      padding: clamp(6px, 2vw, 8px) clamp(10px, 3vw, 12px);
      cursor: pointer;
      transition: background 0.2s ease;
      font-size: clamp(12px, 3.5vw, 14px);
      white-space: nowrap;
    }

    .action-button:hover, .product-action-button:hover {
      background: #5b4cc4;
    }
    
    /* Dark mode support - system preference based */
    @media (prefers-color-scheme: dark) {
      #my-chat-window {
        background: #1a1a1a;
      }
      
      #chat-body {
        background: #262626;
      }
      
      #chat-footer, .server-message .message-content {
        background: #333;
        color: #fff;
      }
      
      #chat-input {
        background: #444;
        color: #fff;
        border-color: #555;
      }
      
      .product-card {
        background: #333;
      }
      
      .product-details p {
        color: #ccc;
      }
    }
  `;
  document.head.appendChild(style);
  logger.info("Styles added");

  // Create chat toggle button with SVG icon
  const chatButton = document.createElement("button");
  chatButton.className = "chat-toggle";
  chatButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  chatContainer.appendChild(chatButton);

  // Create chat window container
  const chatWindow = document.createElement("div");
  chatWindow.id = "my-chat-window";
  chatContainer.appendChild(chatWindow);

  logger.info("Chat button and window created");

  // Toggle chat window visibility
  let isOpen = false;

  function isMobile() {
    return window.innerWidth < 768;
  }

  function toggleChat() {
    logger.info("Toggling chat window, current state:", isOpen);

    if (!isOpen) {
      chatWindow.style.display = "block";
      chatWindow.classList.add("chat-show");
      chatWindow.classList.remove("chat-hide");
      isOpen = true;

      if (isMobile()) {
        document.documentElement.classList.add("chat-open");
        document.body.classList.add("chat-open");
        document.body.style.overflow = "hidden"; // Prevent background scrolling

        // Force repaint to ensure full screen on mobile
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 10);
      }

      loadChatInterface();
    } else {
      chatWindow.classList.remove("chat-show");
      chatWindow.classList.add("chat-hide");

      chatWindow.addEventListener(
        "animationend",
        () => {
          chatWindow.style.display = "none";
          isOpen = false;
          document.documentElement.classList.remove("chat-open");
          document.body.classList.remove("chat-open");
          document.body.style.overflow = ""; // Restore scrolling
        },
        { once: true },
      );
    }
  }

  chatButton.addEventListener("click", toggleChat);

  // Handle window resize events to adjust for orientation changes
  window.addEventListener('resize', () => {
    if (isOpen) {
      // Recalculate heights and positions
      const chatBody = document.getElementById("chat-body");
      if (chatBody) {
        // This will trigger height recalculation
        chatBody.style.height = isMobile()
          ? 'calc(100% - 120px)'
          : `calc(100% - clamp(120px, 25vh, 140px))`;
      }
    }
  });

  // Function to load the chat interface from the backend
  function loadChatInterface() {
    logger.info("Loading chat interface...");
    fetch("http://localhost:3000/api/chat/init", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        logger.info("Chat init API response received");
        return response.json();
      })
      .then((data) => {
        chatWindow.innerHTML = `
          <div id="chat-header">
            <span>Chat</span>
            <button class="close-button" aria-label="Close chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div id="chat-body"></div>
          <div id="chat-footer">
            <input type="text" id="chat-input" placeholder="Type a message..." />
            <button id="voice-button" title="Voice Input">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
            <button id="send-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        `;

        // Close button functionality
        const closeButton = chatWindow.querySelector(".close-button");
        closeButton.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleChat();
        });

        // Render initial messages if provided
        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg) => {
            appendServerMessage(msg);
          });
        } else {
          // Fallback welcome text if no messages were returned
          appendServerMessage({
            type: "text",
            content: "Hi! How can I help you today?",
          });
        }
        setupChatMessaging();
        logger.info("Chat interface loaded and initialized");
      })
      .catch((err) => {
        logger.error("Error loading chat interface:", err);
        chatWindow.innerHTML = `
          <div class="error-state" style="padding:20px; text-align:center; color:#ff4757;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>Unable to load chat. Please try again later.</p>
          </div>
        `;
      });
  }

  // Helper function to render server messages based on type
  function appendServerMessage(msg) {
    const chatBody = document.getElementById("chat-body");
    const messageDiv = document.createElement("div");
    messageDiv.className = "message server-message";

    // Enhanced product card rendering
    switch (msg.type) {
      case "text":
        messageDiv.innerHTML = `
            <div class="message-content">
              ${msg.content}
            </div>
          `;
        break;
      case "product":
        // Create a more detailed product card with rating and pricing
        const discount = msg.originalPrice ? Math.round(((msg.originalPrice - msg.price) / msg.originalPrice) * 100) : 0;
        const ratingStars = msg.rating ? generateRatingStars(msg.rating) : '';

        messageDiv.innerHTML = `
            <div class="product-card">
              <div class="product-image-container">
                <img src="${msg.imageUrl}" alt="${msg.title}" loading="lazy" />
                ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
              </div>
              <div class="product-details">
                <h4>${msg.title}</h4>
                <div class="product-rating">${ratingStars}</div>
                <p>${msg.description}</p>
                <div class="product-price">
                  <strong>${formatPrice(msg.price)}</strong>
                  ${msg.originalPrice ? `<span class="original-price">${formatPrice(msg.originalPrice)}</span>` : ''}
                </div>
                ${msg.shipping ? `<div class="shipping-info">${msg.shipping}</div>` : ''}
                ${msg.inStock === false ? `<div class="out-of-stock">Out of Stock</div>` : ''}
              </div>
              <div class="product-actions">
                ${msg.actions
            .map(
              (action) => `
                  ${action.url
                  ? `<a href="${action.url}" class="product-action-button" data-action="${action.value}">${action.label}</a>`
                  : `<button class="product-action-button" data-action="${action.value}">${action.label}</button>`
                }
                `,
            )
            .join("")}
              </div>
            </div>
          `;
        break;
      case "action":
        messageDiv.innerHTML = `
          <div class="message-content">
            <p>${msg.question}</p>
            <div class="action-buttons">
              ${msg.options
            .map(
              (option) =>
                `<button class="action-button" data-action="${option.value}">${option.label}</button>`,
            )
            .join("")}
            </div>
          </div>
        `;
        break;
      case "image":
        messageDiv.innerHTML = `
          <div class="message-content">
            <img src="${msg.imageUrl}" alt="Image message" style="max-width:100%; border-radius:8px;" />
            ${msg.caption ? `<p>${msg.caption}</p>` : ""}
          </div>
        `;
        break;
      default:
        messageDiv.innerHTML = `<div class="message-content">Unknown message type.</div>`;
    }
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Set up click events on any action or product buttons within this message
    const actionButtons = messageDiv.querySelectorAll(
      ".action-button, .product-action-button:not(a)"
    );
    actionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const actionValue = btn.getAttribute("data-action");
        logger.info("Action button clicked:", actionValue);
        sendMessageToServer({ action: actionValue });
      });
    });
  }

  function generateRatingStars(rating) {
    // Round rating to nearest half
    const roundedRating = Math.round(rating * 2) / 2;
    let stars = '';

    // Full stars
    for (let i = 1; i <= Math.floor(roundedRating); i++) {
      stars += '<span class="star full">★</span>';
    }

    // Half star if needed
    if (roundedRating % 1 !== 0) {
      stars += '<span class="star half">★</span>';
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(roundedRating);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="star empty">☆</span>';
    }

    return `<div class="stars">${stars}</div><span class="rating-value">${rating.toFixed(1)}</span>`;
  }

  function formatPrice(price) {
    return `$${price.toFixed(2)}`;
  }

  const additionalStyles = `
  /* Product Card Enhancements */
  .product-card {
    border: 1px solid #e1e1e1;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #fff;
    width: 100%;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .product-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .product-image-container {
    position: relative;
    width: 100%;
  }
  
  .product-card img {
    width: 100%;
    height: auto;
    max-height: 200px;
    object-fit: cover;
    border-bottom: 1px solid #f0f0f0;
  }
  
  @media (max-width: 767px) {
    .product-card img {
      max-height: 180px;
    }
  }
  
  .discount-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #e74c3c;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }
  
  .product-details {
    padding: 12px;
  }
  
  .product-details h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #333;
  }
  
  .product-details p {
    margin: 8px 0;
    color: #666;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .product-rating {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .stars {
    display: inline-flex;
    margin-right: 6px;
  }
  
  .star {
    color: #f39c12;
    font-size: 14px;
  }
  
  .star.empty {
    color: #e1e1e1;
  }
  
  .star.half {
    position: relative;
    color: #e1e1e1;
  }
  
  .star.half:before {
    content: '★';
    position: absolute;
    color: #f39c12;
    width: 50%;
    overflow: hidden;
  }
  
  .rating-value {
    font-size: 14px;
    color: #666;
  }
  
  .product-price {
    display: flex;
    align-items: center;
    margin: 10px 0;
  }
  
  .product-price strong {
    font-size: 18px;
    color: #2ecc71;
    margin-right: 8px;
  }
  
  .original-price {
    text-decoration: line-through;
    color: #999;
    font-size: 14px;
  }
  
  .shipping-info {
    font-size: 12px;
    color: #3498db;
    margin-top: 4px;
  }
  
  .out-of-stock {
    display: inline-block;
    padding: 2px 6px;
    background: #f1f1f1;
    color: #e74c3c;
    font-size: 12px;
    border-radius: 4px;
    margin-top: 4px;
  }
  
  .product-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px 16px;
    justify-content: center;
  }
  
  .product-action-button {
    background: #6c5ce7;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
    font-size: 14px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .product-action-button:hover {
    background: #5b4cc4;
    transform: scale(1.05);
  }
  
  .product-action-button:active {
    transform: scale(0.95);
  }

  /* Special styling for Buy Now button */
  .product-action-button[data-action^="buy_"] {
    background: #2ecc71;
  }
  
  .product-action-button[data-action^="buy_"]:hover {
    background: #27ae60;
  }
  
  /* Different color for View Details button */
  .product-action-button[data-action^="details_"] {
    background: #3498db;
  }
  
  .product-action-button[data-action^="details_"]:hover {
    background: #2980b9;
  }
  
  @media (max-width: 767px) {
    .product-actions {
      flex-direction: column;
    }
    
    .product-action-button {
      width: 100%;
    }
  }
`;

  function addProductStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
  }


  // Move sendMessageToServer to the outer scope so it's accessible everywhere
  function sendMessageToServer(payload) {
    logger.info("Sending message payload to server:", payload);
    fetch("http://localhost:3000/api/chat/message", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        logger.info("Server response received");
        return response.json();
      })
      .then((data) => {
        logger.info("Processing server response:", data);
        const chatBody = document.getElementById("chat-body");
        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg) => {
            appendServerMessage(msg);
          });
        }
        chatBody.scrollTop = chatBody.scrollHeight;
      })
      .catch((err) => {
        logger.error("Error in server communication:", err);
        const chatBody = document.getElementById("chat-body");
        appendServerMessage({
          type: "text",
          content: "Sorry, I couldn't process your message. Please try again.",
        });
        chatBody.scrollTop = chatBody.scrollHeight;
      });
  }

  // Setup chat messaging interactions
  function setupChatMessaging() {
    const sendButton = document.getElementById("send-message");
    const voiceButton = document.getElementById("voice-button");
    const chatInput = document.getElementById("chat-input");
    const chatBody = document.getElementById("chat-body");

    logger.info("Setting up chat messaging components");

    let isRecording = false;
    let recognition = null;

    // Sanitize input to prevent injection attacks
    function sanitizeInput(input) {
      return input.replace(/[<>]/g, "").trim();
    }

    // Handle sending user messages
    function handleMessageSend() {
      const message = sanitizeInput(chatInput.value);
      if (message === "") return;
      logger.info("Sending message:", message);
      appendUserMessage(message);
      chatInput.value = "";
      chatBody.scrollTop = chatBody.scrollHeight;
      sendMessageToServer({ message });
    }

    // Append user message to chat
    function appendUserMessage(message) {
      const messageDiv = document.createElement("div");
      messageDiv.className = "message user-message";
      messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
      chatBody.appendChild(messageDiv);
      logger.info("User message appended to chat");
    }

    // Event listeners for send button and Enter key
    sendButton.addEventListener("click", handleMessageSend);
    chatInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleMessageSend();
      }
    });

    // Voice recognition setup
    voiceButton.addEventListener("click", function () {
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        logger.warn("Speech recognition not supported in this browser");
        alert("Voice recognition is not supported in your browser.");
        return;
      }
      if (isRecording) {
        logger.info("Stopping voice recording");
        if (recognition) recognition.stop();
        return;
      }
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onstart = () => {
        logger.info("Voice recognition started");
        isRecording = true;
        voiceButton.classList.add("recording");
      };
      recognition.onend = () => {
        logger.info("Voice recognition ended");
        isRecording = false;
        voiceButton.classList.remove("recording");
        recognition = null;
      };
      recognition.onerror = (event) => {
        logger.error("Voice recognition error:", event.error);
        isRecording = false;
        voiceButton.classList.remove("recording");
        recognition = null;
      };
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        logger.info("Voice recognition result:", transcript);
        chatInput.value = transcript;
        if (event.results[0].isFinal) {
          handleMessageSend();
        }
      };
      try {
        recognition.start();
        logger.info("Attempting to start voice recognition");
      } catch (error) {
        logger.error("Error starting voice recognition:", error);
        alert("Error starting voice recognition. Please try again.");
      }
    });

    chatInput.focus();
    logger.info("Chat messaging setup completed");
  }
  addProductStyles();
  logger.info("Chat widget initialized");
})();