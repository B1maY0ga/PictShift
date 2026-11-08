/**
 * PictShift - Controller Layer
 * Tanggung jawab: Menangani input dari View, memanggil Model, dan mengarahkan View
 * untuk memperbarui UI. Tidak langsung manipulasi DOM.
 */

import { ImageProcessor, MAX_FILE_SIZE } from './model.js';

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.allConverted = false;
    this.elementsControlsThumbnailSet = false;

    this._bindView();
  }

  _bindView() {
    // Drop zone & file picker
    this.view.onDropZoneDrop((files) => this._handleFilesAdded(files));
    this.view.onFileInputChange((files) => this._handleFilesAdded(files));
    this.view.onBrowseClick(() => {}); // Sudah ditangani oleh onFileInputChange via klik drop zone

    // Controls
    this.view.onFormatChange((format) => this._handleFormatChange(format));
    this.view.onExifChange((enabled) => this._handleExifChange(enabled));
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
        invalidFiles.push({ name: file.name, reason: 'Bukan file gambar.' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({ name: file.name, reason: 'Ukuran melebihi 10 MB.' });
        continue;
      }
      validFiles.push(file);
    }

    // Tambahkan file yang valid ke model
    const added = [];
    for (const file of validFiles) {
      const imageFile = this.model.addFile(file);
      added.push(imageFile);
    }

    // Reset conversion state saat ada file baru
    this.allConverted = false;
    this.view.setMainButtonMode('convert');

    // Tampilkan UI
    this.view.hideEmptyState();
    this.view.showControls();

    // Render thumbnail list sekali (tidak duplikat)
    this._renderThumbnailList();

    // Load preview untuk setiap file yang baru ditambahkan
    for (const imageFile of added) {
      try {
        await ImageProcessor.loadPreview(imageFile);
        // Re-render thumbnail list untuk menampilkan preview yang sudah dimuat
        this._renderThumbnailList();
      } catch (err) {
        imageFile.status = 'error';
        imageFile.error = err.message;
        this._renderThumbnailList();
      }
    }

    if (invalidFiles.length > 0) {
      this.view.showToast(
        `${invalidFiles.length} file dilewati: ${invalidFiles.map((f) => f.reason).join(', ')}`,
        'error'
      );
    }

    if (added.length > 0) {
      this.view.showToast(`${added.length} gambar ditambahkan.`);
    }
  }

  _handleRemove(fileId) {
    const file = this._findFileById(fileId);
    if (!file) return;

    // Revoke URL untuk membersihkan memori
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
    this.view.showToast('Gambar dihapus.');
  }

  _handleFormatChange(format) {
    this.model.setTargetFormat(format);
    this.allConverted = false;
    this.view.setMainButtonMode('convert');
    this._renderThumbnailList(); // Update conversion status (JPG → PNG etc.)
  }

  _handleExifChange(enabled) {
    this.model.setExifCleaner(enabled);
  }

  async _handleMainButtonClick() {
    if (this.allConverted) {
      // Download Now: download semua yang berhasil dikonversi
      const doneFiles = this.model.files.filter((f) => f.status === 'done');
      if (doneFiles.length === 0) {
        this.view.showToast('Tidak ada file yang berhasil dikonversi.', 'error');
        return;
      }
      if (doneFiles.length === 1) {
        ImageProcessor.download(doneFiles[0]);
        this.view.showToast(`Mengunduh ${doneFiles[0].name}`);
      } else {
        doneFiles.forEach((f) => ImageProcessor.download(f));
        this.view.showToast(`Mengunduh ${doneFiles.length} file`);
      }
      return;
    }

    // Convert Now: mulai konversi
    await this._handleConvertAll();
  }

  async _handleConvertAll() {
    const filesToConvert = this.model.files.filter((f) => f.status === 'idle' || f.status === 'error');
    if (filesToConvert.length === 0) {
      this.view.showToast('Tidak ada gambar untuk dikonversi.', 'error');
      return;
    }

    this.view.setConvertButtonLoading(true);
    this.model.isConverting = true;

    let successCount = 0;
    let errorCount = 0;

    for (const file of filesToConvert) {
      try {
        await ImageProcessor.convert(file, this.model.targetFormat, this.model.exifCleaner);
        this.view.updateThumbnailItem(file.id, file);
        successCount++;
      } catch (err) {
        this.view.updateThumbnailItem(file.id, file);
        errorCount++;
      }
    }

    this.model.isConverting = false;
    this.view.setConvertButtonLoading(false);

    // Jika ada yang berhasil, ubah tombol ke Download Now
    if (successCount > 0) {
      this.allConverted = true;
      this.view.setMainButtonMode('download');
      if (errorCount === 0) {
        this.view.showToast(`${successCount} gambar berhasil dikonversi.`, 'success');
      } else {
        this.view.showToast(`${successCount} sukses, ${errorCount} gagal.`, 'error');
      }
    } else {
      this.allConverted = false;
      this.view.setMainButtonMode('convert');
      this.view.showToast('Semua konversi gagal.', 'error');
    }
  }

  _handleClearAll() {
    const confirmed = confirm('Yakin ingin menghapus semua gambar dan hasil konversi?');
    if (!confirmed) return;

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
    this.view.showToast('Semua gambar dihapus.');
  }

  _handleDownload(fileId) {
    const file = this._findFileById(fileId);
    if (!file || file.status !== 'done') return;

    ImageProcessor.download(file);
    this.view.showToast(`Mengunduh ${file.name}`);
  }

  async _convertSingle(fileId) {
    const file = this._findFileById(fileId);
    if (!file) return;

    this.view.updateThumbnailItem(fileId, file);
    try {
      await ImageProcessor.convert(file, this.model.targetFormat, this.model.exifCleaner);
      this.view.updateThumbnailItem(fileId, file);
      this.view.showToast(`${file.name} berhasil dikonversi.`, 'success');
    } catch (err) {
      this.view.updateThumbnailItem(fileId, file);
      this.view.showToast(`Gagal mengonversi ${file.name}.`, 'error');
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