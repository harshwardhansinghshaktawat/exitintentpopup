
class BlogArticleDisplay extends HTMLElement {
  constructor() {
    super();
    // Create a shadow DOM for encapsulation if desired, or append directly to this.
    // For simplicity, we'll append directly to the custom element.
    this.innerHTML = `
      <style>
        /* Basic styling for the article display */
        :host {
          display: block;
          padding: 20px;
          border: 1px solid #ccc;
          background-color: #f9f9f9;
          font-family: Arial, sans-serif;
        }
        h1 {
          color: #333;
          font-size: 2em;
          margin-bottom: 10px;
        }
        div {
          color: #555;
          line-height: 1.6;
        }
      </style>
      <h1 id="article-title"></h1>
      <div id="article-content"></div>
    `;
  }

  connectedCallback() {
    // Initial rendering or setup when the element is connected to the DOM
    this._updateContent();
  }

  static get observedAttributes() {
    return ['article-title', 'article-content'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this._updateContent();
    }
  }

  _updateContent() {
    const titleElement = this.querySelector('#article-title');
    const contentElement = this.querySelector('#article-content');

    if (titleElement) {
      titleElement.textContent = this.getAttribute('article-title') || 'No Title';
    }
    if (contentElement) {
      // Use innerHTML to render rich text content
      contentElement.innerHTML = this.getAttribute('article-content') || 'No Content';
    }
  }
}

customElements.define('blog-article-display', BlogArticleDisplay);
