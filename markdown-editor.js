class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State management
    this.state = {
      markdownContent: '',
      currentPostId: null,
      isDirty: false,
      lastSaved: null,
      activeTab: 'write', // 'write' or 'preview'
      isFullscreen: false
    };

    this.initializeUI();
    this.setupEventListeners();
  }

  // Observed attributes for CMS integration
  static get observedAttributes() {
    return ['post-id', 'initial-content'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    if (name === 'post-id') {
      this.state.currentPostId = newValue;
    } else if (name === 'initial-content') {
      this.state.markdownContent = newValue;
      if (this.textarea) {
        this.textarea.value = newValue;
        this.updatePreview();
      }
    }
  }

  // Initialize the UI with beautiful editor design
  initializeUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          --primary-color: #3498db;
          --success-color: #2ecc71;
          --warning-color: #f39c12;
          --danger-color: #e74c3c;
          --dark-color: #2c3e50;
          --light-color: #ecf0f1;
          --border-color: #dcdde1;
          --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        * {
          box-sizing: border-box;
        }

        .editor-container {
          background: #ffffff;
          border-radius: 8px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .editor-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          border-radius: 0;
          max-width: 100vw;
          max-height: 100vh;
        }

        /* Toolbar */
        .toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f8f9fa;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .toolbar-group {
          display: flex;
          gap: 4px;
          padding: 0 8px;
          border-right: 1px solid var(--border-color);
        }

        .toolbar-group:last-child {
          border-right: none;
          margin-left: auto;
        }

        .toolbar-btn {
          padding: 8px 12px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--dark-color);
        }

        .toolbar-btn:hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
          transform: translateY(-1px);
        }

        .toolbar-btn:active {
          transform: translateY(0);
        }

        .toolbar-btn.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .toolbar-btn .icon {
          font-size: 16px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          background: #f8f9fa;
          border-bottom: 1px solid var(--border-color);
        }

        .tab {
          padding: 12px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          background: rgba(52, 152, 219, 0.1);
          color: var(--primary-color);
        }

        .tab.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }

        /* Editor Area */
        .editor-area {
          display: grid;
          grid-template-columns: 1fr;
          height: 600px;
        }

        .editor-container.fullscreen .editor-area {
          height: calc(100vh - 120px);
        }

        .editor-pane,
        .preview-pane {
          overflow-y: auto;
          padding: 20px;
        }

        .editor-pane {
          background: #ffffff;
        }

        .preview-pane {
          background: #fafafa;
          border-left: 1px solid var(--border-color);
        }

        .editor-pane.hidden,
        .preview-pane.hidden {
          display: none;
        }

        /* Textarea */
        #markdown-textarea {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          resize: none;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
          color: var(--dark-color);
          background: transparent;
        }

        /* Preview Styles - Match blog viewer */
        .preview-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .preview-content h1,
        .preview-content h2,
        .preview-content h3,
        .preview-content h4,
        .preview-content h5,
        .preview-content h6 {
          font-weight: 700;
          line-height: 1.3;
          margin-top: 24px;
          margin-bottom: 16px;
          color: #1a1a1a;
        }

        .preview-content h1 { font-size: 36px; }
        .preview-content h2 { font-size: 30px; }
        .preview-content h3 { font-size: 24px; }
        .preview-content h4 { font-size: 20px; }
        .preview-content h5 { font-size: 18px; }
        .preview-content h6 { font-size: 16px; }

        .preview-content p {
          margin-bottom: 16px;
          font-size: 16px;
          line-height: 1.6;
          color: #333;
        }

        .preview-content a {
          color: var(--primary-color);
          text-decoration: none;
          border-bottom: 1px solid var(--primary-color);
        }

        .preview-content strong { font-weight: 700; }
        .preview-content em { font-style: italic; }

        .preview-content ul,
        .preview-content ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }

        .preview-content li {
          margin-bottom: 8px;
          line-height: 1.6;
        }

        .preview-content blockquote {
          margin: 20px 0;
          padding: 16px 20px;
          border-left: 4px solid var(--primary-color);
          background-color: #f8f9fa;
          font-style: italic;
          color: #555;
        }

        .preview-content code {
          background-color: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #e74c3c;
        }

        .preview-content pre {
          background-color: #2d2d2d;
          color: #f8f8f2;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 20px 0;
        }

        .preview-content pre code {
          background-color: transparent;
          padding: 0;
          color: #f8f8f2;
        }

        .preview-content img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 20px 0;
        }

        .preview-content hr {
          border: none;
          border-top: 2px solid #e0e0e0;
          margin: 24px 0;
        }

        .preview-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .preview-content table th,
        .preview-content table td {
          padding: 12px;
          text-align: left;
          border: 1px solid var(--border-color);
        }

        .preview-content table th {
          background-color: #f8f9fa;
          font-weight: 700;
        }

        /* Status Bar */
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #f8f9fa;
          border-top: 1px solid var(--border-color);
          font-size: 12px;
          color: #666;
        }

        .status-info {
          display: flex;
          gap: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success-color);
        }

        .status-dot.unsaved {
          background: var(--warning-color);
        }

        /* Save Button */
        .save-btn {
          padding: 8px 20px;
          background: var(--success-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .save-btn:hover {
          background: #27ae60;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(46, 204, 113, 0.3);
        }

        .save-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
        }

        .save-btn.saving {
          background: var(--warning-color);
        }

        /* Modal for Insert Link/Image */
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          align-items: center;
          justify-content: center;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 90%;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 16px;
          color: var(--dark-color);
        }

        .modal-input {
          width: 100%;
          padding: 10px;
          margin-bottom: 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 14px;
        }

        .modal-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .modal-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .modal-btn.primary {
          background: var(--primary-color);
          color: white;
        }

        .modal-btn.primary:hover {
          background: #2980b9;
        }

        .modal-btn.secondary {
          background: #e0e0e0;
          color: var(--dark-color);
        }

        .modal-btn.secondary:hover {
          background: #d0d0d0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .toolbar {
            padding: 8px;
          }

          .toolbar-btn {
            padding: 6px 10px;
            font-size: 12px;
          }

          .toolbar-group {
            padding: 0 4px;
          }

          .tab {
            padding: 10px 16px;
            font-size: 13px;
          }

          .editor-area {
            height: 400px;
          }

          .modal-content {
            width: 95%;
            padding: 20px;
          }
        }

        /* Loading Spinner */
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Help Text */
        .help-text {
          font-size: 12px;
          color: #666;
          font-style: italic;
          margin-top: 4px;
        }
      </style>

      <div class="editor-container">
        <!-- Toolbar -->
        <div class="toolbar">
          <!-- Text Formatting -->
          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="bold" title="Bold (Ctrl+B)">
              <span class="icon">𝐁</span>
            </button>
            <button class="toolbar-btn" data-action="italic" title="Italic (Ctrl+I)">
              <span class="icon">𝐼</span>
            </button>
            <button class="toolbar-btn" data-action="strikethrough" title="Strikethrough">
              <span class="icon">S̶</span>
            </button>
          </div>

          <!-- Headings -->
          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="h1" title="Heading 1">
              <span class="icon">H1</span>
            </button>
            <button class="toolbar-btn" data-action="h2" title="Heading 2">
              <span class="icon">H2</span>
            </button>
            <button class="toolbar-btn" data-action="h3" title="Heading 3">
              <span class="icon">H3</span>
            </button>
          </div>

          <!-- Lists -->
          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="ul" title="Bullet List">
              <span class="icon">≡</span>
            </button>
            <button class="toolbar-btn" data-action="ol" title="Numbered List">
              <span class="icon">⋮</span>
            </button>
            <button class="toolbar-btn" data-action="quote" title="Blockquote">
              <span class="icon">"</span>
            </button>
          </div>

          <!-- Insert -->
          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="link" title="Insert Link (Ctrl+K)">
              <span class="icon">🔗</span>
            </button>
            <button class="toolbar-btn" data-action="image" title="Insert Image">
              <span class="icon">🖼️</span>
            </button>
            <button class="toolbar-btn" data-action="code" title="Inline Code">
              <span class="icon">&lt;/&gt;</span>
            </button>
            <button class="toolbar-btn" data-action="codeblock" title="Code Block">
              <span class="icon">{ }</span>
            </button>
          </div>

          <!-- Other -->
          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="hr" title="Horizontal Rule">
              <span class="icon">—</span>
            </button>
            <button class="toolbar-btn" data-action="table" title="Insert Table">
              <span class="icon">⊞</span>
            </button>
          </div>

          <!-- View Controls -->
          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="fullscreen" title="Toggle Fullscreen">
              <span class="icon">⛶</span>
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab active" data-tab="write">✏️ Write</button>
          <button class="tab" data-tab="preview">👁️ Preview</button>
        </div>

        <!-- Editor Area -->
        <div class="editor-area">
          <div class="editor-pane">
            <textarea id="markdown-textarea" placeholder="Write your Markdown content here..."></textarea>
          </div>
          <div class="preview-pane hidden">
            <div class="preview-content" id="preview-content">
              <p style="color: #999; font-style: italic;">Preview will appear here...</p>
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="status-bar">
          <div class="status-info">
            <div class="status-indicator">
              <span class="status-dot" id="status-dot"></span>
              <span id="status-text">Saved</span>
            </div>
            <div class="status-indicator">
              <span id="word-count">0 words</span>
            </div>
            <div class="status-indicator">
              <span id="char-count">0 characters</span>
            </div>
          </div>
          <button class="save-btn" id="save-btn">
            <span>💾</span>
            <span id="save-text">Save</span>
          </button>
        </div>
      </div>

      <!-- Link Modal -->
      <div class="modal" id="link-modal">
        <div class="modal-content">
          <h3 class="modal-title">Insert Link</h3>
          <input type="text" class="modal-input" id="link-text" placeholder="Link text">
          <input type="url" class="modal-input" id="link-url" placeholder="https://example.com">
          <p class="help-text">Enter the text to display and the URL to link to</p>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="link-cancel">Cancel</button>
            <button class="modal-btn primary" id="link-insert">Insert</button>
          </div>
        </div>
      </div>

      <!-- Image Modal -->
      <div class="modal" id="image-modal">
        <div class="modal-content">
          <h3 class="modal-title">Insert Image</h3>
          <input type="text" class="modal-input" id="image-url" placeholder="https://example.com/image.jpg">
          <input type="text" class="modal-input" id="image-alt" placeholder="Image description (alt text)">
          <p class="help-text">Enter the image URL and a description for accessibility</p>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="image-cancel">Cancel</button>
            <button class="modal-btn primary" id="image-insert">Insert</button>
          </div>
        </div>
      </div>
    `;
  }

  // Setup event listeners
  setupEventListeners() {
    // Get DOM references
    this.textarea = this.shadowRoot.getElementById('markdown-textarea');
    this.previewContent = this.shadowRoot.getElementById('preview-content');
    this.saveBtn = this.shadowRoot.getElementById('save-btn');
    this.saveText = this.shadowRoot.getElementById('save-text');
    this.statusDot = this.shadowRoot.getElementById('status-dot');
    this.statusText = this.shadowRoot.getElementById('status-text');
    this.wordCount = this.shadowRoot.getElementById('word-count');
    this.charCount = this.shadowRoot.getElementById('char-count');
    this.editorContainer = this.shadowRoot.querySelector('.editor-container');
    this.editorPane = this.shadowRoot.querySelector('.editor-pane');
    this.previewPane = this.shadowRoot.querySelector('.preview-pane');

    // Toolbar buttons
    this.shadowRoot.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.handleToolbarAction(action);
      });
    });

    // Tab switching
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Textarea events
    this.textarea.addEventListener('input', () => {
      this.state.markdownContent = this.textarea.value;
      this.state.isDirty = true;
      this.updateStatus();
      this.updateCounts();
      if (this.state.activeTab === 'preview') {
        this.updatePreview();
      }
    });

    // Keyboard shortcuts
    this.textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') {
          e.preventDefault();
          this.handleToolbarAction('bold');
        } else if (e.key === 'i') {
          e.preventDefault();
          this.handleToolbarAction('italic');
        } else if (e.key === 'k') {
          e.preventDefault();
          this.handleToolbarAction('link');
        } else if (e.key === 's') {
          e.preventDefault();
          this.saveContent();
        }
      }
    });

    // Save button
    this.saveBtn.addEventListener('click', () => {
      this.saveContent();
    });

    // Link modal
    this.setupLinkModal();
    
    // Image modal
    this.setupImageModal();

    // Load marked.js
    this.loadMarkedJS();
  }

  // Setup link modal
  setupLinkModal() {
    const modal = this.shadowRoot.getElementById('link-modal');
    const linkText = this.shadowRoot.getElementById('link-text');
    const linkUrl = this.shadowRoot.getElementById('link-url');
    const cancelBtn = this.shadowRoot.getElementById('link-cancel');
    const insertBtn = this.shadowRoot.getElementById('link-insert');

    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      linkText.value = '';
      linkUrl.value = '';
    });

    insertBtn.addEventListener('click', () => {
      const text = linkText.value || 'link text';
      const url = linkUrl.value || 'https://';
      this.insertText(`[${text}](${url})`);
      modal.classList.remove('active');
      linkText.value = '';
      linkUrl.value = '';
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  // Setup image modal
  setupImageModal() {
    const modal = this.shadowRoot.getElementById('image-modal');
    const imageUrl = this.shadowRoot.getElementById('image-url');
    const imageAlt = this.shadowRoot.getElementById('image-alt');
    const cancelBtn = this.shadowRoot.getElementById('image-cancel');
    const insertBtn = this.shadowRoot.getElementById('image-insert');

    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      imageUrl.value = '';
      imageAlt.value = '';
    });

    insertBtn.addEventListener('click', () => {
      const url = imageUrl.value || 'https://';
      const alt = imageAlt.value || 'image';
      this.insertText(`![${alt}](${url})`);
      modal.classList.remove('active');
      imageUrl.value = '';
      imageAlt.value = '';
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  // Handle toolbar actions
  handleToolbarAction(action) {
    const selection = this.getSelection();

    switch (action) {
      case 'bold':
        this.wrapText('**', '**', 'bold text');
        break;
      case 'italic':
        this.wrapText('*', '*', 'italic text');
        break;
      case 'strikethrough':
        this.wrapText('~~', '~~', 'strikethrough text');
        break;
      case 'h1':
        this.insertAtLineStart('# ', 'Heading 1');
        break;
      case 'h2':
        this.insertAtLineStart('## ', 'Heading 2');
        break;
      case 'h3':
        this.insertAtLineStart('### ', 'Heading 3');
        break;
      case 'ul':
        this.insertAtLineStart('- ', 'List item');
        break;
      case 'ol':
        this.insertAtLineStart('1. ', 'List item');
        break;
      case 'quote':
        this.insertAtLineStart('> ', 'Quote text');
        break;
      case 'link':
        this.shadowRoot.getElementById('link-modal').classList.add('active');
        this.shadowRoot.getElementById('link-text').focus();
        break;
      case 'image':
        this.shadowRoot.getElementById('image-modal').classList.add('active');
        this.shadowRoot.getElementById('image-url').focus();
        break;
      case 'code':
        this.wrapText('`', '`', 'code');
        break;
      case 'codeblock':
        this.insertText('\n```\ncode block\n```\n');
        break;
      case 'hr':
        this.insertText('\n---\n');
        break;
      case 'table':
        this.insertText('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n');
        break;
      case 'fullscreen':
        this.toggleFullscreen();
        break;
    }

    this.textarea.focus();
  }

  // Get current selection
  getSelection() {
    return {
      start: this.textarea.selectionStart,
      end: this.textarea.selectionEnd,
      text: this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd)
    };
  }

  // Wrap selected text
  wrapText(before, after, placeholder) {
    const selection = this.getSelection();
    const text = selection.text || placeholder;
    const newText = before + text + after;
    
    this.replaceSelection(newText);
    
    // Select the inserted text
    const start = selection.start + before.length;
    const end = start + text.length;
    this.textarea.setSelectionRange(start, end);
  }

  // Insert at line start
  insertAtLineStart(prefix, placeholder) {
    const selection = this.getSelection();
    const beforeCursor = this.textarea.value.substring(0, selection.start);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    
    const text = selection.text || placeholder;
    const newText = prefix + text;
    
    this.textarea.setSelectionRange(lineStart, selection.end);
    this.replaceSelection(newText);
  }

  // Insert text at cursor
  insertText(text) {
    this.replaceSelection(text);
  }

  // Replace current selection
  replaceSelection(text) {
    const selection = this.getSelection();
    const before = this.textarea.value.substring(0, selection.start);
    const after = this.textarea.value.substring(selection.end);
    
    this.textarea.value = before + text + after;
    this.state.markdownContent = this.textarea.value;
    this.state.isDirty = true;
    
    // Update cursor position
    const newPosition = selection.start + text.length;
    this.textarea.setSelectionRange(newPosition, newPosition);
    
    this.updateStatus();
    this.updateCounts();
    
    // Trigger input event
    this.textarea.dispatchEvent(new Event('input'));
  }

  // Switch tabs
  switchTab(tabName) {
    this.state.activeTab = tabName;
    
    // Update tab buttons
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Toggle panes
    if (tabName === 'write') {
      this.editorPane.classList.remove('hidden');
      this.previewPane.classList.add('hidden');
    } else {
      this.editorPane.classList.add('hidden');
      this.previewPane.classList.remove('hidden');
      this.updatePreview();
    }
  }

  // Update preview
  updatePreview() {
    if (typeof marked !== 'undefined') {
      this.previewContent.innerHTML = marked.parse(this.state.markdownContent);
    } else {
      this.previewContent.innerHTML = '<p style="color: #999;">Loading preview...</p>';
      this.loadMarkedJS().then(() => {
        this.previewContent.innerHTML = marked.parse(this.state.markdownContent);
      });
    }
  }

  // Load marked.js
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

  // Update status
  updateStatus() {
    if (this.state.isDirty) {
      this.statusDot.classList.add('unsaved');
      this.statusText.textContent = 'Unsaved changes';
    } else {
      this.statusDot.classList.remove('unsaved');
      if (this.state.lastSaved) {
        const timeAgo = this.getTimeAgo(this.state.lastSaved);
        this.statusText.textContent = `Saved ${timeAgo}`;
      } else {
        this.statusText.textContent = 'Saved';
      }
    }
  }

  // Update word and character counts
  updateCounts() {
    const text = this.state.markdownContent;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    
    this.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    this.charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
  }

  // Toggle fullscreen
  toggleFullscreen() {
    this.state.isFullscreen = !this.state.isFullscreen;
    if (this.state.isFullscreen) {
      this.editorContainer.classList.add('fullscreen');
    } else {
      this.editorContainer.classList.remove('fullscreen');
    }
  }

  // Save content
  saveContent() {
    // Dispatch custom event that Wix code will listen for
    const event = new CustomEvent('markdown-save', {
      detail: {
        postId: this.state.currentPostId,
        content: this.state.markdownContent
      },
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(event);

    // Update UI
    this.saveBtn.classList.add('saving');
    this.saveBtn.disabled = true;
    this.saveText.innerHTML = '<span class="spinner"></span> Saving...';
  }

  // Called from Wix code after successful save
  onSaveSuccess() {
    this.state.isDirty = false;
    this.state.lastSaved = new Date();
    
    this.saveBtn.classList.remove('saving');
    this.saveBtn.disabled = false;
    this.saveText.textContent = '✓ Saved';
    
    this.updateStatus();

    // Reset button text after 2 seconds
    setTimeout(() => {
      this.saveText.textContent = 'Save';
    }, 2000);
  }

  // Called from Wix code on save error
  onSaveError(error) {
    this.saveBtn.classList.remove('saving');
    this.saveBtn.disabled = false;
    this.saveText.textContent = '✗ Error';
    
    console.error('Save error:', error);

    // Reset button text after 3 seconds
    setTimeout(() => {
      this.saveText.textContent = 'Save';
    }, 3000);
  }

  // Get time ago string
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Get markdown content (called from Wix code)
  getContent() {
    return this.state.markdownContent;
  }

  // Set content (called from Wix code)
  setContent(content) {
    this.state.markdownContent = content || '';
    this.textarea.value = this.state.markdownContent;
    this.state.isDirty = false;
    this.updateStatus();
    this.updateCounts();
    this.updatePreview();
  }

  // Connected callback
  connectedCallback() {
    this.loadMarkedJS();
    this.updateCounts();
  }
}

// Register the custom element
customElements.define('markdown-editor', MarkdownEditor);

// Export for Wix
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownEditor;
}

if (typeof window !== 'undefined' && window.customElements) {
  window.MarkdownEditor = MarkdownEditor;
}
