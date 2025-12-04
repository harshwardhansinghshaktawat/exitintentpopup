class RichContentEditor extends HTMLElement {
  constructor() {
    super();
    this.editor = null;
    this.autoSaveInterval = null;
    this.currentTab = 'input';
    this.editorReady = false;
  }

  connectedCallback() {
    this.render();
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      this.loadResources().then(() => {
        this.initializeEditor();
        this.setupEventListeners();
        this.startAutoSave();
      });
    }, 100);
  }

  disconnectedCallback() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.editor && this.editor.destroy) {
      this.editor.destroy();
    }
  }

  loadResources() {
    return new Promise((resolve) => {
      // Check if EditorJS is already loaded
      if (window.EditorJS) {
        resolve();
        return;
      }

      const scripts = [
        'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/header@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/list@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/quote@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/code@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/embed@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/table@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/link@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/warning@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/marker@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/raw@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/image@latest',
        'https://cdn.jsdelivr.net/npm/@editorjs/attaches@latest'
      ];

      let loadedCount = 0;
      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === scripts.length) {
            setTimeout(resolve, 1000);
          }
        };
        script.onerror = () => {
          loadedCount++;
          if (loadedCount === scripts.length) {
            setTimeout(resolve, 1000);
          }
        };
        document.head.appendChild(script);
      });
    });
  }

  render() {
    this.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .editor-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .editor-wrapper {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .editor-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          color: white;
          text-align: center;
          position: relative;
        }

        .editor-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .editor-header p {
          font-size: 16px;
          opacity: 0.9;
        }

        .auto-save-indicator {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .save-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
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
        }

        .tab {
          flex: 1;
          padding: 18px 24px;
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
          background: #e2e8f0;
          color: #475569;
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .content-area {
          padding: 30px;
          min-height: 600px;
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        #editorjs {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          min-height: 500px;
          transition: border-color 0.3s ease;
          cursor: text;
          position: relative;
          z-index: 1;
        }

        #editorjs:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        /* Fix for Editor.js clickability */
        .codex-editor {
          position: relative;
          z-index: 1;
        }

        .codex-editor__redactor {
          padding-bottom: 100px !important;
        }

        .ce-block__content,
        .ce-toolbar__content {
          max-width: 100%;
        }

        .ce-toolbar__actions {
          right: 0;
        }

        .ce-paragraph {
          cursor: text;
        }

        .ce-block {
          cursor: text;
        }

        .ce-block:hover {
          background: transparent;
        }

        .markdown-output-container {
          position: relative;
        }

        .markdown-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .markdown-toolbar h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .copy-btn {
          background: white;
          color: #667eea;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .copy-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .copy-btn:active {
          transform: translateY(0);
        }

        .copy-btn.copied {
          background: #4ade80;
          color: white;
        }

        #markdown-output {
          background: #1e293b;
          color: #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
          min-height: 500px;
          max-height: 600px;
          overflow-y: auto;
          border: 2px solid #334155;
        }

        #markdown-output::-webkit-scrollbar {
          width: 10px;
        }

        #markdown-output::-webkit-scrollbar-track {
          background: #0f172a;
          border-radius: 10px;
        }

        #markdown-output::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
        }

        #markdown-output::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .editor-container {
            padding: 10px;
          }

          .editor-header h1 {
            font-size: 24px;
          }

          .auto-save-indicator {
            position: static;
            margin-top: 10px;
            justify-content: center;
          }

          .content-area {
            padding: 20px;
          }

          .tab {
            padding: 14px 16px;
            font-size: 14px;
          }
        }
      </style>

      <div class="editor-container">
        <div class="editor-wrapper">
          <div class="editor-header">
            <h1>✨ Advanced Rich Content Editor</h1>
            <p>Create beautiful content with Markdown export</p>
            <div class="auto-save-indicator">
              <div class="save-dot"></div>
              <span>Auto-saving...</span>
            </div>
          </div>

          <div class="tabs">
            <button class="tab active" data-tab="input">
              📝 Editor
            </button>
            <button class="tab" data-tab="output">
              📋 Markdown Output
            </button>
          </div>

          <div class="content-area">
            <div class="tab-content active" id="input-tab">
              <div id="editorjs">
                <div class="loading-state">Loading editor...</div>
              </div>
            </div>

            <div class="tab-content" id="output-tab">
              <div class="markdown-output-container">
                <div class="markdown-toolbar">
                  <h3>📄 Markdown Output</h3>
                  <button class="copy-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy Markdown
                  </button>
                </div>
                <pre id="markdown-output">// Your markdown will appear here...</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async initializeEditor() {
    const editorElement = this.querySelector('#editorjs');
    if (!editorElement) {
      console.error('Editor element not found');
      return;
    }

    // Clear loading state
    editorElement.innerHTML = '';

    const savedData = this.loadFromStorage();

    try {
      this.editor = new EditorJS({
        holder: 'editorjs',
        placeholder: 'Click here and start writing your amazing content...',
        autofocus: true,
        minHeight: 300,
        data: savedData || {
          blocks: [
            {
              type: 'header',
              data: {
                text: 'Welcome to the Rich Content Editor! 🎉',
                level: 1
              }
            },
            {
              type: 'paragraph',
              data: {
                text: 'Click anywhere in this editor to start typing. This is a powerful editor with full Markdown support. Start creating your content and see it converted to Markdown in real-time!'
              }
            },
            {
              type: 'paragraph',
              data: {
                text: 'Try adding headers, lists, quotes, code blocks, images, and more from the + button on the left!'
              }
            }
          ]
        },
        tools: {
          header: {
            class: Header,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            },
            inlineToolbar: true
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          checklist: {
            class: Checklist,
            inlineToolbar: true
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: 'Quote author'
            }
          },
          code: {
            class: CodeTool,
            config: {
              placeholder: 'Enter code here'
            }
          },
          delimiter: Delimiter,
          raw: {
            class: RawTool,
            config: {
              placeholder: 'Enter raw HTML'
            }
          },
          table: {
            class: Table,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3
            }
          },
          warning: {
            class: Warning,
            inlineToolbar: true,
            config: {
              titlePlaceholder: 'Title',
              messagePlaceholder: 'Message'
            }
          },
          embed: {
            class: Embed,
            inlineToolbar: true,
            config: {
              services: {
                youtube: true,
                vimeo: true,
                coub: true,
                codepen: {
                  regex: /https?:\/\/codepen\.io\/([^\/\?\&]*)\/pen\/([^\/\?\&]*)/,
                  embedUrl: 'https://codepen.io/<%= remote_id %>?height=300&theme-id=0&default-tab=css,result&embed-version=2',
                  html: "<iframe height='300' scrolling='no' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe>",
                  height: 300,
                  width: 600,
                  id: (groups) => groups.join('/embed/')
                }
              }
            }
          },
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: 'https://api.allorigins.win/get?url='
            }
          },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                uploadByFile: async (file) => {
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      resolve({
                        success: 1,
                        file: {
                          url: e.target.result
                        }
                      });
                    };
                    reader.readAsDataURL(file);
                  });
                },
                uploadByUrl: (url) => {
                  return Promise.resolve({
                    success: 1,
                    file: {
                      url: url
                    }
                  });
                }
              },
              captionPlaceholder: 'Enter image caption'
            }
          },
          attaches: {
            class: AttachesTool,
            config: {
              uploader: {
                uploadByFile: async (file) => {
                  return {
                    success: 1,
                    file: {
                      url: '#',
                      size: file.size,
                      name: file.name,
                      extension: file.name.split('.').pop()
                    }
                  };
                }
              }
            }
          },
          Marker: {
            class: Marker,
            shortcut: 'CMD+SHIFT+M'
          },
          inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+C'
          }
        },
        onChange: async (api, event) => {
          await this.updateMarkdownOutput();
        },
        onReady: () => {
          this.editorReady = true;
          console.log('Editor.js is ready to work!');
          
          // Force focus on the editor
          setTimeout(() => {
            const firstBlock = editorElement.querySelector('.ce-paragraph');
            if (firstBlock) {
              firstBlock.click();
            }
          }, 300);
        }
      });

      // Initial markdown output
      setTimeout(() => {
        this.updateMarkdownOutput();
      }, 1000);

    } catch (error) {
      console.error('Editor initialization error:', error);
      editorElement.innerHTML = '<div class="loading-state" style="color: #ef4444;">Error loading editor. Please refresh the page.</div>';
    }
  }

  async updateMarkdownOutput() {
    if (!this.editor || !this.editorReady) return;

    try {
      const outputData = await this.editor.save();
      const markdown = this.convertToMarkdown(outputData);
      const outputElement = this.querySelector('#markdown-output');
      if (outputElement) {
        outputElement.textContent = markdown || '// Your markdown will appear here...';
      }
    } catch (error) {
      console.error('Error updating markdown:', error);
    }
  }

  convertToMarkdown(data) {
    if (!data || !data.blocks || data.blocks.length === 0) {
      return '// Start writing to see your markdown output here...';
    }

    return data.blocks.map(block => {
      switch (block.type) {
        case 'header':
          const level = '#'.repeat(block.data.level || 2);
          return `${level} ${block.data.text}\n`;

        case 'paragraph':
          return `${block.data.text}\n`;

        case 'list':
          const marker = block.data.style === 'ordered' ? '1.' : '-';
          return block.data.items.map((item, i) => {
            const num = block.data.style === 'ordered' ? `${i + 1}.` : marker;
            return `${num} ${item}`;
          }).join('\n') + '\n';

        case 'checklist':
          return block.data.items.map(item => {
            const checked = item.checked ? '[x]' : '[ ]';
            return `- ${checked} ${item.text}`;
          }).join('\n') + '\n';

        case 'quote':
          let quote = `> ${block.data.text}\n`;
          if (block.data.caption) {
            quote += `>\n> — ${block.data.caption}\n`;
          }
          return quote;

        case 'code':
          return `\`\`\`\n${block.data.code}\n\`\`\`\n`;

        case 'delimiter':
          return `---\n`;

        case 'raw':
          return `${block.data.html}\n`;

        case 'table':
          if (!block.data.content || block.data.content.length === 0) return '';
          
          let table = '';
          block.data.content.forEach((row, i) => {
            table += '| ' + row.join(' | ') + ' |\n';
            if (i === 0) {
              table += '| ' + row.map(() => '---').join(' | ') + ' |\n';
            }
          });
          return table + '\n';

        case 'warning':
          return `> ⚠️ **${block.data.title}**\n>\n> ${block.data.message}\n`;

        case 'linkTool':
          const title = block.data.meta?.title || block.data.link;
          return `[${title}](${block.data.link})\n`;

        case 'image':
          let imgMd = `![${block.data.caption || 'Image'}](${block.data.file.url})`;
          if (block.data.caption) {
            imgMd += `\n*${block.data.caption}*`;
          }
          return imgMd + '\n';

        case 'embed':
          return `[Embedded ${block.data.service}: ${block.data.caption || 'Content'}](${block.data.embed})\n`;

        case 'attaches':
          return `[📎 ${block.data.file.name}](${block.data.file.url})\n`;

        default:
          return '';
      }
    }).join('\n');
  }

  setupEventListeners() {
    // Tab switching
    const tabs = this.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Copy button
    const copyBtn = this.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.copyToClipboard();
      });
    }

    // Make editor clickable
    const editorEl = this.querySelector('#editorjs');
    if (editorEl) {
      editorEl.addEventListener('click', (e) => {
        if (this.editorReady && e.target.id === 'editorjs') {
          const blocks = editorEl.querySelectorAll('.ce-block');
          if (blocks.length > 0) {
            blocks[blocks.length - 1].click();
          }
        }
      });
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    const tabs = this.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update tab content
    const contents = this.querySelectorAll('.tab-content');
    contents.forEach(content => {
      if (content.id === `${tabName}-tab`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Update markdown when switching to output
    if (tabName === 'output') {
      this.updateMarkdownOutput();
    }
  }

  async copyToClipboard() {
    const outputElement = this.querySelector('#markdown-output');
    const copyBtn = this.querySelector('.copy-btn');
    
    if (!outputElement || !copyBtn) return;
    
    try {
      const text = outputElement.textContent;
      
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      // Visual feedback
      const originalHTML = copyBtn.innerHTML;
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = originalHTML;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Copy failed. Please try selecting and copying manually.');
    }
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(async () => {
      if (this.editor && this.editorReady) {
        try {
          const data = await this.editor.save();
          this.saveToStorage(data);
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }
    }, 20000); // 20 seconds
  }

  saveToStorage(data) {
    try {
      localStorage.setItem('editorjs-content', JSON.stringify(data));
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('editorjs-content');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Storage load error:', error);
      return null;
    }
  }
}

customElements.define('rich-content-editor', RichContentEditor);
