class BlogPostRenderer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State management
    this.state = {
      title: '',
      content: '',
      author: '',
      publishDate: '',
      featuredImage: '',
      category: '',
      tags: [],
      readingTime: 0
    };

    this.initializeUI();
  }

  // CMS Integration - Observed Attributes
  static get observedAttributes() {
    return [
      'cms-title',
      'cms-content',
      'cms-author',
      'cms-date',
      'cms-featured-image',
      'cms-category',
      'cms-tags',
      'cms-reading-time'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    switch (name) {
      case 'cms-title':
        this.state.title = newValue;
        break;
      case 'cms-content':
        this.state.content = newValue;
        break;
      case 'cms-author':
        this.state.author = newValue;
        break;
      case 'cms-date':
        this.state.publishDate = newValue;
        break;
      case 'cms-featured-image':
        this.state.featuredImage = newValue;
        break;
      case 'cms-category':
        this.state.category = newValue;
        break;
      case 'cms-tags':
        this.state.tags = newValue ? newValue.split(',').map(tag => tag.trim()) : [];
        break;
      case 'cms-reading-time':
        this.state.readingTime = parseInt(newValue) || 0;
        break;
    }

    this.render();
  }

  // Initialize UI with styles
  initializeUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --primary-color: #2563eb;
          --secondary-color: #64748b;
          --text-color: #1e293b;
          --text-light: #64748b;
          --border-color: #e2e8f0;
          --bg-light: #f8fafc;
          --code-bg: #f1f5f9;
          --link-color: #2563eb;
          --link-hover: #1d4ed8;
          --success-color: #10b981;
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-color);
        }

        * {
          box-sizing: border-box;
        }

        .blog-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        /* Header Section */
        .blog-header {
          margin-bottom: 40px;
        }

        .blog-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          font-size: 14px;
          color: var(--text-light);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .meta-divider {
          color: var(--border-color);
        }

        .category-badge {
          background-color: var(--primary-color);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .blog-title {
          font-size: 2.5em;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 20px 0;
          color: var(--text-color);
          letter-spacing: -0.02em;
        }

        .featured-image-container {
          width: 100%;
          margin: 30px 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .featured-image {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        /* Table of Contents */
        .toc-container {
          background-color: var(--bg-light);
          border-left: 4px solid var(--primary-color);
          padding: 25px 30px;
          margin: 40px 0;
          border-radius: 8px;
        }

        .toc-title {
          font-size: 1.2em;
          font-weight: 700;
          margin: 0 0 15px 0;
          color: var(--text-color);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .toc-list li {
          margin-bottom: 8px;
        }

        .toc-list a {
          color: var(--text-light);
          text-decoration: none;
          transition: all 0.2s;
          display: inline-block;
          font-size: 0.95em;
        }

        .toc-list a:hover {
          color: var(--primary-color);
          transform: translateX(5px);
        }

        .toc-level-2 {
          padding-left: 20px;
        }

        .toc-level-3 {
          padding-left: 40px;
          font-size: 0.9em;
        }

        /* Blog Content Styles */
        .blog-content {
          font-size: 1.1em;
          line-height: 1.8;
        }

        .blog-content > *:first-child {
          margin-top: 0;
        }

        .blog-content > *:last-child {
          margin-bottom: 0;
        }

        /* Headings */
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          font-weight: 700;
          line-height: 1.3;
          margin-top: 2em;
          margin-bottom: 0.8em;
          color: var(--text-color);
          scroll-margin-top: 20px;
        }

        .blog-content h1 {
          font-size: 2.2em;
          border-bottom: 3px solid var(--border-color);
          padding-bottom: 0.3em;
        }

        .blog-content h2 {
          font-size: 1.8em;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 0.3em;
        }

        .blog-content h3 {
          font-size: 1.5em;
        }

        .blog-content h4 {
          font-size: 1.3em;
        }

        .blog-content h5 {
          font-size: 1.15em;
        }

        .blog-content h6 {
          font-size: 1em;
          color: var(--text-light);
        }

        /* Paragraphs */
        .blog-content p {
          margin: 1.2em 0;
        }

        /* Links */
        .blog-content a {
          color: var(--link-color);
          text-decoration: underline;
          transition: color 0.2s;
        }

        .blog-content a:hover {
          color: var(--link-hover);
        }

        /* Lists */
        .blog-content ul,
        .blog-content ol {
          margin: 1.2em 0;
          padding-left: 2em;
        }

        .blog-content li {
          margin: 0.5em 0;
        }

        .blog-content ul ul,
        .blog-content ol ol,
        .blog-content ul ol,
        .blog-content ol ul {
          margin: 0.5em 0;
        }

        /* Blockquotes */
        .blog-content blockquote {
          border-left: 4px solid var(--primary-color);
          padding: 15px 25px;
          margin: 1.5em 0;
          background-color: var(--bg-light);
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: var(--text-light);
        }

        .blog-content blockquote p {
          margin: 0.5em 0;
        }

        .blog-content blockquote p:first-child {
          margin-top: 0;
        }

        .blog-content blockquote p:last-child {
          margin-bottom: 0;
        }

        /* Code */
        .blog-content code {
          background-color: var(--code-bg);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #e11d48;
        }

        .blog-content pre {
          background-color: var(--code-bg);
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5em 0;
          border: 1px solid var(--border-color);
        }

        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          color: var(--text-color);
          font-size: 0.9em;
        }

        /* Images */
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5em 0;
          display: block;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Tables */
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .blog-content th,
        .blog-content td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .blog-content th {
          background-color: var(--bg-light);
          font-weight: 700;
          color: var(--text-color);
          border-bottom: 2px solid var(--border-color);
        }

        .blog-content tr:last-child td {
          border-bottom: none;
        }

        .blog-content tbody tr:hover {
          background-color: var(--bg-light);
        }

        /* Horizontal Rule */
        .blog-content hr {
          border: none;
          border-top: 2px solid var(--border-color);
          margin: 2em 0;
        }

        /* Strong and Emphasis */
        .blog-content strong {
          font-weight: 700;
          color: var(--text-color);
        }

        .blog-content em {
          font-style: italic;
        }

        /* Tags Section */
        .tags-container {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid var(--border-color);
        }

        .tags-label {
          font-size: 0.9em;
          font-weight: 600;
          color: var(--text-light);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tag {
          background-color: var(--bg-light);
          color: var(--text-light);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85em;
          font-weight: 500;
          border: 1px solid var(--border-color);
          transition: all 0.2s;
        }

        .tag:hover {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
          transform: translateY(-2px);
        }

        /* Share Section */
        .share-container {
          margin-top: 40px;
          padding: 25px;
          background-color: var(--bg-light);
          border-radius: 12px;
          text-align: center;
        }

        .share-label {
          font-size: 1.1em;
          font-weight: 600;
          color: var(--text-color);
          margin-bottom: 15px;
        }

        .share-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .share-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.9em;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }

        .share-twitter {
          background-color: #1DA1F2;
          color: white;
        }

        .share-facebook {
          background-color: #1877F2;
          color: white;
        }

        .share-linkedin {
          background-color: #0A66C2;
          color: white;
        }

        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Loading State */
        .loading {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-light);
        }

        .loading-spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top: 4px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .blog-container {
            padding: 15px;
          }

          .blog-title {
            font-size: 1.8em;
          }

          .blog-content {
            font-size: 1em;
          }

          .blog-content h1 {
            font-size: 1.8em;
          }

          .blog-content h2 {
            font-size: 1.5em;
          }

          .blog-content h3 {
            font-size: 1.3em;
          }

          .toc-container {
            padding: 20px;
          }

          .blog-meta {
            font-size: 13px;
          }

          .share-buttons {
            flex-direction: column;
          }

          .share-btn {
            width: 100%;
          }
        }
      </style>

      <div class="blog-container">
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>Loading blog post...</p>
        </div>
      </div>
    `;
  }

  // Render the blog post
  render() {
    const container = this.shadowRoot.querySelector('.blog-container');

    if (!this.state.content) {
      return;
    }

    // Parse markdown and generate TOC
    const { html, toc } = this.parseMarkdownWithTOC(this.state.content);

    // Format date
    const formattedDate = this.formatDate(this.state.publishDate);

    // Build the blog post HTML
    container.innerHTML = `
      <article class="blog-article">
        ${this.state.category ? `
          <div class="blog-meta">
            <span class="category-badge">${this.escapeHtml(this.state.category)}</span>
            ${this.state.publishDate ? `<span class="meta-divider">•</span><span class="meta-item">📅 ${formattedDate}</span>` : ''}
            ${this.state.author ? `<span class="meta-divider">•</span><span class="meta-item">✍️ ${this.escapeHtml(this.state.author)}</span>` : ''}
            ${this.state.readingTime > 0 ? `<span class="meta-divider">•</span><span class="meta-item">⏱️ ${this.state.readingTime} min read</span>` : ''}
          </div>
        ` : ''}

        <header class="blog-header">
          <h1 class="blog-title">${this.escapeHtml(this.state.title)}</h1>
        </header>

        ${this.state.featuredImage ? `
          <div class="featured-image-container">
            <img src="${this.state.featuredImage}" alt="${this.escapeHtml(this.state.title)}" class="featured-image">
          </div>
        ` : ''}

        <div class="blog-content">
          ${html}
        </div>

        ${this.state.tags.length > 0 ? `
          <div class="tags-container">
            <div class="tags-label">Tags</div>
            <div class="tags-list">
              ${this.state.tags.map(tag => `<span class="tag">#${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="share-container">
          <div class="share-label">Share this article</div>
          <div class="share-buttons">
            <button class="share-btn share-twitter" data-platform="twitter">
              🐦 Share on Twitter
            </button>
            <button class="share-btn share-facebook" data-platform="facebook">
              📘 Share on Facebook
            </button>
            <button class="share-btn share-linkedin" data-platform="linkedin">
              💼 Share on LinkedIn
            </button>
          </div>
        </div>
      </article>
    `;

    // Setup share buttons
    this.setupShareButtons();

    // Add smooth scroll to TOC links
    this.setupTOCLinks();
  }

  // Parse markdown with automatic TOC generation
  parseMarkdownWithTOC(markdown) {
    const headings = [];
    let hasFoundFirstHeading = false;
    let introContent = '';
    let mainContent = markdown;

    // Split content into intro and main (before and after first heading)
    const lines = markdown.split('\n');
    let firstHeadingIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^#{1,6}\s/)) {
        firstHeadingIndex = i;
        break;
      }
    }

    if (firstHeadingIndex > 0) {
      introContent = lines.slice(0, firstHeadingIndex).join('\n');
      mainContent = lines.slice(firstHeadingIndex).join('\n');
    }

    // Parse markdown to extract headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    let contentWithIds = mainContent;

    while ((match = headingRegex.exec(mainContent)) !== null) {
      const level = match[1].length;
      const text = match[0].replace(/^#{1,6}\s+/, '');
      const id = this.generateSlug(text);

      headings.push({
        level: level,
        text: text,
        id: id
      });

      // Replace heading with version that has ID
      const originalHeading = match[0];
      const newHeading = `<h${level} id="${id}">${this.escapeHtml(text)}</h${level}>`;
      contentWithIds = contentWithIds.replace(originalHeading, `__HEADING_${id}__`);
    }

    // Generate TOC HTML
    let tocHtml = '';
    if (headings.length > 0) {
      tocHtml = `
        <div class="toc-container">
          <div class="toc-title">📋 Table of Contents</div>
          <ul class="toc-list">
            ${headings.map(h => `
              <li class="toc-level-${h.level}">
                <a href="#${h.id}">${this.escapeHtml(h.text)}</a>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Convert markdown to HTML
    let html = this.parseMarkdown(introContent);

    if (tocHtml) {
      html += tocHtml;
    }

    // Replace heading placeholders with actual HTML
    let mainHtml = this.parseMarkdown(contentWithIds);
    headings.forEach(h => {
      mainHtml = mainHtml.replace(
        `__HEADING_${h.id}__`,
        `<h${h.level} id="${h.id}">${this.escapeHtml(h.text)}</h${h.level}>`
      );
    });

    html += mainHtml;

    return {
      html: html,
      toc: headings
    };
  }

  // Simple markdown parser
  parseMarkdown(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Code blocks (must be before inline code)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1">');

    // Headings (if not already processed)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

    // Horizontal rules
    html = html.replace(/^(---|\*\*\*|___)$/gm, '<hr>');

    // Unordered lists
    html = html.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Tables (basic support)
    const tableRegex = /\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (match, header, rows) => {
      const headerCells = header.split('|').filter(cell => cell.trim()).map(cell => `<th>${cell.trim()}</th>`).join('');
      const rowsHtml = rows.trim().split('\n').map(row => {
        const cells = row.split('|').filter(cell => cell.trim()).map(cell => `<td>${cell.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    });

    // Line breaks and paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/^(?!<[huo])/gm, '<p>');
    html = html.replace(/(?<!>)$/gm, '</p>');

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');

    // Fix paragraph tags around block elements
    html = html.replace(/<p>(<(?:h[1-6]|ul|ol|blockquote|pre|table|hr))/gi, '$1');
    html = html.replace(/(<\/(?:h[1-6]|ul|ol|blockquote|pre|table|hr)>)<\/p>/gi, '$1');

    return html;
  }

  // Generate URL-friendly slug from text
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Format date
  formatDate(dateString) {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Setup share buttons
  setupShareButtons() {
    const shareButtons = this.shadowRoot.querySelectorAll('.share-btn');

    shareButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = e.target.getAttribute('data-platform');
        this.shareArticle(platform);
      });
    });
  }

  // Share article on social media
  shareArticle(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.state.title);

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  // Setup smooth scroll for TOC links
  setupTOCLinks() {
    const tocLinks = this.shadowRoot.querySelectorAll('.toc-list a');

    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = this.shadowRoot.getElementById(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Update URL hash without jumping
          history.pushState(null, null, `#${targetId}`);
        }
      });
    });
  }

  // Connected callback
  connectedCallback() {
    // Check if URL has hash and scroll to it
    if (window.location.hash) {
      setTimeout(() => {
        const targetId = window.location.hash.substring(1);
        const targetElement = this.shadowRoot.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 500);
    }
  }
}

// Register the custom element
customElements.define('blog-post-renderer', BlogPostRenderer);

// Wix Custom Element Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlogPostRenderer;
}

// Global registration for Wix environment
if (typeof window !== 'undefined' && window.customElements) {
  window.BlogPostRenderer = BlogPostRenderer;
}
