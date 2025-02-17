(function () {
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
        /* Increased size range:
           - Minimum size increased to 70px for better mobile touch targets
           - Maximum size increased to 120px for better visibility
           - Base size increased to 15vw for more prominent presence */
        width: min(max(70px, 15vw), 120px);
        height: min(max(70px, 15vw), 120px);
        /* Larger font size for better visibility:
           - Minimum increased to 28px
           - Maximum increased to 40px */
        font-size: min(max(28px, 4vw), 40px);
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    }

    /* Chat Window */
    #my-chat-window {
        display: none;
        /* Increased width range:
           - Maximum width increased to 800px for desktop
           - Mobile width uses nearly full viewport */
        width: min(800px, calc(100vw - 20px));
        /* Increased height:
           - Maximum height increased to 900px
           - Uses 90vh for better screen coverage
           - Maintains small gap at bottom */
        height: min(900px, calc(90vh - 10px));
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        position: fixed;
        /* Adjusted positioning for larger size */
        right: 10px;
        bottom: 140px; /* Increased to accommodate larger toggle button */
        /* Center horizontally on mobile */
        left: 50%;
        transform: translateX(-50%);
        z-index: 10002;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    }

    /* Desktop enhancement for positioning */
    @media (min-width: 1024px) { /* Increased breakpoint for larger screens */
        #my-chat-window {
            left: auto;
            transform: none;
            right: 20px; /* More space on desktop */
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

    /* Chat Header */
    #chat-header {
      background: #6c5ce7;
      color: #fff;
      padding: 20px;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .close-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    /* Chat Body */
    #chat-body {
      padding: 20px;
      overflow-y: auto;
      height: calc(100% - 140px);
      background: #f8f9fa;
      scroll-behavior: smooth;
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
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
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
      padding: 16px;
      background: #ffffff;
      display: flex;
      gap: 12px;
      align-items: center;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }

    #chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e1e1e1;
      border-radius: 20px;
      outline: none;
      font-size: 15px;
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
      width: 40px;
      height: 40px;
      padding: 0;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
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
    }

    .product-card img {
      width: 100%;
      object-fit: cover;
    }

    .product-details {
      padding: 12px;
    }

    .product-actions {
      display: flex;
      gap: 8px;
      padding: 12px;
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
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.2s ease;
      font-size: 12px;
    }

    .action-button:hover, .product-action-button:hover {
      background: #5b4cc4;
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
        document.body.style.overflow = "hidden"; // Prevent background scrolling
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
          document.body.style.overflow = ""; // Restore scrolling
        },
        { once: true },
      );
    }
  }

  chatButton.addEventListener("click", toggleChat);

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

    // Mobile-optimized message rendering
    switch (msg.type) {
      case "text":
        messageDiv.innerHTML = `
            <div class="message-content">
              ${msg.content}
            </div>
          `;
        break;
      case "product":
        messageDiv.innerHTML = `
            <div class="product-card">
              <img src="${msg.imageUrl}" alt="${msg.title}" loading="lazy" />
              <div class="product-details">
                <h4 style="margin: 8px 0; font-size: 16px;">${msg.title}</h4>
                <p style="margin: 8px 0; color: #666;">${msg.description}</p>
                <strong style="display: block; margin: 8px 0; font-size: 18px; color: #6c5ce7;">
                  $${msg.price.toFixed(2)}
                </strong>
              </div>
              <div class="action-buttons" style="padding: 8px;">
                ${msg.actions
                  .map(
                    (action) => `
                  <button class="product-action-button" data-action="${action.value}">
                    ${action.label}
                  </button>
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
      ".action-button, .product-action-button",
    );
    actionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const actionValue = btn.getAttribute("data-action");
        logger.info("Action button clicked:", actionValue);
        sendMessageToServer({ action: actionValue });
      });
    });
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
})();
