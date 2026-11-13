/**
 * PictShift - Controller Layer
 * Responsibility: Handling input from View, calling Model, and directing View
 * to update UI. Does not directly manipulate DOM.
 */

import { ImageProcessor, MAX_FILE_SIZE } from './model.js';

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.allConverted = false;

    this._bindView();
  }

  _bindView() {
    // Drop zone & file picker
    this.view.onDropZoneDrop((files) => this._handleFilesAdded(files));
    this.view.onFileInputChange((files) => this._handleFilesAdded(files));
    this.view.onBrowseClick(() => {}); // Already handled by onFileInputChange via drop zone click

    // Controls
    this.view.onFormatChange((format) => this._handleFormatChange(format));
    this.view.onConvertClick(() => this._handleMainButtonClick());
    this.view.onClearAllClick(() => this._handleClearAll());
  }

  // ---------- Helper ----------

  _findFileById(id) {
    return this.model.findById(id);
  }

  _renderThumbnailList() {
    this.view.clearThumbnailList();
    this.view.renderThumbnailList(this.model.files, {
      onRemove: (fileId) => this._handleRemove(fileId),
      onDownload: (fileId) => this._handleDownload(fileId),
      onConvert: (fileId) => this._convertSingle(fileId),
      onRetry: (fileId) => this._retrySingle(fileId),
    }, this.model.targetFormat);
  }

  // ---------- Event handlers ----------

  async _handleFilesAdded(files) {
    if (files.length === 0) return;

    const validFiles = [];
    const invalidFiles = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push({ name: file.name, reason: 'Not an image file.' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({ name: file.name, reason: 'File size exceeds 10 MB.' });
        continue;
      }
      validFiles.push(file);
    }

    // Add valid files to model
    const added = [];
    for (const file of validFiles) {
      const imageFile = this.model.addFile(file);
      added.push(imageFile);
    }

    // Reset conversion state when new file is added
    this.allConverted = false;
    this.view.setMainButtonMode('convert');

    // Show UI
    this.view.hideEmptyState();
    this.view.showControls();

    // Render thumbnail list once (no duplicates)
    this._renderThumbnailList();

    // Load preview for each newly added file
    for (const imageFile of added) {
      try {
        await ImageProcessor.loadPreview(imageFile);
        // Re-render thumbnail list to display loaded preview
        this._renderThumbnailList();
      } catch (err) {
        imageFile.status = 'error';
        imageFile.error = err.message;
        this._renderThumbnailList();
      }
    }

    if (invalidFiles.length > 0) {
      this.view.showToast(
        `${invalidFiles.length} files skipped: ${invalidFiles.map((f) => f.reason).join(', ')}`,
        'error'
      );
    }

    if (added.length > 0) {
      this.view.showToast(`${added.length} images added.`);
    }
  }

  _handleRemove(fileId) {
    const file = this._findFileById(fileId);
    if (!file) return;

    // Revoke URL to clean up memory
    if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    if (file.convertedUrl) URL.revokeObjectURL(file.convertedUrl);

    this.model.removeFile(fileId);

    if (this.model.files.length === 0) {
      this.allConverted = false;
      this.view.setMainButtonMode('convert');
      this.view.hideControls();
      this.view.showEmptyState();
      this.view.clearThumbnailList();
      return;
    }

    this._renderThumbnailList();
    this.view.showToast('Image deleted.');
  }

  _handleFormatChange(format) {
    this.model.setTargetFormat(format);
    this.allConverted = false;
    this.view.setMainButtonMode('convert');
    this._renderThumbnailList(); // Update conversion status (JPG → PNG etc.)
  }

  async _handleMainButtonClick() {
    if (this.allConverted) {
      // Download Now: download semua yang berhasil dikonversi
      const doneFiles = this.model.files.filter((f) => f.status === 'done');
      if (doneFiles.length === 0) {
        this.view.showToast('No files successfully converted.', 'error');
        return;
      }
      if (doneFiles.length === 1) {
        ImageProcessor.download(doneFiles[0]);
        this.view.showToast(`Downloading ${doneFiles[0].name}`);
      } else {
        doneFiles.forEach((f) => ImageProcessor.download(f));
        this.view.showToast(`Downloading ${doneFiles.length} files`);
      }
      return;
    }

    // Convert Now: start conversion
    await this._handleConvertAll();
  }

  async _handleConvertAll() {
    const filesToConvert = this.model.files.filter((f) => f.status === 'idle' || f.status === 'error');
    if (filesToConvert.length === 0) {
      this.view.showToast('No images to convert.', 'error');
      return;
    }

    this.view.setConvertButtonLoading(true);
    this.model.isConverting = true;

    let successCount = 0;
    let errorCount = 0;

    for (const file of filesToConvert) {
      try {
        await ImageProcessor.convert(file, this.model.targetFormat);
        this.view.updateThumbnailItem(file.id, file);
        successCount++;
      } catch (err) {
        this.view.updateThumbnailItem(file.id, file);
        errorCount++;
      }
    }

    this.model.isConverting = false;
    this.view.setConvertButtonLoading(false);

    // If any succeeded, change button to Download Now
    if (successCount > 0) {
      this.allConverted = true;
      this.view.setMainButtonMode('download');
      if (errorCount === 0) {
        this.view.showToast(`${successCount} images successfully converted.`, 'success');
      } else {
        this.view.showToast(`${successCount} success, ${errorCount} failed.`, 'error');
      }
    } else {
      this.allConverted = false;
      this.view.setMainButtonMode('convert');
      this.view.showToast('All conversions failed.', 'error');
    }
  }

  _handleClearAll() {
    // Revoke semua URL
    this.model.files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });

    this.allConverted = false;
    this.view.setMainButtonMode('convert');

    this.model.clearFiles();
    this.view.clearThumbnailList();
    this.view.hideControls();
    this.view.showEmptyState();
    this.view.showToast('All images deleted.');
  }

  _handleDownload(fileId) {
    const file = this._findFileById(fileId);
    if (!file || file.status !== 'done') return;

    ImageProcessor.download(file);
    this.view.showToast(`Downloading ${file.name}`);
  }

  async _convertSingle(fileId) {
    const file = this._findFileById(fileId);
    if (!file) return;

    this.view.updateThumbnailItem(fileId, file);
    try {
      await ImageProcessor.convert(file, this.model.targetFormat);
      this.view.updateThumbnailItem(fileId, file);
      this.view.showToast(`${file.name} successfully converted.`, 'success');
    } catch (err) {
      this.view.updateThumbnailItem(fileId, file);
      this.view.showToast(`Failed to convert ${file.name}.`, 'error');
    }
  }

  async _retrySingle(fileId) {
    const file = this._findFileById(fileId);
    if (!file) return;
    file.status = 'idle';
    file.error = null;
    this.view.updateThumbnailItem(fileId, file);
    await this._convertSingle(fileId);
  }
}

export { Controller };