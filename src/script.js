// src/script.js
if (import.meta.env && import.meta.env.PROD) {
  // In production, import CSS as a raw string and inject it manually.
  import('./styles.css?inline').then((module) => {
    const cssText = module.default;
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
  });
} else if (import.meta.env && import.meta.env.DEV) {
  // In Vite dev environment, import normally so that Vite handles injection (and HMR) for you.
  import('./styles.css');
} else {
  // When not using Vite (direct file access), fetch and inject CSS manually
  fetch('/src/styles.css')
    .then(response => response.text())
    .then(cssText => {
      const style = document.createElement('style');
      style.textContent = cssText;
      document.head.appendChild(style);
    })
    .catch(err => console.warn('Could not load styles:', err));
}



(function () {
  // Retrieve API key from the script tag
  // More resilient approach to getting the API key
  function getApiKey() {
    // Method 1: Try to get the currently executing script (works in modern browsers)
    const currentScript = document.currentScript;
    if (currentScript && currentScript.getAttribute('data-api-key')) {
      return currentScript.getAttribute('data-api-key');
    }

    // Method 2: Scan all script tags that might match our widget
    const scripts = document.querySelectorAll('script[type="module"]');
    for (const script of scripts) {
      // Check for both dev and prod paths, or any script with our data attribute
      if (
        script.getAttribute('data-api-key') &&
        (script.src.includes('chat-widget') || script.src.includes('script.js'))
      ) {
        return script.getAttribute('data-api-key');
      }
    }

    // Method 3: Last resort - check any script with our data attribute
    const scriptWithKey = document.querySelector('script[data-api-key]');
    if (scriptWithKey) {
      return scriptWithKey.getAttribute('data-api-key');
    }

    // Fallback if not found
    console.warn('Could not find API key from script tag');
    return null;
  }
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

  // Sound notification system
  class SoundNotification {
    constructor() {
      this.enabled = localStorage.getItem('chatSoundEnabled') !== 'false';
      this.audioContext = null;
      this.initAudioContext();
    }

    initAudioContext() {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        logger.warn('Audio context not supported:', e);
      }
    }

    async resumeAudioContext() {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }

    playNotificationSound(type = 'message') {
      if (!this.enabled || !this.audioContext) return;
      
      this.resumeAudioContext().then(() => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Different tones for different types
        const frequencies = {
          message: [800, 600], // Pleasant two-tone
          error: [400],        // Lower tone for errors
          success: [900, 700, 500] // Success melody
        };
        
        const freqs = frequencies[type] || frequencies.message;
        let time = this.audioContext.currentTime;
        
        freqs.forEach((freq, index) => {
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          
          osc.frequency.value = freq;
          osc.type = 'sine';
          
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
          gain.gain.linearRampToValueAtTime(0, time + 0.2);
          
          osc.start(time);
          osc.stop(time + 0.2);
          
          time += 0.15;
        });
      }).catch(e => logger.warn('Error playing sound:', e));
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('chatSoundEnabled', this.enabled.toString());
      return this.enabled;
    }

    isEnabled() {
      return this.enabled;
    }
  }

  const soundNotification = new SoundNotification();

  // Helper function to format timestamps
  function formatTimestamp(date = new Date()) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString() === now.toLocaleDateString() 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

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

  // Create chat toggle button with SVG icon
  const chatButton = document.createElement("button");
  chatButton.className = "chat-toggle";
  chatButton.setAttribute('aria-label', 'Open chat');
  chatButton.setAttribute('aria-expanded', 'false');
  chatButton.setAttribute('tabindex', '0');
  chatButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  chatContainer.appendChild(chatButton);

  // Create chat window container
  const chatWindow = document.createElement("div");
  chatWindow.id = "my-chat-window";
  chatWindow.setAttribute('role', 'dialog');
  chatWindow.setAttribute('aria-label', 'Chat conversation');
  chatWindow.setAttribute('aria-modal', 'true');
  chatWindow.setAttribute('tabindex', '-1');
  chatContainer.appendChild(chatWindow);
  
  // Create screen reader live region for announcements
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.id = 'chat-live-region';
  document.body.appendChild(liveRegion);

  logger.info("Chat button and window created");

  // Token storage 
  const TOKEN = getApiKey();

  // Replace this with your public API key (which should be safe to expose)
  const PUBLIC_API_KEY = getApiKey();
  
  // Demo mode configuration
  const DEMO_MODE = !PUBLIC_API_KEY || PUBLIC_API_KEY === 'demo' || window.location.protocol === 'file:';
  
  // Demo responses for testing without backend
  function getDemoResponse(message) {
    const responses = [
      "Thanks for your message! This is a demo response.",
      "I understand you're interested in our products. How can I help you today?",
      "That's a great question! In demo mode, I can show you how the chat works.",
      "This chat widget supports rich responses, typing indicators, and sound notifications!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

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
      
      // Update ARIA attributes
      chatButton.setAttribute('aria-expanded', 'true');
      chatButton.setAttribute('aria-label', 'Close chat');

      if (isMobile()) {
        document.documentElement.classList.add("chat-open");
        document.body.classList.add("chat-open");
        document.body.style.overflow = "hidden";
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 10);
      }

      loadChatInterface();
      
      // Focus management
      setTimeout(() => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.focus();
        }
      }, 300);
      
    } else {
      chatWindow.classList.remove("chat-show");
      chatWindow.classList.add("chat-hide");
      
      // Update ARIA attributes
      chatButton.setAttribute('aria-expanded', 'false');
      chatButton.setAttribute('aria-label', 'Open chat');
      
      chatWindow.addEventListener(
        "animationend",
        () => {
          chatWindow.style.display = "none";
          isOpen = false;
          document.documentElement.classList.remove("chat-open");
          document.body.classList.remove("chat-open");
          document.body.style.overflow = "";
          
          // Return focus to chat button
          chatButton.focus();
        },
        { once: true }
      );
    }
  }
  chatButton.addEventListener("click", toggleChat);

  // Handle window resize events to adjust for orientation changes
  window.addEventListener("resize", () => {
    if (isOpen) {
      const chatBody = document.getElementById("chat-body");
      if (chatBody) {
        chatBody.style.height = isMobile()
          ? "calc(100% - 120px)"
          : `calc(100% - clamp(120px, 25vh, 140px))`;
      }
    }
  });

  // Function to load the chat interface 
  function loadChatInterface() {
    logger.info("Loading chat interface...");

    // Create chat UI without initial API call
    initChatUI();
  }

  // Initialize the chat UI
  function initChatUI() {
    chatWindow.innerHTML = `
      <header id="chat-header" role="banner">
        <h1 id="chat-title">Chat</h1>
        <div class="header-controls">
          <button class="sound-toggle" aria-label="Toggle sound notifications" title="${soundNotification.isEnabled() ? 'Mute notifications' : 'Enable sound notifications'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              ${soundNotification.isEnabled() ? 
                '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>' :
                '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
              }
            </svg>
          </button>
          <button class="close-button" aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>
      <main id="chat-body" role="log" aria-live="polite" aria-label="Chat messages" tabindex="0"></main>
      <footer id="chat-footer" role="form">
        <label for="chat-input" class="sr-only">Type your message</label>
        <input type="text" id="chat-input" placeholder="Type a message..." aria-describedby="chat-input-hint" autocomplete="off" />
        <div id="chat-input-hint" class="sr-only">Press Enter to send message, or use voice input button</div>
        <button id="voice-button" aria-label="Start voice input" title="Voice Input">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
        <button id="send-message" aria-label="Send message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </footer>
    `;

    // Close button functionality
    const closeButton = chatWindow.querySelector(".close-button");
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleChat();
    });

    // Sound toggle functionality
    const soundToggle = chatWindow.querySelector(".sound-toggle");
    soundToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const enabled = soundNotification.toggle();
      soundToggle.setAttribute('title', enabled ? 'Mute notifications' : 'Enable sound notifications');
      soundToggle.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${enabled ? 
            '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>' :
            '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
          }
        </svg>
      `;
      // Play a test sound when enabling
      if (enabled) {
        soundNotification.playNotificationSound('success');
      }
    });

    // Add initial welcome message
    const welcomeMessage = DEMO_MODE 
      ? "Hi! Welcome to the chat widget demo. Try sending a message to see it in action!" 
      : "Hi! How can I help you today?";
    
    appendServerMessage({
      type: "text",
      content: welcomeMessage,
    });
    
    // Set up keyboard navigation
    setupKeyboardNavigation();

    setupChatMessaging();
    logger.info("Chat interface loaded and initialized");
  }

  // Helper function to show typing indicator
  function showTypingIndicator() {
    const chatBody = document.getElementById("chat-body");
    // Remove existing typing indicator
    const existingIndicator = chatBody.querySelector('.typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    const typingDiv = document.createElement("div");
    typingDiv.className = "message server-message typing-indicator";
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Helper function to hide typing indicator
  function hideTypingIndicator() {
    const chatBody = document.getElementById("chat-body");
    const typingIndicator = chatBody.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Helper function to render server messages based on type
  function appendServerMessage(msg) {
    const chatBody = document.getElementById("chat-body");
    // Hide typing indicator before showing message
    hideTypingIndicator();
    
    const messageDiv = document.createElement("div");
    messageDiv.className = "message server-message";
    const timestamp = new Date();
    switch (msg.type) {
      case "text":
        messageDiv.innerHTML = `
            <div class="message-content">
              ${msg.content}
            </div>
          `;
        break;
      case "product":
        const discount = msg.originalPrice
          ? Math.round(((msg.originalPrice - msg.price) / msg.originalPrice) * 100)
          : 0;
        const ratingStars = msg.rating ? generateRatingStars(msg.rating) : "";
        messageDiv.innerHTML = `
            <div class="product-card">
              <div class="product-image-container">
                <img src="${msg.imageUrl}" alt="${msg.title}" loading="lazy" />
                ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}
              </div>
              <div class="product-details">
                <h4>${msg.title}</h4>
                <div class="product-rating">${ratingStars}</div>
                <p>${msg.description}</p>
                <div class="product-price">
                  <strong>${formatPrice(msg.price)}</strong>
                  ${msg.originalPrice ? `<span class="original-price">${formatPrice(msg.originalPrice)}</span>` : ""}
                </div>
                ${msg.shipping ? `<div class="shipping-info">${msg.shipping}</div>` : ""}
                ${msg.inStock === false ? `<div class="out-of-stock">Out of Stock</div>` : ""}
              </div>
              <div class="product-actions">
                ${msg.actions
            .map(
              (action) => `
                  ${action.url
                  ? `<a href="${action.url}" class="product-action-button" data-action="${action.value}">${action.label}</a>`
                  : `<button class="product-action-button" data-action="${action.value}">${action.label}</button>`
                }
                `
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
                `<button class="action-button" data-action="${option.value}">${option.label}</button>`
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
        messageDiv.innerHTML = `<div class="message-content">${msg}</div>`;
    }
    
    // Add timestamp to all server messages
    const existingContent = messageDiv.innerHTML;
    messageDiv.innerHTML = `
      ${existingContent}
      <div class="message-timestamp" title="${timestamp.toLocaleString()}">
        ${formatTimestamp(timestamp)}
      </div>
    `;
    
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Only play notification sound for server messages (not typing indicator)
    if (msg.type && !messageDiv.classList.contains('typing-indicator')) {
      soundNotification.playNotificationSound(msg.type === 'text' ? 'message' : 'success');
    }
    
    // Announce new messages to screen readers
    if (msg.type === 'text') {
      announceToScreenReader(`New message: ${msg.content.replace(/<[^>]*>/g, '')}`);
    } else if (msg.type === 'product') {
      announceToScreenReader(`Product suggestion: ${msg.title}`);
    }
    const actionButtons = messageDiv.querySelectorAll(".action-button, .product-action-button:not(a)");
    actionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const actionValue = btn.getAttribute("data-action");
        logger.info("Action button clicked:", actionValue);
        
        // Show typing indicator for action responses
        showTypingIndicator();
        
        sendMessageToServer({ action: actionValue });
      });
    });
  }

  function generateRatingStars(rating) {
    const roundedRating = Math.round(rating * 2) / 2;
    let stars = "";
    for (let i = 1; i <= Math.floor(roundedRating); i++) {
      stars += '<span class="star full">★</span>';
    }
    if (roundedRating % 1 !== 0) {
      stars += '<span class="star half">★</span>';
    }
    const emptyStars = 5 - Math.ceil(roundedRating);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="star empty">☆</span>';
    }
    return `<div class="stars">${stars}</div><span class="rating-value">${rating.toFixed(1)}</span>`;
  }

  function formatPrice(price) {
    return `$${price.toFixed(2)}`;
  }

  // Send message to server with the token included in the request body
  function sendMessageToServer(payload, userMessageDiv = null) {
    logger.info("Sending message payload to server:", payload);

    // Generate a unique user identifier if we don't have one yet
    if (!window.chatUserIdentifier) {
      window.chatUserIdentifier = 'user-' + Math.random().toString(36).substring(2, 15);
      logger.info("Generated user identifier:", window.chatUserIdentifier);
    }

    // Format the request according to the curl command
    const requestBody = {
      token: PUBLIC_API_KEY, // Use the API key from the script tag
      message: payload.message,
      userIdentifier: window.chatUserIdentifier
    };

    // Check if we're in demo mode (no backend required)
    if (DEMO_MODE) {
      logger.info("Running in demo mode - simulating server response");
      
      // Simulate network delay
      setTimeout(() => {
        // Update user message status to sent
        if (userMessageDiv) {
          const statusEl = userMessageDiv.querySelector('.message-status');
          if (statusEl) {
            statusEl.setAttribute('data-status', 'sent');
            statusEl.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,11 12,14 22,4"></polyline>
              </svg>
            `;
          }
        }
        
        // Generate demo response
        const demoResponse = {
          success: true,
          message: getDemoResponse(payload.message || '')
        };
        
        // Simulate the response processing
        const messageContent = demoResponse.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');

        appendServerMessage({
          type: "text",
          content: messageContent
        });

        const chatBody = document.getElementById("chat-body");
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 1000 + Math.random() * 1000); // Random delay 1-2 seconds
      
      return; // Exit early in demo mode
    }
    
    fetch("http://localhost:5173/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:8080"
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        logger.info("Server response received", response.status);

        // Handle non-200 status codes
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(JSON.stringify({ status: response.status, data: errorData }));
          }).catch(() => {
            throw new Error(JSON.stringify({ status: response.status, data: { error: 'Unknown error' } }));
          });
        }

        return response.json();
      })
      .then((data) => {
        logger.info("Processing server response:", data);
        
        // Update user message status to sent
        if (userMessageDiv) {
          const statusEl = userMessageDiv.querySelector('.message-status');
          if (statusEl) {
            statusEl.setAttribute('data-status', 'sent');
            statusEl.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,11 12,14 22,4"></polyline>
              </svg>
            `;
          }
        }

        // Handle the response format from the curl example
        if (data.success && data.message) {
          // Convert the markdown response to HTML (basic conversion)
          const messageContent = data.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

          appendServerMessage({
            type: "text",
            content: messageContent
          });
        } else if (data.messages && Array.isArray(data.messages)) {
          // Handle original format if server responds that way
          data.messages.forEach((msg) => {
            appendServerMessage(msg);
          });
        } else {
          // Fallback for unexpected response format
          appendServerMessage({
            type: "text",
            content: "Received response from server but in an unexpected format."
          });
        }

        const chatBody = document.getElementById("chat-body");
        chatBody.scrollTop = chatBody.scrollHeight;
      })
      .catch((err) => {
        logger.error("Error in server communication:", err);
        const chatBody = document.getElementById("chat-body");
        
        // Update user message status to error
        if (userMessageDiv) {
          const statusEl = userMessageDiv.querySelector('.message-status');
          if (statusEl) {
            statusEl.setAttribute('data-status', 'error');
            statusEl.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            `;
            statusEl.style.cursor = 'pointer';
            statusEl.title = 'Click to retry';
            statusEl.onclick = () => {
              statusEl.setAttribute('data-status', 'sending');
              statusEl.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              `;
              statusEl.style.cursor = 'default';
              statusEl.title = '';
              statusEl.onclick = null;
              const messageContent = userMessageDiv.querySelector('.message-content').textContent.replace(/\s*$/, '');
              sendMessageToServer({ message: messageContent }, userMessageDiv);
            };
          }
        }

        let errorMessage = "Sorry, I couldn't process your message. Please try again.";

        // Handle specific error responses
        try {
          const errorInfo = JSON.parse(err.message);
          if (errorInfo.status === 401) {
            const errorData = errorInfo.data;
            if (errorData && errorData.error) {
              if (errorData.error.includes('Invalid API token') || errorData.error.includes('unauthorized')) {
                errorMessage = "🔒 Authentication failed. Please check your API key configuration.";
              } else {
                errorMessage = `❌ Authentication error: ${errorData.error}`;
              }
            } else {
              errorMessage = "🔒 Unauthorized access. Please check your API key.";
            }
          } else if (errorInfo.status === 403) {
            errorMessage = "🚫 Access forbidden. Please check your permissions.";
          } else if (errorInfo.status === 500) {
            errorMessage = "⚠️ Server error. Please try again later.";
          } else if (errorInfo.data && errorInfo.data.error) {
            errorMessage = `❌ Error: ${errorInfo.data.error}`;
          }
        } catch (parseErr) {
          // If error parsing fails, use the original error message or default
          if (err.message && !err.message.includes('fetch')) {
            errorMessage = `❌ ${err.message}`;
          }
        }

        appendServerMessage({
          type: "text",
          content: errorMessage,
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
    function sanitizeInput(input) {
      return input.replace(/[<>]/g, "").trim();
    }
    function handleMessageSend() {
      const message = sanitizeInput(chatInput.value);
      if (message === "") return;
      logger.info("Sending message:", message);
      const userMessageDiv = appendUserMessage(message);
      chatInput.value = "";
      chatBody.scrollTop = chatBody.scrollHeight;
      
      // Show typing indicator
      setTimeout(() => {
        showTypingIndicator();
      }, 500);
      
      // Send message and update status
      sendMessageToServer({ message }, userMessageDiv);
    }
    function appendUserMessage(message) {
      const messageDiv = document.createElement("div");
      messageDiv.className = "message user-message";
      const timestamp = new Date();
      messageDiv.innerHTML = `
        <div class="message-content">
          ${message}
          <div class="message-status" data-status="sending">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </div>
        </div>
        <div class="message-timestamp" title="${timestamp.toLocaleString()}">
          ${formatTimestamp(timestamp)}
        </div>
      `;
      chatBody.appendChild(messageDiv);
      logger.info("User message appended to chat");
      return messageDiv;
    }
    sendButton.addEventListener("click", handleMessageSend);
    chatInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleMessageSend();
      }
    });
    voiceButton.addEventListener("click", function () {
      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        logger.warn("Speech recognition not supported in this browser");
        alert("Voice recognition is not supported in your browser.");
        return;
      }
      if (isRecording) {
        logger.info("Stopping voice recording");
        if (recognition) recognition.stop();
        return;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
  
  // Keyboard navigation setup
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      
      // Escape key to close chat
      if (e.key === 'Escape') {
        e.preventDefault();
        toggleChat();
      }
      
      // Tab key management for focus trapping
      if (e.key === 'Tab') {
        const focusableElements = chatWindow.querySelectorAll(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }
  
  // Screen reader announcements
  function announceToScreenReader(message) {
    const liveRegion = document.getElementById('chat-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }
  logger.info("Chat widget initialized");
})();