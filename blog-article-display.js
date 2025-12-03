// public/custom-elements/blog-markdown-viewer.js

class BlogMarkdownViewer extends HTMLElement {
  constructor() {
    super();
    // Attach a shadow DOM to the custom element.
    // This helps encapsulate the element's styles and markup.
    this.attachShadow({ mode: 'open' });
  }

  // Define which attributes to observe for changes
  static get observedAttributes() {
    return ['article-content'];
  }

  // Callback for when observed attributes change
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'article-content' && newValue !== oldValue) {
      this.renderContent(newValue);
    }
  }

  connectedCallback() {
    // Initial render or setup when the element is connected to the DOM
    this.shadowRoot.innerHTML = `
      <style>
        /* Basic styling for the content */
        :host {
          display: block;
          padding: 16px;
          border: 1px solid #ccc;
          background-color: #f9f9f9;
        }
        .markdown-content {
          font-family: sans-serif;
          line-height: 1.6;
        }
        /* Add more styles for markdown elements like h1, p, ul, li, etc. */
        .markdown-content h1 { font-size: 2em; margin-bottom: 0.5em; }
        .markdown-content p { margin-bottom: 1em; }
      </style>
      <div class="markdown-content">Loading blog content...</div>
    `;
    // If content is already set via attribute before connectedCallback, render it
    if (this.hasAttribute('article-content')) {
      this.renderContent(this.getAttribute('article-content'));
    }
  }

  renderContent(ricosJsonString) {
    const contentDiv = this.shadowRoot.querySelector('.markdown-content');
    if (!contentDiv) return;

    if (!ricosJsonString) {
      contentDiv.innerHTML = 'No article content available.';
      return;
    }

    let markdownContent = '';
    try {
      const ricosDocument = JSON.parse(ricosJsonString);
      // --- IMPORTANT: Ricos to Markdown Conversion ---
      // The documentation provided does not offer a direct API to convert
      // a Ricos Document object to Markdown.
      // You would need to implement custom logic here or use an external library
      // to parse the 'ricosDocument' object and generate Markdown.
      // For demonstration, we'll just display the stringified Ricos JSON.
      // In a real scenario, 'markdownContent' would be the result of your conversion.
      markdownContent = `
        <p><strong>Note:</strong> Direct Ricos to Markdown conversion is not provided by Wix documentation.</p>
        <p>Displaying raw Ricos JSON for demonstration:</p>
        <pre>${JSON.stringify(ricosDocument, null, 2)}</pre>
        <p>If converted to Markdown and then to HTML, it would be rendered here.</p>
      `;
      // If you had a function `convertRicosToMarkdown(ricosDocument)` and then
      // `renderMarkdownAsHtml(markdownString)`, you would use them here:
      // const markdown = convertRicosToMarkdown(ricosDocument);
      // markdownContent = renderMarkdownAsHtml(markdown);

    } catch (e) {
      console.error("Failed to parse Ricos JSON or convert to Markdown:", e);
      markdownContent = `<p>Error loading content: ${e.message}</p>`;
    }

    contentDiv.innerHTML = markdownContent;
  }
}

// Register the custom element with a unique tag name
customElements.define('blog-markdown-viewer', BlogMarkdownViewer);
