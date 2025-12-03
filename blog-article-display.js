class BlogArticleElement extends HTMLElement {
  constructor() {
    super();
    // Create a shadow DOM for encapsulation
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        /* Basic styling for the article content */
        :host {
          display: block;
          padding: 20px;
          border: 1px solid #ccc;
          font-family: sans-serif;
        }
        h1 {
          font-size: 2em;
          margin-bottom: 0.5em;
        }
        p {
          margin-bottom: 1em;
          line-height: 1.6;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1em 0;
        }
      </style>
      <div id="article-container">
        <h1 id="article-title"></h1>
        <div id="article-content"></div>
      </div>
    `;
  }

  // Define observed attributes to react to changes from Velo
  static get observedAttributes() {
    return ['article-title', 'article-content-html'];
  }

  // Callback for when observed attributes change
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'article-title') {
      this.shadowRoot.getElementById('article-title').textContent = newValue;
    } else if (name === 'article-content-html') {
      // Set the innerHTML directly for rich content
      this.shadowRoot.getElementById('article-content').innerHTML = newValue;
    }
  }

  connectedCallback() {
    // Initial rendering or setup if needed
    // Attributes will be set by Velo after connection
  }
}

// Register the custom element with a unique tag name
customElements.define('blog-article-element', BlogArticleElement);
