class OnlineSalePopup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isPopupShown = false;
    this.exitIntentTriggered = false;
    this.mouseLeaveHandler = null;
    this.mouseMoveHandler = null;
    this.countdownInterval = null;
  }

  static get observedAttributes() {
    return [
      'popup-heading', 'popup-subheading', 'popup-description', 'coupon-code',
      'button-text', 'button-link', 'background-color', 'text-color', 
      'button-color', 'popup-width', 'popup-height', 'overlay-opacity'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    // Delay setup to ensure everything is ready
    setTimeout(() => {
      this.setupExitIntentDetection();
      this.startCountdown();
    }, 100);
  }

  disconnectedCallback() {
    this.removeExitIntentDetection();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  setupExitIntentDetection() {
    console.log('Setting up exit intent detection');
    
    // Test trigger - press P key to test popup (for development)
    this.testHandler = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        console.log('P key pressed - triggering popup');
        if (!this.exitIntentTriggered) {
          this.exitIntentTriggered = true;
          this.showPopup();
        }
      }
    };

    // Detect when mouse leaves the top of the viewport (exit intent)
    this.mouseLeaveHandler = (event) => {
      console.log('Mouse leave detected', event.clientY);
      // Check if mouse is leaving through the top of the viewport
      if (event.clientY <= 0 && !this.exitIntentTriggered) {
        console.log('Exit intent triggered via mouse leave');
        this.exitIntentTriggered = true;
        this.showPopup();
      }
    };

    // Additional detection for fast mouse movement towards top
    this.mouseMoveHandler = (event) => {
      if (event.clientY <= 50 && event.movementY < -10 && !this.exitIntentTriggered) {
        console.log('Exit intent triggered via fast upward movement');
        this.exitIntentTriggered = true;
        this.showPopup();
      }
    };

    document.addEventListener('keydown', this.testHandler);
    document.addEventListener('mouseleave', this.mouseLeaveHandler);
    document.addEventListener('mousemove', this.mouseMoveHandler);
    
    console.log('Exit intent listeners attached');
  }

  removeExitIntentDetection() {
    if (this.mouseLeaveHandler) {
      document.removeEventListener('mouseleave', this.mouseLeaveHandler);
    }
    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    if (this.testHandler) {
      document.removeEventListener('keydown', this.testHandler);
    }
  }

  startCountdown() {
    let timeLeft = 15 * 60; // 15 minutes in seconds
    
    this.countdownInterval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      const countdownElement = this.shadowRoot.querySelector('.countdown-timer');
      if (countdownElement) {
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      timeLeft--;
      
      if (timeLeft < 0) {
        clearInterval(this.countdownInterval);
        if (countdownElement) {
          countdownElement.textContent = "00:00";
        }
      }
    }, 1000);
  }

  showPopup() {
    console.log('showPopup called, isPopupShown:', this.isPopupShown);
    
    if (this.isPopupShown) return;
    
    const popup = this.shadowRoot.querySelector('.sale-popup');
    const overlay = this.shadowRoot.querySelector('.popup-overlay');
    
    console.log('Popup elements found:', { popup, overlay });
    
    if (popup && overlay) {
      this.isPopupShown = true;
      overlay.style.display = 'flex';
      
      console.log('Popup display set to flex');
      
      // Animate popup in
      setTimeout(() => {
        overlay.classList.add('show');
        popup.classList.add('show');
        console.log('Popup animation classes added');
      }, 10);
    }
  }

  hidePopup() {
    console.log('hidePopup called');
    
    const popup = this.shadowRoot.querySelector('.sale-popup');
    const overlay = this.shadowRoot.querySelector('.popup-overlay');
    
    if (popup && overlay) {
      overlay.classList.remove('show');
      popup.classList.remove('show');
      
      setTimeout(() => {
        overlay.style.display = 'none';
        this.isPopupShown = false;
        console.log('Popup hidden');
      }, 300);
    }
  }

  handleButtonClick() {
    console.log('handleButtonClick called');
    
    const buttonLink = this.getAttribute('button-link') || '#';
    console.log('Button link:', buttonLink);
    
    if (buttonLink && buttonLink !== '#' && buttonLink.trim() !== '') {
      console.log('Opening link in new tab:', buttonLink);
      window.open(buttonLink, '_blank');
    }
    this.hidePopup();
  }

  handleOverlayClick(event) {
    console.log('handleOverlayClick called', event.target);
    
    if (event.target.classList.contains('popup-overlay')) {
      console.log('Clicking overlay background - hiding popup');
      this.hidePopup();
    }
  }

  setupPopupEventListeners() {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const overlay = this.shadowRoot.querySelector('.popup-overlay');
      const closeBtn = this.shadowRoot.querySelector('.close-btn');
      const ctaButton = this.shadowRoot.querySelector('.cta-button');

      console.log('Setting up popup event listeners:', { overlay, closeBtn, ctaButton });

      if (overlay) {
        overlay.addEventListener('click', (event) => {
          console.log('Overlay clicked');
          this.handleOverlayClick(event);
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
          console.log('Close button clicked');
          event.preventDefault();
          event.stopPropagation();
          this.hidePopup();
        });
      }
      
      if (ctaButton) {
        ctaButton.addEventListener('click', (event) => {
          console.log('CTA button clicked');
          event.preventDefault();
          event.stopPropagation();
          this.handleButtonClick();
        });
      }
    });
  }

  render() {
    const popupHeading = this.getAttribute('popup-heading') || '🔥 FLASH SALE ENDING SOON!';
    const popupSubheading = this.getAttribute('popup-subheading') || 'Don\'t Miss Out - Limited Time Only';
    const popupDescription = this.getAttribute('popup-description') || 'Get massive savings on our best products before this offer expires!';
    const couponCode = this.getAttribute('coupon-code') || 'FLASH50';
    const buttonText = this.getAttribute('button-text') || 'Shop Now & Save';
    const buttonLink = this.getAttribute('button-link') || '#';
    const backgroundColor = this.getAttribute('background-color') || '#ffffff';
    const textColor = this.getAttribute('text-color') || '#333333';
    const buttonColor = this.getAttribute('button-color') || '#e74c3c';
    const popupWidth = parseInt(this.getAttribute('popup-width')) || 550;
    const popupHeight = parseInt(this.getAttribute('popup-height')) || 480;
    const overlayOpacity = this.getAttribute('overlay-opacity') || '0.85';

    this.shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, ${overlayOpacity});
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 999999;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: auto;
        }

        .popup-overlay.show {
          opacity: 1;
        }

        .sale-popup {
          background: linear-gradient(135deg, ${backgroundColor} 0%, #f8f9fa 100%);
          color: ${textColor};
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
          max-width: ${popupWidth}px;
          max-height: ${popupHeight}px;
          width: 90vw;
          padding: 35px 30px;
          text-align: center;
          position: relative;
          transform: scale(0.7) translateY(-50px);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 3px solid #e74c3c;
          overflow: hidden;
        }

        .sale-popup.show {
          transform: scale(1) translateY(0);
          opacity: 1;
        }

        .sale-popup::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(231, 76, 60, 0.1), transparent);
          animation: rotate 3s linear infinite;
          pointer-events: none;
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .close-btn {
          position: absolute;
          top: 15px;
          right: 20px;
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #e74c3c;
          opacity: 0.8;
          transition: all 0.2s ease;
          z-index: 10;
          font-weight: bold;
        }

        .close-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .sale-badge {
          display: inline-block;
          background: linear-gradient(45deg, #e74c3c, #c0392b);
          color: white;
          padding: 8px 20px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
          animation: pulse 2s infinite;
          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .popup-heading {
          font-size: 32px;
          font-weight: 900;
          margin-bottom: 10px;
          line-height: 1.2;
          background: linear-gradient(45deg, #e74c3c, #f39c12);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }

        .popup-subheading {
          font-size: 18px;
          margin-bottom: 20px;
          opacity: 0.8;
          font-weight: 600;
          color: #e74c3c;
        }

        .countdown-section {
          background: linear-gradient(135deg, #2c3e50, #34495e);
          color: white;
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
          position: relative;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
        }

        .countdown-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .countdown-timer {
          font-size: 36px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #e74c3c;
          text-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { text-shadow: 0 0 20px rgba(231, 76, 60, 0.5); }
          to { text-shadow: 0 0 30px rgba(231, 76, 60, 0.8); }
        }

        .popup-description {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 25px;
          opacity: 0.9;
          font-weight: 500;
        }

        .discount-section {
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
          padding: 15px;
          border-radius: 15px;
          margin: 20px 0;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
        }

        .discount-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .discount-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 5px;
          text-transform: uppercase;
        }

        .coupon-code {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 3px;
          font-family: 'Courier New', monospace;
        }

        .savings-highlight {
          background: linear-gradient(45deg, #f39c12, #e67e22);
          color: white;
          padding: 10px 15px;
          border-radius: 10px;
          margin: 15px 0;
          font-weight: bold;
          font-size: 18px;
          box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
        }

        .cta-button {
          background: linear-gradient(45deg, ${buttonColor}, #c0392b);
          color: white;
          border: none;
          padding: 18px 40px;
          font-size: 20px;
          font-weight: bold;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          margin-top: 15px;
          box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          overflow: hidden;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.5s;
        }

        .cta-button:hover::before {
          left: 100%;
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(231, 76, 60, 0.5);
          filter: brightness(1.1);
        }

        .cta-button:active {
          transform: translateY(-1px);
        }

        .urgency-text {
          font-size: 12px;
          color: #e74c3c;
          margin-top: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }

        @media (max-width: 600px) {
          .sale-popup {
            padding: 25px 20px;
            margin: 20px;
          }
          
          .popup-heading {
            font-size: 26px;
          }
          
          .popup-subheading {
            font-size: 16px;
          }
          
          .countdown-timer {
            font-size: 28px;
          }
          
          .coupon-code {
            font-size: 22px;
          }
          
          .cta-button {
            padding: 15px 30px;
            font-size: 18px;
          }
        }
      </style>
      
      <div class="popup-overlay">
        <div class="sale-popup">
          <button class="close-btn">&times;</button>
          
          <div class="sale-badge">Limited Time Offer</div>
          
          <div class="popup-heading">${popupHeading}</div>
          <div class="popup-subheading">${popupSubheading}</div>
          
          <div class="countdown-section">
            <div class="countdown-label">Offer Expires In:</div>
            <div class="countdown-timer">15:00</div>
          </div>
          
          <div class="popup-description">${popupDescription}</div>
          
          <div class="savings-highlight">💰 Save Up To 50% OFF!</div>
          
          <div class="discount-section">
            <div class="discount-label">Use Promo Code:</div>
            <div class="coupon-code">${couponCode}</div>
          </div>
          
          <button class="cta-button">
            ${buttonText}
          </button>
          
          <div class="urgency-text">⚡ Only While Supplies Last!</div>
        </div>
      </div>
    `;

    // Setup event listeners with better timing
    this.setupPopupEventListeners();
  }
}

customElements.define('online-sale-popup', OnlineSalePopup);
