class MarkdownBlogViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State management
    this.state = {
      title: '',
      featuredImage: '',
      markdownContent: '',
      isLoading: true
    };

    this.initializeUI();
  }

  // CMS Integration - Observed attributes
  static get observedAttributes() {
    return ['cms-title', 'cms-featured-image', 'cms-markdown-content'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    if (name === 'cms-title') {
      this.state.title = newValue;
      this.updateTitle();
    } else if (name === 'cms-featured-image') {
      this.state.featuredImage = newValue;
      this.updateFeaturedImage();
    } else if (name === 'cms-markdown-content') {
      this.state.markdownContent = newValue;
      this.updateContent();
    }
  }

  // Initialize the UI components with beautiful, modern design
  initializeUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        * {
          box-sizing: border-box;
        }

        .blog-post-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #ffffff;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          flex-direction: column;
          gap: 20px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          color: #666;
          font-size: 16px;
        }

        /* Blog Post Header */
        .blog-header {
          margin-bottom: 40px;
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .blog-title {
          font-size: clamp(28px, 5vw, 48px);
          font-weight: 800;
          line-height: 1.2;
          color: #1a1a1a;
          margin: 0 0 30px 0;
          letter-spacing: -0.02em;
        }

        /* Featured Image */
        .featured-image-container {
          width: 100%;
          margin-bottom: 50px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.8s ease-out 0.2s both;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .featured-image {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          max-height: 500px;
        }

        .featured-image.hidden {
          display: none;
        }

        /* Blog Content */
        .blog-content {
          font-size: 18px;
          line-height: 1.8;
          color: #333;
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        /* Markdown Styling */
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          font-weight: 700;
          line-height: 1.3;
          margin-top: 40px;
          margin-bottom: 20px;
          color: #1a1a1a;
          letter-spacing: -0.01em;
        }

        .blog-content h1 {
          font-size: clamp(32px, 4vw, 42px);
          margin-top: 60px;
        }

        .blog-content h2 {
          font-size: clamp(28px, 3.5vw, 36px);
          margin-top: 50px;
        }

        .blog-content h3 {
          font-size: clamp(24px, 3vw, 30px);
        }

        .blog-content h4 {
          font-size: clamp(20px, 2.5vw, 24px);
        }

        .blog-content h5 {
          font-size: clamp(18px, 2vw, 20px);
        }

        .blog-content h6 {
          font-size: clamp(16px, 1.8vw, 18px);
        }

        .blog-content p {
          margin-bottom: 24px;
          font-size: 18px;
          line-height: 1.8;
        }

        .blog-content a {
          color: #3498db;
          text-decoration: none;
          border-bottom: 1px solid #3498db;
          transition: all 0.3s ease;
        }

        .blog-content a:hover {
          color: #2980b9;
          border-bottom-color: #2980b9;
        }

        .blog-content strong,
        .blog-content b {
          font-weight: 700;
          color: #1a1a1a;
        }

        .blog-content em,
        .blog-content i {
          font-style: italic;
        }

        .blog-content ul,
        .blog-content ol {
          margin-bottom: 24px;
          padding-left: 30px;
        }

        .blog-content li {
          margin-bottom: 12px;
          line-height: 1.8;
        }

        .blog-content ul li {
          list-style-type: disc;
        }

        .blog-content ol li {
          list-style-type: decimal;
        }

        .blog-content blockquote {
          margin: 30px 0;
          padding: 20px 30px;
          border-left: 4px solid #3498db;
          background-color: #f8f9fa;
          font-style: italic;
          color: #555;
          border-radius: 0 8px 8px 0;
        }

        .blog-content blockquote p {
          margin-bottom: 0;
        }

        .blog-content code {
          background-color: #f4f4f4;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #e74c3c;
        }

        .blog-content pre {
          background-color: #2d2d2d;
          color: #f8f8f2;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 30px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: #f8f8f2;
          font-size: 14px;
        }

        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 30px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .blog-content hr {
          border: none;
          border-top: 2px solid #e0e0e0;
          margin: 40px 0;
        }

        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .blog-content table th,
        .blog-content table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .blog-content table th {
          background-color: #f8f9fa;
          font-weight: 700;
          color: #1a1a1a;
        }

        .blog-content table tr:last-child td {
          border-bottom: none;
        }

        .blog-content table tr:hover {
          background-color: #f8f9fa;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .blog-post-container {
            padding: 30px 16px;
          }

          .blog-title {
            margin-bottom: 24px;
          }

          .blog-content {
            font-size: 16px;
          }

          .blog-content h1,
          .blog-content h2,
          .blog-content h3 {
            margin-top: 30px;
          }

          .featured-image-container {
            margin-bottom: 30px;
            border-radius: 8px;
          }

          .blog-content blockquote {
            padding: 16px 20px;
            margin: 20px 0;
          }

          .blog-content pre {
            padding: 16px;
            font-size: 13px;
          }

          .blog-content ul,
          .blog-content ol {
            padding-left: 20px;
          }
        }

        @media (max-width: 480px) {
          .blog-post-container {
            padding: 20px 12px;
          }

          .blog-content {
            font-size: 15px;
          }

          .blog-content table {
            font-size: 14px;
          }

          .blog-content table th,
          .blog-content table td {
            padding: 8px 12px;
          }
        }

        /* Print Styles */
        @media print {
          .blog-post-container {
            max-width: 100%;
            padding: 0;
          }

          .featured-image-container {
            box-shadow: none;
          }

          .blog-content a {
            color: #000;
            border-bottom: none;
          }
        }
      </style>

      <div class="blog-post-container">
        <div class="loading-state" id="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading blog post...</p>
        </div>

        <div id="blog-content-wrapper" style="display: none;">
          <div class="blog-header">
            <h1 class="blog-title" id="blog-title"></h1>
          </div>

          <div class="featured-image-container" id="featured-image-container">
            <img class="featured-image" id="featured-image" alt="" />
          </div>

          <div class="blog-content" id="blog-content"></div>
        </div>
      </div>
    `;

    // Get DOM references
    this.loadingState = this.shadowRoot.getElementById('loading-state');
    this.contentWrapper = this.shadowRoot.getElementById('blog-content-wrapper');
    this.titleElement = this.shadowRoot.getElementById('blog-title');
    this.featuredImageContainer = this.shadowRoot.getElementById('featured-image-container');
    this.featuredImageElement = this.shadowRoot.getElementById('featured-image');
    this.contentElement = this.shadowRoot.getElementById('blog-content');
  }

  // Update title
  updateTitle() {
    if (this.titleElement) {
      this.titleElement.textContent = this.state.title;
    }
  }

  // Update featured image
  updateFeaturedImage() {
    if (this.featuredImageElement && this.featuredImageContainer) {
      if (this.state.featuredImage) {
        this.featuredImageElement.src = this.state.featuredImage;
        this.featuredImageElement.alt = this.state.title || 'Featured Image';
        this.featuredImageContainer.style.display = 'block';
      } else {
        this.featuredImageContainer.style.display = 'none';
      }
    }
  }

  // Update content with Markdown rendering
  updateContent() {
    if (this.contentElement) {
      // Use marked.js from CDN for Markdown parsing
      if (typeof marked !== 'undefined') {
        this.contentElement.innerHTML = marked.parse(this.state.markdownContent);
      } else {
        // Fallback: Load marked.js dynamically
        this.loadMarkedJS().then(() => {
          this.contentElement.innerHTML = marked.parse(this.state.markdownContent);
        });
      }
    }
    
    this.hideLoading();
  }

  // Load marked.js library dynamically
  loadMarkedJS() {
    return new Promise((resolve, reject) => {
      if (typeof marked !== 'undefined') {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load marked.js'));
      document.head.appendChild(script);
    });
  }

  // Hide loading state and show content
  hideLoading() {
    if (this.loadingState && this.contentWrapper) {
      this.loadingState.style.display = 'none';
      this.contentWrapper.style.display = 'block';
    }
  }

  // Connected callback
  connectedCallback() {
    // Load marked.js when component is connected
    this.loadMarkedJS().catch(error => {
      console.error('Error loading marked.js:', error);
    });
    
    // If we already have data, update the UI
    if (this.state.title || this.state.featuredImage || this.state.markdownContent) {
      this.hideLoading();
    }
  }
}

// Register the custom element for Wix
customElements.define('markdown-blog-viewer', MarkdownBlogViewer);

// Wix Custom Element Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownBlogViewer;
}

// Global registration for Wix environment
if (typeof window !== 'undefined' && window.customElements) {
  window.MarkdownBlogViewer = MarkdownBlogViewer;
}
