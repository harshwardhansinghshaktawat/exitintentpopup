/**
 * Advanced Markdown Editor Custom Element
 * File: markdown-editor.js
 * Tag: <markdown-editor>
 */

class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.autoSaveInterval = null;
    this.editorContent = '';
    this.markdownOutput = '';
  }

  connectedCallback() {
    this.render();
    this.initializeEditor();
    this.loadFromLocalStorage();
    this.startAutoSave();
    this.attachEventListeners();
  }

  disconnectedCallback() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          display: block;
          width: 100%;
          height: 800px;
          max-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          overflow: hidden;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .header h1 {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .auto-save-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          opacity: 0.9;
        }

        .save-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .tabs {
          display: flex;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          flex-shrink: 0;
        }

        .tab {
          flex: 1;
          padding: 15px 30px;
          background: transparent;
          border: none;
          font-size: 16px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .tab:hover {
          color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .tab.active {
          color: #667eea;
          background: white;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #667eea;
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
        }

        .tab-content {
          display: none;
          flex: 1;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
        }

        .tab-content.active {
          display: flex;
        }

        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          overflow-x: auto;
          overflow-y: hidden;
          flex-shrink: 0;
          max-height: 120px;
        }

        .toolbar-group {
          display: flex;
          gap: 4px;
          padding-right: 12px;
          border-right: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .toolbar-btn {
          padding: 8px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .toolbar-btn:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
          transform: translateY(-1px);
        }

        .toolbar-btn:active {
          transform: translateY(0);
        }

        .editor-area {
          flex: 1;
          padding: 20px 30px;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
        }

        #richEditor {
          width: 100%;
          min-height: 100%;
          height: auto;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          font-size: 16px;
          line-height: 1.7;
          outline: none;
          transition: border-color 0.3s ease;
          background: white;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        #richEditor:focus {
          border-color: #667eea;
        }

        #markdownOutput {
          width: 100%;
          height: 100%;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          outline: none;
          background: #1e293b;
          color: #e2e8f0;
          transition: border-color 0.3s ease;
          overflow-y: auto;
        }

        #markdownOutput:focus {
          border-color: #667eea;
        }

        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .output-header h3 {
          font-size: 16px;
          color: #475569;
          font-weight: 600;
        }

        .copy-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .copy-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .copy-btn:active {
          transform: translateY(0);
        }

        .copy-btn.copied {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          align-items: center;
          justify-content: center;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin-bottom: 20px;
          color: #1e293b;
          font-size: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #475569;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 15px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s ease;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #667eea;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .modal-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .modal-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .modal-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .modal-btn.secondary {
          background: #e2e8f0;
          color: #475569;
        }

        .modal-btn.secondary:hover {
          background: #cbd5e1;
        }

        @media (max-width: 768px) {
          :host {
            padding: 10px;
            height: 600px;
          }

          .header {
            padding: 15px 20px;
          }

          .header h1 {
            font-size: 18px;
          }

          .auto-save-indicator {
            font-size: 12px;
          }

          .tab {
            padding: 12px 15px;
            font-size: 14px;
          }

          .toolbar {
            padding: 10px;
            gap: 6px;
          }

          .toolbar-btn {
            padding: 6px 10px;
            font-size: 12px;
          }

          .editor-area {
            padding: 15px;
          }

          #richEditor {
            padding: 15px;
            font-size: 14px;
          }
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Prevent content from expanding container */
        #richEditor * {
          max-width: 100%;
        }

        #richEditor img {
          max-width: 100%;
          height: auto;
        }

        #richEditor table {
          max-width: 100%;
          overflow-x: auto;
          display: block;
        }
      </style>

      <div class="container">
        <div class="header">
          <h1>Advanced Markdown Editor</h1>
          <div class="auto-save-indicator">
            <div class="save-dot"></div>
            <span>Auto-save active</span>
          </div>
        </div>

        <div class="tabs">
          <button class="tab active" data-tab="input">Input Editor</button>
          <button class="tab" data-tab="output">Markdown Output</button>
        </div>

        <div class="content">
          <div class="tab-content active" data-content="input">
            <div class="toolbar">
              <div class="toolbar-group">
                <button class="toolbar-btn" data-action="h1">H1</button>
                <button class="toolbar-btn" data-action="h2">H2</button>
                <button class="toolbar-btn" data-action="h3">H3</button>
                <button class="toolbar-btn" data-action="h4">H4</button>
                <button class="toolbar-btn" data-action="h5">H5</button>
                <button class="toolbar-btn" data-action="h6">H6</button>
              </div>
              <div class="toolbar-group">
                <button class="toolbar-btn" data-action="bold">Bold</button>
                <button class="toolbar-btn" data-action="italic">Italic</button>
                <button class="toolbar-btn" data-action="strikethrough">Strike</button>
                <button class="toolbar-btn" data-action="underline">Underline</button>
                <button class="toolbar-btn" data-action="code">Code</button>
              </div>
              <div class="toolbar-group">
                <button class="toolbar-btn" data-action="superscript">Super</button>
                <button class="toolbar-btn" data-action="subscript">Sub</button>
                <button class="toolbar-btn" data-action="highlight">Highlight</button>
              </div>
              <div class="toolbar-group">
                <button class="toolbar-btn" data-action="ul">Bullet List</button>
                <button class="toolbar-btn" data-action="ol">Number List</button>
                <button class="toolbar-btn" data-action="tasklist">Task List</button>
              </div>
              <div class="toolbar-group">
                <button class="toolbar-btn" data-action="link">Link</button>
                <button class="toolbar-btn" data-action="image">Image</button>
                <button class="toolbar-btn" data-action="video">Video</button>
              </div>
              <div class="toolbar-group">
                <button class="toolbar-btn" data-action="blockquote">Quote</button>
                <button class="toolbar-btn" data-action="hr">Divider</button>
                <button class="toolbar-btn" data-action="codeblock">Code Block</button>
              </div>
              <div class="toolbar-group">
                <button class="toolbar-btn" data-action="table">Table</button>
                <button class="toolbar-btn" data-action="emoji">Emoji</button>
                <button class="toolbar-btn" data-action="math">Math</button>
              </div>
            </div>
            <div class="editor-area">
              <div id="richEditor" contenteditable="true"></div>
            </div>
          </div>

          <div class="tab-content" data-content="output">
            <div class="output-header">
              <h3>Markdown Code</h3>
              <button class="copy-btn" id="copyBtn">Copy Markdown</button>
            </div>
            <div class="editor-area">
              <textarea id="markdownOutput" readonly></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Link Modal -->
      <div class="modal" id="linkModal">
        <div class="modal-content">
          <h3>Insert Link</h3>
          <div class="form-group">
            <label>Link Text</label>
            <input type="text" id="linkText" placeholder="Enter link text">
          </div>
          <div class="form-group">
            <label>URL</label>
            <input type="url" id="linkUrl" placeholder="https://example.com">
          </div>
          <div class="form-group">
            <label>Open in</label>
            <select id="linkTarget">
              <option value="_self">Same Tab</option>
              <option value="_blank">New Tab</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="linkCancel">Cancel</button>
            <button class="modal-btn primary" id="linkInsert">Insert</button>
          </div>
        </div>
      </div>

      <!-- Image Modal -->
      <div class="modal" id="imageModal">
        <div class="modal-content">
          <h3>Insert Image</h3>
          <div class="form-group">
            <label>Alt Text</label>
            <input type="text" id="imageAlt" placeholder="Image description">
          </div>
          <div class="form-group">
            <label>Image URL</label>
            <input type="url" id="imageUrl" placeholder="https://example.com/image.jpg">
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="imageCancel">Cancel</button>
            <button class="modal-btn primary" id="imageInsert">Insert</button>
          </div>
        </div>
      </div>

      <!-- Video Modal -->
      <div class="modal" id="videoModal">
        <div class="modal-content">
          <h3>Insert Video</h3>
          <div class="form-group">
            <label>Video URL</label>
            <input type="url" id="videoUrl" placeholder="https://youtube.com/watch?v=...">
          </div>
          <div class="form-group">
            <label>Caption (optional)</label>
            <input type="text" id="videoCaption" placeholder="Video caption">
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="videoCancel">Cancel</button>
            <button class="modal-btn primary" id="videoInsert">Insert</button>
          </div>
        </div>
      </div>

      <!-- Table Modal -->
      <div class="modal" id="tableModal">
        <div class="modal-content">
          <h3>Insert Table</h3>
          <div class="form-group">
            <label>Rows</label>
            <input type="number" id="tableRows" min="2" max="20" value="3">
          </div>
          <div class="form-group">
            <label>Columns</label>
            <input type="number" id="tableCols" min="2" max="10" value="3">
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="tableCancel">Cancel</button>
            <button class="modal-btn primary" id="tableInsert">Insert</button>
          </div>
        </div>
      </div>

      <!-- Code Block Modal -->
      <div class="modal" id="codeblockModal">
        <div class="modal-content">
          <h3>Insert Code Block</h3>
          <div class="form-group">
            <label>Language</label>
            <input type="text" id="codeLanguage" placeholder="javascript, python, html, etc.">
          </div>
          <div class="form-group">
            <label>Code</label>
            <textarea id="codeContent" rows="6" placeholder="Enter your code here..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="codeblockCancel">Cancel</button>
            <button class="modal-btn primary" id="codeblockInsert">Insert</button>
          </div>
        </div>
      </div>

      <!-- Emoji Modal -->
      <div class="modal" id="emojiModal">
        <div class="modal-content">
          <h3>Insert Emoji</h3>
          <div class="form-group">
            <label>Emoji Code (without colons)</label>
            <input type="text" id="emojiCode" placeholder="smile, heart, fire, etc.">
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="emojiCancel">Cancel</button>
            <button class="modal-btn primary" id="emojiInsert">Insert</button>
          </div>
        </div>
      </div>

      <!-- Math Modal -->
      <div class="modal" id="mathModal">
        <div class="modal-content">
          <h3>Insert Math Expression</h3>
          <div class="form-group">
            <label>LaTeX Expression</label>
            <input type="text" id="mathExpression" placeholder="x^2 + y^2 = z^2">
          </div>
          <div class="form-group">
            <label>Display Mode</label>
            <select id="mathMode">
              <option value="inline">Inline ($...$)</option>
              <option value="block">Block ($$...$$)</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="mathCancel">Cancel</button>
            <button class="modal-btn primary" id="mathInsert">Insert</button>
          </div>
        </div>
      </div>
    `;
  }

  initializeEditor() {
    this.editor = this.shadowRoot.getElementById('richEditor');
    this.markdownTextarea = this.shadowRoot.getElementById('markdownOutput');
  }

  attachEventListeners() {
    // Tab switching
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    const tabContents = this.shadowRoot.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        tab.classList.add('active');
        this.shadowRoot.querySelector(`[data-content="${targetTab}"]`).classList.add('active');
      });
    });

    // Toolbar buttons
    const toolbarBtns = this.shadowRoot.querySelectorAll('.toolbar-btn');
    toolbarBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        this.handleToolbarAction(action);
      });
    });

    // Editor input
    this.editor.addEventListener('input', () => {
      this.convertToMarkdown();
    });

    // Copy button
    const copyBtn = this.shadowRoot.getElementById('copyBtn');
    copyBtn.addEventListener('click', () => this.copyMarkdown());

    // Modal event listeners
    this.setupModalListeners();
  }

  setupModalListeners() {
    // Link Modal
    this.shadowRoot.getElementById('linkCancel').addEventListener('click', () => {
      this.closeModal('linkModal');
    });
    this.shadowRoot.getElementById('linkInsert').addEventListener('click', () => {
      this.insertLink();
    });

    // Image Modal
    this.shadowRoot.getElementById('imageCancel').addEventListener('click', () => {
      this.closeModal('imageModal');
    });
    this.shadowRoot.getElementById('imageInsert').addEventListener('click', () => {
      this.insertImage();
    });

    // Video Modal
    this.shadowRoot.getElementById('videoCancel').addEventListener('click', () => {
      this.closeModal('videoModal');
    });
    this.shadowRoot.getElementById('videoInsert').addEventListener('click', () => {
      this.insertVideo();
    });

    // Table Modal
    this.shadowRoot.getElementById('tableCancel').addEventListener('click', () => {
      this.closeModal('tableModal');
    });
    this.shadowRoot.getElementById('tableInsert').addEventListener('click', () => {
      this.insertTable();
    });

    // Code Block Modal
    this.shadowRoot.getElementById('codeblockCancel').addEventListener('click', () => {
      this.closeModal('codeblockModal');
    });
    this.shadowRoot.getElementById('codeblockInsert').addEventListener('click', () => {
      this.insertCodeBlock();
    });

    // Emoji Modal
    this.shadowRoot.getElementById('emojiCancel').addEventListener('click', () => {
      this.closeModal('emojiModal');
    });
    this.shadowRoot.getElementById('emojiInsert').addEventListener('click', () => {
      this.insertEmoji();
    });

    // Math Modal
    this.shadowRoot.getElementById('mathCancel').addEventListener('click', () => {
      this.closeModal('mathModal');
    });
    this.shadowRoot.getElementById('mathInsert').addEventListener('click', () => {
      this.insertMath();
    });
  }

  handleToolbarAction(action) {
    this.editor.focus();
    
    switch(action) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        this.insertHeading(action);
        break;
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'strikethrough':
        document.execCommand('strikeThrough', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'code':
        this.wrapSelection('<code>', '</code>');
        break;
      case 'superscript':
        document.execCommand('superscript', false, null);
        break;
      case 'subscript':
        document.execCommand('subscript', false, null);
        break;
      case 'highlight':
        this.wrapSelection('<mark>', '</mark>');
        break;
      case 'ul':
        document.execCommand('insertUnorderedList', false, null);
        break;
      case 'ol':
        document.execCommand('insertOrderedList', false, null);
        break;
      case 'tasklist':
        this.insertTaskList();
        break;
      case 'link':
        this.openModal('linkModal');
        break;
      case 'image':
        this.openModal('imageModal');
        break;
      case 'video':
        this.openModal('videoModal');
        break;
      case 'blockquote':
        this.insertBlockquote();
        break;
      case 'hr':
        this.insertHorizontalRule();
        break;
      case 'codeblock':
        this.openModal('codeblockModal');
        break;
      case 'table':
        this.openModal('tableModal');
        break;
      case 'emoji':
        this.openModal('emojiModal');
        break;
      case 'math':
        this.openModal('mathModal');
        break;
    }

    setTimeout(() => this.convertToMarkdown(), 100);
  }

  insertHeading(level) {
    const tag = level.toUpperCase();
    document.execCommand('formatBlock', false, tag);
  }

  wrapSelection(before, after) {
    const selection = this.shadowRoot.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      const wrapper = document.createElement('span');
      wrapper.innerHTML = before + selectedText + after;
      range.deleteContents();
      range.insertNode(wrapper);
    }
  }

  insertTaskList() {
    const taskItem = document.createElement('div');
    taskItem.innerHTML = '☐ Task item';
    taskItem.setAttribute('data-task', 'unchecked');
    this.insertAtCursor(taskItem);
  }

  insertBlockquote() {
    document.execCommand('formatBlock', false, 'BLOCKQUOTE');
  }

  insertHorizontalRule() {
    document.execCommand('insertHorizontalRule', false, null);
  }

  insertAtCursor(element) {
    const selection = this.shadowRoot.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(element);
      range.setStartAfter(element);
      range.setEndAfter(element);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      this.editor.appendChild(element);
    }
  }

  openModal(modalId) {
    const modal = this.shadowRoot.getElementById(modalId);
    modal.classList.add('active');
    
    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input, textarea');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  closeModal(modalId) {
    const modal = this.shadowRoot.getElementById(modalId);
    modal.classList.remove('active');
  }

  insertLink() {
    const text = this.shadowRoot.getElementById('linkText').value;
    const url = this.shadowRoot.getElementById('linkUrl').value;
    const target = this.shadowRoot.getElementById('linkTarget').value;

    if (text && url) {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = text;
      link.target = target;
      link.setAttribute('data-target', target);
      this.insertAtCursor(link);
      this.closeModal('linkModal');
      
      // Clear inputs
      this.shadowRoot.getElementById('linkText').value = '';
      this.shadowRoot.getElementById('linkUrl').value = '';
      this.convertToMarkdown();
    }
  }

  insertImage() {
    const alt = this.shadowRoot.getElementById('imageAlt').value;
    const url = this.shadowRoot.getElementById('imageUrl').value;

    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = alt || 'image';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '10px 0';
      this.insertAtCursor(img);
      this.closeModal('imageModal');
      
      // Clear inputs
      this.shadowRoot.getElementById('imageAlt').value = '';
      this.shadowRoot.getElementById('imageUrl').value = '';
      this.convertToMarkdown();
    }
  }

  insertVideo() {
    const url = this.shadowRoot.getElementById('videoUrl').value;
    const caption = this.shadowRoot.getElementById('videoCaption').value;

    if (url) {
      const videoContainer = document.createElement('div');
      videoContainer.setAttribute('data-video', url);
      videoContainer.setAttribute('data-caption', caption || '');
      videoContainer.style.margin = '10px 0';
      videoContainer.innerHTML = `<p>[Video: ${url}]${caption ? ' - ' + caption : ''}</p>`;
      this.insertAtCursor(videoContainer);
      this.closeModal('videoModal');
      
      // Clear inputs
      this.shadowRoot.getElementById('videoUrl').value = '';
      this.shadowRoot.getElementById('videoCaption').value = '';
      this.convertToMarkdown();
    }
  }

  insertTable() {
    const rows = parseInt(this.shadowRoot.getElementById('tableRows').value);
    const cols = parseInt(this.shadowRoot.getElementById('tableCols').value);

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '10px 0';

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const th = document.createElement('th');
      th.textContent = `Header ${i + 1}`;
      th.style.border = '1px solid #e2e8f0';
      th.style.padding = '8px';
      th.style.backgroundColor = '#f8fafc';
      th.contentEditable = 'true';
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body rows
    const tbody = document.createElement('tbody');
    for (let i = 1; i < rows; i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        td.textContent = `Cell ${i}-${j + 1}`;
        td.style.border = '1px solid #e2e8f0';
        td.style.padding = '8px';
        td.contentEditable = 'true';
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);

    this.insertAtCursor(table);
    this.closeModal('tableModal');
    this.convertToMarkdown();
  }

  insertCodeBlock() {
    const language = this.shadowRoot.getElementById('codeLanguage').value;
    const code = this.shadowRoot.getElementById('codeContent').value;

    if (code) {
      const codeBlock = document.createElement('pre');
      const codeElement = document.createElement('code');
      codeElement.textContent = code;
      if (language) {
        codeElement.setAttribute('data-language', language);
      }
      codeBlock.appendChild(codeElement);
      codeBlock.style.backgroundColor = '#1e293b';
      codeBlock.style.color = '#e2e8f0';
      codeBlock.style.padding = '15px';
      codeBlock.style.borderRadius = '8px';
      codeBlock.style.overflow = 'auto';
      codeBlock.style.margin = '10px 0';
      
      this.insertAtCursor(codeBlock);
      this.closeModal('codeblockModal');
      
      // Clear inputs
      this.shadowRoot.getElementById('codeLanguage').value = '';
      this.shadowRoot.getElementById('codeContent').value = '';
      this.convertToMarkdown();
    }
  }

  insertEmoji() {
    const emojiCode = this.shadowRoot.getElementById('emojiCode').value;

    if (emojiCode) {
      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = `:${emojiCode}:`;
      emojiSpan.setAttribute('data-emoji', emojiCode);
      this.insertAtCursor(emojiSpan);
      this.closeModal('emojiModal');
      
      // Clear input
      this.shadowRoot.getElementById('emojiCode').value = '';
      this.convertToMarkdown();
    }
  }

  insertMath() {
    const expression = this.shadowRoot.getElementById('mathExpression').value;
    const mode = this.shadowRoot.getElementById('mathMode').value;

    if (expression) {
      const mathSpan = document.createElement('span');
      const wrapper = mode === 'inline' ? `$${expression}$` : `$$${expression}$$`;
      mathSpan.textContent = wrapper;
      mathSpan.setAttribute('data-math', expression);
      mathSpan.setAttribute('data-math-mode', mode);
      this.insertAtCursor(mathSpan);
      this.closeModal('mathModal');
      
      // Clear inputs
      this.shadowRoot.getElementById('mathExpression').value = '';
      this.convertToMarkdown();
    }
  }

  convertToMarkdown() {
    let markdown = '';
    const nodes = this.editor.childNodes;

    nodes.forEach(node => {
      markdown += this.nodeToMarkdown(node);
    });

    this.markdownOutput = markdown.trim();
    this.markdownTextarea.value = this.markdownOutput;
  }

  nodeToMarkdown(node) {
    if (!node) return '';

    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(n => this.nodeToMarkdown(n)).join('');

      switch(tag) {
        case 'h1': return `# ${children}\n\n`;
        case 'h2': return `## ${children}\n\n`;
        case 'h3': return `### ${children}\n\n`;
        case 'h4': return `#### ${children}\n\n`;
        case 'h5': return `##### ${children}\n\n`;
        case 'h6': return `###### ${children}\n\n`;
        case 'p': return `${children}\n\n`;
        case 'br': return '\n';
        case 'strong':
        case 'b':
          return `**${children}**`;
        case 'em':
        case 'i':
          return `*${children}*`;
        case 'strike':
        case 'del':
          return `~~${children}~~`;
        case 'u':
          return `<u>${children}</u>`;
        case 'code':
          return node.parentElement?.tagName.toLowerCase() === 'pre' ? children : `\`${children}\``;
        case 'sup':
          return `<sup>${children}</sup>`;
        case 'sub':
          return `<sub>${children}</sub>`;
        case 'mark':
          return `<mark>${children}</mark>`;
        case 'pre':
          const codeNode = node.querySelector('code');
          const language = codeNode?.getAttribute('data-language') || '';
          const code = codeNode ? codeNode.textContent : children;
          return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
        case 'blockquote':
          return `> ${children}\n\n`;
        case 'hr':
          return `---\n\n`;
        case 'ul':
          return this.listToMarkdown(node, false);
        case 'ol':
          return this.listToMarkdown(node, true);
        case 'li':
          return children;
        case 'a':
          const href = node.getAttribute('href') || '';
          const target = node.getAttribute('data-target') || '_self';
          const targetComment = target === '_blank' ? ' <!-- target="_blank" -->' : '';
          return `[${children}](${href})${targetComment}`;
        case 'img':
          const src = node.getAttribute('src') || '';
          const alt = node.getAttribute('alt') || 'image';
          return `![${alt}](${src})\n\n`;
        case 'table':
          return this.tableToMarkdown(node);
        case 'div':
          if (node.getAttribute('data-task')) {
            const checked = node.getAttribute('data-task') === 'checked';
            return `- [${checked ? 'x' : ' '}] ${children}\n`;
          }
          if (node.getAttribute('data-video')) {
            const videoUrl = node.getAttribute('data-video');
            const caption = node.getAttribute('data-caption');
            return `[Video](${videoUrl})${caption ? ` *${caption}*` : ''}\n\n`;
          }
          return children ? children + '\n\n' : '';
        case 'span':
          if (node.getAttribute('data-emoji')) {
            return `:${node.getAttribute('data-emoji')}:`;
          }
          if (node.getAttribute('data-math')) {
            const mode = node.getAttribute('data-math-mode');
            const expr = node.getAttribute('data-math');
            return mode === 'inline' ? `$${expr}$` : `$$${expr}$$`;
          }
          return children;
        default:
          return children;
      }
    }

    return '';
  }

  listToMarkdown(listNode, ordered) {
    let markdown = '';
    const items = listNode.querySelectorAll(':scope > li');
    
    items.forEach((item, index) => {
      const prefix = ordered ? `${index + 1}. ` : '- ';
      const content = this.nodeToMarkdown(item);
      markdown += prefix + content.trim() + '\n';
    });

    return markdown + '\n';
  }

  tableToMarkdown(tableNode) {
    let markdown = '';
    const rows = tableNode.querySelectorAll('tr');
    
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('th, td');
      const cellContents = Array.from(cells).map(cell => cell.textContent.trim());
      markdown += '| ' + cellContents.join(' | ') + ' |\n';
      
      // Add separator after header
      if (rowIndex === 0) {
        markdown += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
      }
    });

    return markdown + '\n';
  }

  copyMarkdown() {
    const copyBtn = this.shadowRoot.getElementById('copyBtn');
    
    navigator.clipboard.writeText(this.markdownOutput).then(() => {
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');
      
      setTimeout(() => {
        copyBtn.textContent = 'Copy Markdown';
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback
      this.markdownTextarea.select();
      document.execCommand('copy');
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');
      
      setTimeout(() => {
        copyBtn.textContent = 'Copy Markdown';
        copyBtn.classList.remove('copied');
      }, 2000);
    });
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
    }, 20000); // 20 seconds
  }

  saveToLocalStorage() {
    const data = {
      html: this.editor.innerHTML,
      markdown: this.markdownOutput,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem('markdownEditor_autoSave', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('markdownEditor_autoSave');
      if (saved) {
        const data = JSON.parse(saved);
        this.editor.innerHTML = data.html || '';
        this.convertToMarkdown();
      }
    } catch (e) {
      console.error('Error loading saved data:', e);
    }
  }
}

// Register the custom element
customElements.define('markdown-editor', MarkdownEditor);
