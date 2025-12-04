class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
    this.currentTab = 'input';
    this.autoSaveInterval = null;
    this.editorContent = '';
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.loadFromLocalStorage();
    this.startAutoSave();
  }

  disconnectedCallback() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  render() {
    this.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .markdown-editor-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header Tabs */
        .editor-header {
          display: flex;
          background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%);
          border-bottom: 1px solid #d1d5db;
          padding: 0;
        }

        .tab {
          flex: 1;
          padding: 12px 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
          position: relative;
        }

        .tab:hover {
          color: #374151;
          background: rgba(0, 0, 0, 0.02);
        }

        .tab.active {
          color: #2563eb;
          background: #fff;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #2563eb;
        }

        /* Toolbar */
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 12px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .toolbar-group {
          display: flex;
          gap: 2px;
          padding-right: 8px;
          border-right: 1px solid #d1d5db;
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .toolbar-btn {
          width: 32px;
          height: 32px;
          border: 1px solid transparent;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          font-size: 16px;
          color: #374151;
        }

        .toolbar-btn:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .toolbar-btn:active {
          background: #d1d5db;
        }

        .toolbar-btn.wide {
          width: auto;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .toolbar-select {
          height: 32px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: #fff;
          padding: 0 8px;
          font-size: 13px;
          cursor: pointer;
          color: #374151;
        }

        .toolbar-select:hover {
          border-color: #9ca3af;
        }

        /* Editor Area */
        .editor-content {
          min-height: 500px;
          max-height: 600px;
          overflow-y: auto;
        }

        .input-panel, .output-panel {
          display: none;
        }

        .input-panel.active, .output-panel.active {
          display: block;
        }

        #richEditor {
          min-height: 500px;
          padding: 20px;
          outline: none;
          font-size: 15px;
          line-height: 1.6;
          color: #1f2937;
        }

        #richEditor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }

        /* Markdown Output */
        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .output-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .copy-btn {
          padding: 8px 16px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .copy-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }

        .copy-btn.copied {
          background: #10b981;
        }

        #markdownOutput {
          min-height: 500px;
          padding: 20px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: #1f2937;
          background: #f9fafb;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        /* Rich Editor Styles */
        #richEditor h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0; }
        #richEditor h2 { font-size: 1.5em; font-weight: 600; margin: 0.75em 0; }
        #richEditor h3 { font-size: 1.17em; font-weight: 600; margin: 0.83em 0; }
        #richEditor h4 { font-size: 1em; font-weight: 600; margin: 1em 0; }
        #richEditor h5 { font-size: 0.83em; font-weight: 600; margin: 1.17em 0; }
        #richEditor h6 { font-size: 0.67em; font-weight: 600; margin: 1.33em 0; }

        #richEditor p { margin: 1em 0; }
        #richEditor strong { font-weight: 700; }
        #richEditor em { font-style: italic; }
        #richEditor u { text-decoration: underline; }
        #richEditor s { text-decoration: line-through; }
        #richEditor code { 
          background: #f3f4f6; 
          padding: 2px 6px; 
          border-radius: 3px; 
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        #richEditor pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1em 0;
        }
        #richEditor pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        #richEditor blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 16px;
          margin: 1em 0;
          color: #6b7280;
          font-style: italic;
        }
        #richEditor ul, #richEditor ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        #richEditor li {
          margin: 0.5em 0;
        }
        #richEditor hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2em 0;
        }
        #richEditor a {
          color: #2563eb;
          text-decoration: underline;
        }
        #richEditor img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 1em 0;
        }
        #richEditor table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        #richEditor table th, #richEditor table td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
        }
        #richEditor table th {
          background: #f3f4f6;
          font-weight: 600;
        }
        #richEditor mark {
          background: #fef08a;
          padding: 2px 4px;
        }
        #richEditor sup { vertical-align: super; font-size: 0.8em; }
        #richEditor sub { vertical-align: sub; font-size: 0.8em; }

        .task-list {
          list-style: none;
          padding-left: 0;
        }

        .task-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .task-list input[type="checkbox"] {
          margin-top: 4px;
        }

        /* Auto-save indicator */
        .autosave-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 12px;
          color: #10b981;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .autosave-indicator.show {
          opacity: 1;
        }

        /* Modal for links and images */
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          align-items: center;
          justify-content: center;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: #fff;
          padding: 24px;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .modal-field {
          margin-bottom: 16px;
        }

        .modal-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          color: #374151;
        }

        .modal-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .modal-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .modal-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn.primary {
          background: #2563eb;
          color: #fff;
        }

        .modal-btn.primary:hover {
          background: #1d4ed8;
        }

        .modal-btn.secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .modal-btn.secondary:hover {
          background: #d1d5db;
        }

        /* Scrollbar */
        .editor-content::-webkit-scrollbar {
          width: 8px;
        }

        .editor-content::-webkit-scrollbar-track {
          background: #f3f4f6;
        }

        .editor-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .editor-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      </style>

      <div class="markdown-editor-container">
        <div class="editor-header">
          <button class="tab active" data-tab="input">📝 Rich Editor</button>
          <button class="tab" data-tab="output">📋 Markdown Output</button>
        </div>

        <div class="toolbar">
          <div class="toolbar-group">
            <select class="toolbar-select" id="headingSelect">
              <option value="">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="h5">Heading 5</option>
              <option value="h6">Heading 6</option>
            </select>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-command="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
            <button class="toolbar-btn" data-command="italic" title="Italic (Ctrl+I)"><em>I</em></button>
            <button class="toolbar-btn" data-command="underline" title="Underline (Ctrl+U)"><u>U</u></button>
            <button class="toolbar-btn" data-command="strikethrough" title="Strikethrough"><s>S</s></button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">•</button>
            <button class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">1.</button>
            <button class="toolbar-btn" data-command="taskList" title="Task List">☑</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-command="insertLink" title="Insert Link">🔗</button>
            <button class="toolbar-btn" data-command="insertImage" title="Insert Image">🖼️</button>
            <button class="toolbar-btn" data-command="insertVideo" title="Insert Video">🎬</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-command="blockquote" title="Blockquote">❝</button>
            <button class="toolbar-btn" data-command="code" title="Inline Code">&lt;/&gt;</button>
            <button class="toolbar-btn" data-command="codeBlock" title="Code Block">{ }</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-command="table" title="Insert Table">⊞</button>
            <button class="toolbar-btn" data-command="horizontalRule" title="Horizontal Rule">—</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-command="superscript" title="Superscript">x²</button>
            <button class="toolbar-btn" data-command="subscript" title="Subscript">x₂</button>
            <button class="toolbar-btn" data-command="highlight" title="Highlight">⬛</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-command="emoji" title="Insert Emoji">😊</button>
            <button class="toolbar-btn wide" data-command="clear" title="Clear All">Clear</button>
          </div>
        </div>

        <div class="editor-content">
          <div class="input-panel active">
            <div contenteditable="true" id="richEditor" data-placeholder="Start typing your content here..."></div>
            <div class="autosave-indicator">✓ Saved</div>
          </div>

          <div class="output-panel">
            <div class="output-header">
              <span class="output-title">Markdown Output</span>
              <button class="copy-btn" id="copyBtn">
                <span>📋</span>
                <span class="copy-text">Copy Markdown</span>
              </button>
            </div>
            <pre id="markdownOutput"></pre>
          </div>
        </div>
      </div>

      <!-- Link Modal -->
      <div class="modal" id="linkModal">
        <div class="modal-content">
          <div class="modal-header">Insert Link</div>
          <div class="modal-field">
            <label class="modal-label">Link Text</label>
            <input type="text" class="modal-input" id="linkText" placeholder="Enter link text">
          </div>
          <div class="modal-field">
            <label class="modal-label">URL</label>
            <input type="text" class="modal-input" id="linkUrl" placeholder="https://example.com">
          </div>
          <div class="modal-checkbox">
            <input type="checkbox" id="linkNewTab">
            <label for="linkNewTab">Open in new tab</label>
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
          <div class="modal-header">Insert Image</div>
          <div class="modal-field">
            <label class="modal-label">Image URL</label>
            <input type="text" class="modal-input" id="imageUrl" placeholder="https://example.com/image.jpg">
          </div>
          <div class="modal-field">
            <label class="modal-label">Alt Text (Optional)</label>
            <input type="text" class="modal-input" id="imageAlt" placeholder="Image description">
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
          <div class="modal-header">Insert Video</div>
          <div class="modal-field">
            <label class="modal-label">Video URL</label>
            <input type="text" class="modal-input" id="videoUrl" placeholder="https://youtube.com/watch?v=...">
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
          <div class="modal-header">Insert Table</div>
          <div class="modal-field">
            <label class="modal-label">Rows</label>
            <input type="number" class="modal-input" id="tableRows" value="3" min="1">
          </div>
          <div class="modal-field">
            <label class="modal-label">Columns</label>
            <input type="number" class="modal-input" id="tableCols" value="3" min="1">
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="tableCancel">Cancel</button>
            <button class="modal-btn primary" id="tableInsert">Insert</button>
          </div>
        </div>
      </div>

      <!-- Emoji Picker Modal -->
      <div class="modal" id="emojiModal">
        <div class="modal-content">
          <div class="modal-header">Insert Emoji</div>
          <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin-bottom: 16px; max-height: 300px; overflow-y: auto;">
            ${['😊', '😂', '🥰', '😍', '🤔', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💯', '🚀', '⭐', '✅', '❌', '⚠️', '💡', '📝', '📌', '🔔', '🎯', '💪', '🙏'].map(emoji => 
              `<button class="toolbar-btn" data-emoji="${emoji}" style="font-size: 24px;">${emoji}</button>`
            ).join('')}
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" id="emojiCancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Tab switching
    this.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Toolbar buttons
    this.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.dataset.command;
        if (command) this.executeCommand(command);
      });
    });

    // Heading selector
    const headingSelect = this.querySelector('#headingSelect');
    headingSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        document.execCommand('formatBlock', false, e.target.value);
      } else {
        document.execCommand('formatBlock', false, 'p');
      }
      this.updateMarkdown();
    });

    // Rich editor input
    const richEditor = this.querySelector('#richEditor');
    richEditor.addEventListener('input', () => this.updateMarkdown());
    richEditor.addEventListener('paste', (e) => this.handlePaste(e));

    // Keyboard shortcuts
    richEditor.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Copy button
    const copyBtn = this.querySelector('#copyBtn');
    copyBtn.addEventListener('click', () => this.copyMarkdown());

    // Link modal
    this.setupLinkModal();
    this.setupImageModal();
    this.setupVideoModal();
    this.setupTableModal();
    this.setupEmojiModal();
  }

  switchTab(tab) {
    this.currentTab = tab;
    
    // Update tab buttons
    this.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    // Update panels
    this.querySelector('.input-panel').classList.toggle('active', tab === 'input');
    this.querySelector('.output-panel').classList.toggle('active', tab === 'output');

    // Update markdown when switching to output
    if (tab === 'output') {
      this.updateMarkdown();
    }
  }

  executeCommand(command) {
    const editor = this.querySelector('#richEditor');
    editor.focus();

    switch(command) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strikethrough':
        document.execCommand(command);
        break;
      case 'insertUnorderedList':
      case 'insertOrderedList':
        document.execCommand(command);
        break;
      case 'taskList':
        this.insertTaskList();
        break;
      case 'insertLink':
        this.showLinkModal();
        break;
      case 'insertImage':
        this.showImageModal();
        break;
      case 'insertVideo':
        this.showVideoModal();
        break;
      case 'blockquote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'code':
        this.wrapSelection('<code>', '</code>');
        break;
      case 'codeBlock':
        this.insertCodeBlock();
        break;
      case 'table':
        this.showTableModal();
        break;
      case 'horizontalRule':
        document.execCommand('insertHorizontalRule');
        break;
      case 'superscript':
        document.execCommand('superscript');
        break;
      case 'subscript':
        document.execCommand('subscript');
        break;
      case 'highlight':
        this.wrapSelection('<mark>', '</mark>');
        break;
      case 'emoji':
        this.showEmojiModal();
        break;
      case 'clear':
        if (confirm('Are you sure you want to clear all content?')) {
          editor.innerHTML = '';
          this.updateMarkdown();
        }
        break;
    }

    this.updateMarkdown();
  }

  wrapSelection(startTag, endTag) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      const wrapper = document.createElement('span');
      wrapper.innerHTML = startTag + selectedText + endTag;
      range.deleteContents();
      range.insertNode(wrapper);
    }
  }

  insertTaskList() {
    const editor = this.querySelector('#richEditor');
    const taskList = document.createElement('ul');
    taskList.className = 'task-list';
    
    for (let i = 0; i < 3; i++) {
      const li = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      const text = document.createElement('span');
      text.textContent = `Task ${i + 1}`;
      text.contentEditable = true;
      li.appendChild(checkbox);
      li.appendChild(text);
      taskList.appendChild(li);
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(taskList);
    } else {
      editor.appendChild(taskList);
    }
  }

  insertCodeBlock() {
    const code = prompt('Enter code:');
    const language = prompt('Enter language (optional):') || '';
    
    if (code !== null) {
      const pre = document.createElement('pre');
      const codeEl = document.createElement('code');
      if (language) {
        codeEl.className = `language-${language}`;
      }
      codeEl.textContent = code;
      pre.appendChild(codeEl);
      
      const editor = this.querySelector('#richEditor');
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(pre);
      } else {
        editor.appendChild(pre);
      }
    }
  }

  setupLinkModal() {
    const modal = this.querySelector('#linkModal');
    const insertBtn = this.querySelector('#linkInsert');
    const cancelBtn = this.querySelector('#linkCancel');

    insertBtn.addEventListener('click', () => {
      const text = this.querySelector('#linkText').value;
      const url = this.querySelector('#linkUrl').value;
      const newTab = this.querySelector('#linkNewTab').checked;

      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.textContent = text || url;
        if (newTab) link.target = '_blank';

        const editor = this.querySelector('#richEditor');
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(link);
        } else {
          editor.appendChild(link);
        }

        this.updateMarkdown();
      }

      modal.classList.remove('active');
      this.clearLinkModal();
    });

    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      this.clearLinkModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        this.clearLinkModal();
      }
    });
  }

  showLinkModal() {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
      this.querySelector('#linkText').value = selectedText;
    }
    this.querySelector('#linkModal').classList.add('active');
  }

  clearLinkModal() {
    this.querySelector('#linkText').value = '';
    this.querySelector('#linkUrl').value = '';
    this.querySelector('#linkNewTab').checked = false;
  }

  setupImageModal() {
    const modal = this.querySelector('#imageModal');
    const insertBtn = this.querySelector('#imageInsert');
    const cancelBtn = this.querySelector('#imageCancel');

    insertBtn.addEventListener('click', () => {
      const url = this.querySelector('#imageUrl').value;
      const alt = this.querySelector('#imageAlt').value;

      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = alt || '';

        const editor = this.querySelector('#richEditor');
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
        } else {
          editor.appendChild(img);
        }

        this.updateMarkdown();
      }

      modal.classList.remove('active');
      this.clearImageModal();
    });

    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      this.clearImageModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        this.clearImageModal();
      }
    });
  }

  showImageModal() {
    this.querySelector('#imageModal').classList.add('active');
  }

  clearImageModal() {
    this.querySelector('#imageUrl').value = '';
    this.querySelector('#imageAlt').value = '';
  }

  setupVideoModal() {
    const modal = this.querySelector('#videoModal');
    const insertBtn = this.querySelector('#videoInsert');
    const cancelBtn = this.querySelector('#videoCancel');

    insertBtn.addEventListener('click', () => {
      const url = this.querySelector('#videoUrl').value;

      if (url) {
        const videoEmbed = this.getVideoEmbed(url);
        if (videoEmbed) {
          const editor = this.querySelector('#richEditor');
          const div = document.createElement('div');
          div.innerHTML = videoEmbed;
          
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(div);
          } else {
            editor.appendChild(div);
          }

          this.updateMarkdown();
        }
      }

      modal.classList.remove('active');
      this.clearVideoModal();
    });

    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      this.clearVideoModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        this.clearVideoModal();
      }
    });
  }

  showVideoModal() {
    this.querySelector('#videoModal').classList.add('active');
  }

  clearVideoModal() {
    this.querySelector('#videoUrl').value = '';
  }

  getVideoEmbed(url) {
    // YouTube
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) {
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe>`;
    }

    // Vimeo
    match = url.match(/vimeo\.com\/(\d+)/);
    if (match) {
      return `<iframe src="https://player.vimeo.com/video/${match[1]}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
    }

    return null;
  }

  setupTableModal() {
    const modal = this.querySelector('#tableModal');
    const insertBtn = this.querySelector('#tableInsert');
    const cancelBtn = this.querySelector('#tableCancel');

    insertBtn.addEventListener('click', () => {
      const rows = parseInt(this.querySelector('#tableRows').value) || 3;
      const cols = parseInt(this.querySelector('#tableCols').value) || 3;

      const table = document.createElement('table');
      
      // Create header row
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      for (let i = 0; i < cols; i++) {
        const th = document.createElement('th');
        th.textContent = `Header ${i + 1}`;
        th.contentEditable = true;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Create body rows
      const tbody = document.createElement('tbody');
      for (let i = 0; i < rows; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < cols; j++) {
          const td = document.createElement('td');
          td.textContent = `Cell ${i + 1},${j + 1}`;
          td.contentEditable = true;
          row.appendChild(td);
        }
        tbody.appendChild(row);
      }
      table.appendChild(tbody);

      const editor = this.querySelector('#richEditor');
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(table);
      } else {
        editor.appendChild(table);
      }

      this.updateMarkdown();
      modal.classList.remove('active');
    });

    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  showTableModal() {
    this.querySelector('#tableModal').classList.add('active');
  }

  setupEmojiModal() {
    const modal = this.querySelector('#emojiModal');
    const cancelBtn = this.querySelector('#emojiCancel');

    modal.querySelectorAll('[data-emoji]').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        const editor = this.querySelector('#richEditor');
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(document.createTextNode(emoji));
        } else {
          editor.appendChild(document.createTextNode(emoji));
        }

        this.updateMarkdown();
        modal.classList.remove('active');
      });
    });

    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  showEmojiModal() {
    this.querySelector('#emojiModal').classList.add('active');
  }

  handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  handleKeyboard(e) {
    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold');
      this.updateMarkdown();
    }
    // Ctrl+I for italic
    else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      document.execCommand('italic');
      this.updateMarkdown();
    }
    // Ctrl+U for underline
    else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      document.execCommand('underline');
      this.updateMarkdown();
    }
  }

  htmlToMarkdown(html) {
    let markdown = '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const processNode = (node, depth = 0) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const tag = node.tagName.toLowerCase();
      let result = '';

      switch(tag) {
        case 'h1':
          result = '# ' + node.textContent + '\n\n';
          break;
        case 'h2':
          result = '## ' + node.textContent + '\n\n';
          break;
        case 'h3':
          result = '### ' + node.textContent + '\n\n';
          break;
        case 'h4':
          result = '#### ' + node.textContent + '\n\n';
          break;
        case 'h5':
          result = '##### ' + node.textContent + '\n\n';
          break;
        case 'h6':
          result = '###### ' + node.textContent + '\n\n';
          break;
        case 'p':
          result = Array.from(node.childNodes).map(child => processNode(child, depth)).join('') + '\n\n';
          break;
        case 'strong':
        case 'b':
          result = '**' + node.textContent + '**';
          break;
        case 'em':
        case 'i':
          result = '*' + node.textContent + '*';
          break;
        case 'u':
          result = '<u>' + node.textContent + '</u>';
          break;
        case 's':
        case 'strike':
          result = '~~' + node.textContent + '~~';
          break;
        case 'code':
          if (node.parentElement.tagName.toLowerCase() === 'pre') {
            const language = node.className.replace('language-', '');
            result = '```' + language + '\n' + node.textContent + '\n```\n\n';
          } else {
            result = '`' + node.textContent + '`';
          }
          break;
        case 'pre':
          // Handled by code block
          result = Array.from(node.childNodes).map(child => processNode(child, depth)).join('');
          break;
        case 'blockquote':
          const lines = node.textContent.split('\n');
          result = lines.map(line => '> ' + line).join('\n') + '\n\n';
          break;
        case 'ul':
          if (node.classList.contains('task-list')) {
            result = Array.from(node.children).map(li => {
              const checkbox = li.querySelector('input[type="checkbox"]');
              const checked = checkbox && checkbox.checked ? 'x' : ' ';
              const text = li.textContent;
              return `- [${checked}] ${text}`;
            }).join('\n') + '\n\n';
          } else {
            result = Array.from(node.children).map(li => 
              '  '.repeat(depth) + '- ' + Array.from(li.childNodes).map(child => processNode(child, depth + 1)).join('')
            ).join('\n') + '\n\n';
          }
          break;
        case 'ol':
          result = Array.from(node.children).map((li, index) => 
            '  '.repeat(depth) + (index + 1) + '. ' + Array.from(li.childNodes).map(child => processNode(child, depth + 1)).join('')
          ).join('\n') + '\n\n';
          break;
        case 'li':
          result = Array.from(node.childNodes).map(child => processNode(child, depth)).join('');
          break;
        case 'a':
          const href = node.getAttribute('href') || '';
          const target = node.getAttribute('target');
          const linkText = node.textContent;
          result = `[${linkText}](${href})`;
          if (target === '_blank') {
            result += ' <!-- target="_blank" -->';
          }
          break;
        case 'img':
          const src = node.getAttribute('src') || '';
          const alt = node.getAttribute('alt') || '';
          result = `![${alt}](${src})\n\n`;
          break;
        case 'hr':
          result = '---\n\n';
          break;
        case 'table':
          const thead = node.querySelector('thead');
          const tbody = node.querySelector('tbody');
          
          if (thead) {
            const headers = Array.from(thead.querySelectorAll('th')).map(th => th.textContent);
            result += '| ' + headers.join(' | ') + ' |\n';
            result += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
          }
          
          if (tbody) {
            Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
              const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent);
              result += '| ' + cells.join(' | ') + ' |\n';
            });
          }
          result += '\n';
          break;
        case 'sup':
          result = '<sup>' + node.textContent + '</sup>';
          break;
        case 'sub':
          result = '<sub>' + node.textContent + '</sub>';
          break;
        case 'mark':
          result = '<mark>' + node.textContent + '</mark>';
          break;
        case 'iframe':
          const iframeSrc = node.getAttribute('src') || '';
          result = `[Video](${iframeSrc})\n\n`;
          break;
        case 'br':
          result = '  \n';
          break;
        case 'div':
        case 'span':
          result = Array.from(node.childNodes).map(child => processNode(child, depth)).join('');
          break;
        default:
          result = Array.from(node.childNodes).map(child => processNode(child, depth)).join('');
      }

      return result;
    };

    markdown = Array.from(tempDiv.childNodes).map(node => processNode(node)).join('');
    
    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    return markdown;
  }

  updateMarkdown() {
    const editor = this.querySelector('#richEditor');
    const output = this.querySelector('#markdownOutput');
    const html = editor.innerHTML;
    
    const markdown = this.htmlToMarkdown(html);
    output.textContent = markdown;
    
    this.editorContent = html;
  }

  copyMarkdown() {
    const output = this.querySelector('#markdownOutput');
    const copyBtn = this.querySelector('#copyBtn');
    const copyText = copyBtn.querySelector('.copy-text');
    
    navigator.clipboard.writeText(output.textContent).then(() => {
      copyBtn.classList.add('copied');
      copyText.textContent = 'Copied!';
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyText.textContent = 'Copy Markdown';
      }, 2000);
    });
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
      this.showAutoSaveIndicator();
    }, 20000); // 20 seconds
  }

  saveToLocalStorage() {
    const editor = this.querySelector('#richEditor');
    const content = editor.innerHTML;
    localStorage.setItem('markdown-editor-content', content);
  }

  loadFromLocalStorage() {
    const content = localStorage.getItem('markdown-editor-content');
    if (content) {
      const editor = this.querySelector('#richEditor');
      editor.innerHTML = content;
      this.updateMarkdown();
    }
  }

  showAutoSaveIndicator() {
    const indicator = this.querySelector('.autosave-indicator');
    indicator.classList.add('show');
    
    setTimeout(() => {
      indicator.classList.remove('show');
    }, 2000);
  }
}

customElements.define('markdown-editor', MarkdownEditor);
