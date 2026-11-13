/**
 * PictShift - View Layer
 * Responsibility: Rendering UI, DOM manipulation, and capturing user input.
 * Must not contain conversion logic or business state.
 */

const SELECTORS = {
  dropZone: '#dropZone',
  fileInput: '#fileInput',
  browseBtn: '#browseBtn',
  controls: '#controls',
  thumbnailList: '#thumbnailList',
  formatSelect: '#formatSelect',
  convertBtn: '#convertBtn',
  emptyState: '#emptyState',
  clearAllBtn: '#clearAllBtn',
  toast: '#toast',
  toastMessage: '#toastMessage',
  themeToggle: '#themeToggle',
  themeIconSun: '#themeIconSun',
  themeIconMoon: '#themeIconMoon',
};

class View {
  constructor() {
    this.elements = {};
    this.toastTimeout = null;
    this._cacheElements();
    this._bindGlobalEvents();
  }

  _cacheElements() {
    Object.entries(SELECTORS).forEach(([key, selector]) => {
      const el = document.querySelector(selector);
      if (!el) {
        console.warn(`View: element "${selector}" not found.`);
      }
      this.elements[key] = el;
    });
  }

  _bindGlobalEvents() {
    // Dark mode toggle
    const themeToggle = this.elements.themeToggle;
    if (themeToggle) {
      const applyTheme = (isDark) => {
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        const sun = this.elements.themeIconSun;
        const moon = this.elements.themeIconMoon;
        if (sun) sun.classList.toggle('hidden', isDark);
        if (moon) moon.classList.toggle('hidden', !isDark);
        localStorage.setItem('pictshift-theme', isDark ? 'dark' : 'light');
      };

      themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(!isDark);
      });

