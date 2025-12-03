// blog-article-display.js
class BlogArticleDisplay extends HTMLElement {
  constructor() {
    super();
    // Attach a shadow DOM for encapsulation, or append directly to this
    this.attachShadow({ mode: 'open' }); 
    this.titleElement = document.createElement('h2');
    this.contentElement = document.createElement('div');
    this.shadowRoot.appendChild(this.titleElement);
    this.shadowRoot.appendChild(this.contentElement);

    // Optional: Add some basic styling
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        padding: 20px;
        border: 1px solid #ccc;
        background-color: #f9f9f9;
      }
      h2 {
        color: #333;
        margin-bottom: 15px;
      }
      div {
        color: #555;
        line-height: 1.6;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  // Specify which attributes to observe for changes
  static get observedAttributes() {
    return ['article-title', 'article-content'];
  }

  // Callback function when an observed attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'article-title') {
      this.titleElement.textContent = newValue;
    } else if (name === 'article-content') {
      // Use innerHTML to render content, assuming it's plain text from getPost().plainContent
      // If rich HTML content is needed, ensure the source provides it and handle sanitization.
      this.contentElement.innerHTML = newValue; 
    }
  }
}

// Register the custom element with a unique tag name
customElements.define('blog-article-display', BlogArticleDisplay);