      // Initialize theme from localStorage / system
      const saved = localStorage.getItem('pictshift-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = saved ? saved === 'dark' : prefersDark;
      applyTheme(shouldBeDark);
    }
  }

  // ---------- Drop zone & file input ----------

  onDropZoneDrop(handler) {
    const dz = this.elements.dropZone;
    if (!dz) return;
    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('drag-over');
      const overlay = dz.querySelector('#drag-over-overlay');
      if (overlay) overlay.style.opacity = '1';
    });
    dz.addEventListener('dragleave', (e) => {
      // Only remove drag-over if leaving the drop zone entirely
      if (e.relatedTarget === null || !dz.contains(e.relatedTarget)) {
        dz.classList.remove('drag-over');
        const overlay = dz.querySelector('#drag-over-overlay');
        if (overlay) overlay.style.opacity = '0';
      }
    });
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      const overlay = dz.querySelector('#drag-over-overlay');
      if (overlay) overlay.style.opacity = '0';
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      handler(files);
    });
    dz.addEventListener('click', () => {
      const input = this.elements.fileInput;
      if (input) input.click();
    });
  }

  onFileInputChange(handler) {
    const input = this.elements.fileInput;
    if (!input) return;
    input.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      handler(files);
      input.value = ''; // reset agar file yang sama bisa dipilih lagi
    });
  }

  onBrowseClick(handler) {
    const btn = this.elements.browseBtn;
    if (btn) btn.addEventListener('click', () => {
      const input = this.elements.fileInput;
      if (input) input.click();
    });
  }

  // ---------- Controls ----------

  onFormatChange(handler) {
    const sel = this.elements.formatSelect;
    if (sel) sel.addEventListener('change', (e) => handler(e.target.value));
  }

  onConvertClick(handler) {
    const btn = this.elements.convertBtn;
    if (btn) btn.addEventListener('click', handler);
  }

  onClearAllClick(handler) {
    const btn = this.elements.clearAllBtn;
    if (btn) btn.addEventListener('click', handler);
  }

  // ---------- UI State ----------

  showControls() {
    const el = this.elements.controls;
    if (el) el.classList.remove('hidden');
  }

  hideControls() {
    const el = this.elements.controls;
    if (el) el.classList.add('hidden');
  }

  showEmptyState() {
    const el = this.elements.emptyState;
    if (el) el.classList.remove('hidden');
  }

  hideEmptyState() {
    const el = this.elements.emptyState;
    if (el) el.classList.add('hidden');
  }

  setConvertButtonLoading(loading) {
    const btn = this.elements.convertBtn;
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      `;
    } else {
      btn.disabled = false;
      btn.innerHTML = `
        <span>Convert Now</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
      `;
    }
  }

  setMainButtonMode(mode) {
    const btn = this.elements.convertBtn;
    if (!btn) return;
    if (mode === 'download') {
      btn.disabled = false;
      btn.className = 'btn-primary w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2';
      btn.innerHTML = `
        <span>Download Now</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
      `;
    } else {
      btn.disabled = false;
      btn.className = 'btn-primary w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2';
      btn.innerHTML = `
        <span>Convert Now</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
      `;
    }
  }

  // ---------- Thumbnail List ----------

  clearThumbnailList() {
    const list = this.elements.thumbnailList;
    if (list) list.innerHTML = '';
  }

  /**
   * Render compact thumbnail list for all files.
   * @param {ImageFile[]} files
   * @param {Object} callbacks { onRemove, onDownload, onConvert, onRetry }
   * @param {string} targetFormat MIME type target (image/webp, image/jpeg, image/png)
   */
  renderThumbnailList(files, callbacks, targetFormat) {
    const list = this.elements.thumbnailList;
    if (!list) return;

    list.innerHTML = '';

    const targetFormatLabel = targetFormat === 'image/jpeg' ? 'JPEG' : targetFormat === 'image/png' ? 'PNG' : 'WebP';

    files.forEach((file) => {
      const item = document.createElement('div');
      item.className = 'flex items-start gap-4 min-w-[260px] ps-card p-3 shadow-sm';
      item.dataset.id = file.id;

      const statusLabel = (() => {
        const config = {
          idle: { text: 'text-gray-500 dark:text-gray-400', label: 'Ready' },
          converting: { text: 'text-emerald-500 dark:text-emerald-400', label: 'Processing...' },
          done: { text: 'text-emerald-500 dark:text-emerald-400', label: 'Done' },
          error: { text: 'text-red-500 dark:text-red-400', label: 'Error' },
        }[file.status] || config.idle;
        return `<span class="text-xs font-medium ${config.text}">${config.label}</span>`;
      })();

      item.innerHTML = `
        <div class="flex-shrink-0 w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center relative">
          ${file.previewUrl
            ? `<img src="${file.previewUrl}" alt="Thumbnail" class="w-full h-full object-cover">`
            : `<span class="text-xs text-gray-400">-</span>`
          }
          ${file.status === 'done' ? `<div class="absolute bottom-1 right-1 bg-emerald-600 text-white text-[10px] px-1 rounded">✓</div>` : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-2">
            <span class="text-lg font-bold leading-none ps-conversion-status">${file.originalFormat}</span>
            <span class="ps-conversion-status">→</span>
            <span class="text-lg font-bold leading-none ps-conversion-status">${targetFormatLabel}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium ps-card-text truncate">${this._escapeHtml(file.name)}</span>
            ${statusLabel}
          </div>
          <span class="text-xs ps-card-text-secondary">${this._formatFileSize(file.size)}</span>
        </div>
        <button class="text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1 shrink-0" aria-label="Delete" data-action="remove">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      `;

      // Wire events
      const removeBtn = item.querySelector('button[data-action="remove"]');
      if (removeBtn && callbacks.onRemove) {
        removeBtn.addEventListener('click', () => callbacks.onRemove(file.id));
      }

      list.appendChild(item);
    });
  }

  /**
   * Update a single thumbnail item status.
   */
  updateThumbnailItem(fileId, file) {
    const item = document.querySelector(`[data-id="${fileId}"]`);
    if (!item) return;

    const statusLabel = item.querySelector('span.text-xs.font-medium');
    if (statusLabel) {
      const config = {
        idle: { text: 'text-gray-500 dark:text-gray-400', label: 'Ready' },
        converting: { text: 'text-emerald-500 dark:text-emerald-400', label: 'Processing...' },
        done: { text: 'text-emerald-500 dark:text-emerald-400', label: 'Done' },
        error: { text: 'text-red-500 dark:text-red-400', label: 'Error' },
      }[file.status] || config.idle;
      statusLabel.className = `text-xs font-medium ${config.text}`;
      statusLabel.textContent = config.label;
    }

    // Add/remove done indicator
    const doneIndicator = item.querySelector('.absolute.bottom-1.right-1');
    if (file.status === 'done') {
      if (!doneIndicator) {
        const thumb = item.querySelector('.w-20.h-20');
        if (thumb) {
          const tag = document.createElement('div');
          tag.className = 'absolute bottom-1 right-1 bg-emerald-600 text-white text-[10px] px-1 rounded';
          tag.textContent = '✓';
          thumb.classList.add('relative');
          thumb.appendChild(tag);
        }
      }
    } else if (doneIndicator) {
      doneIndicator.remove();
    }
  }

  // ---------- Utils ----------

  _formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---------- Toast ----------

  showToast(message, type = 'info') {
    const toast = this.elements.toast;
    const msg = this.elements.toastMessage;
    if (!toast || !msg) return;

    // Clear previous timeout if exists
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    // Icon based on notification type
    const iconMap = {
      success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`,
      error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
      info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    };

    const bgMap = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-emerald-600 text-white',
    };

    const iconHtml = iconMap[type] || iconMap.info;
    const bgClass = bgMap[type] || bgMap.info;

    // Reset kelas toast secara penuh agar transition bekerja dengan benar
    toast.className = 'toast fixed bottom-5 right-5 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 transition-all duration-300 translate-y-0 opacity-100 ' + bgClass;

    // Fill content: icon + message
    toast.innerHTML = `
      <div class="flex-shrink-0">
        ${iconHtml}
      </div>
      <span class="font-medium">${this._escapeHtml(message)}</span>
    `;

    // Force reflow so transition class is applied before translate-y-0
    void toast.offsetWidth;

    // Auto-hide after 3 seconds
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
  }

  hideToast() {
    const toast = this.elements.toast;
    if (toast) {
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
        this.toastTimeout = null;
      }
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }
  }
}

export { View, SELECTORS };