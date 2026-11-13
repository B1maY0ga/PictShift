/**
 * PictShift - Model Layer
 * Responsibility: Data, application state, and image conversion logic (Canvas API).
 * Does not touch DOM at all.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_CANVAS_DIMENSION = 4096; // Batasi agar aman di semua browser

/**
 * Represents one image file being processed.
 */
class ImageFile {
  constructor(file) {
    this.file = file;
    this.id = crypto.randomUUID();
    this.name = file.name;
    this.size = file.size;
    this.type = file.type;
    this.originalFormat = this._detectFormat(file.type);
    this.previewUrl = null;
    this.status = 'idle'; // idle | converting | done | error
    this.error = null;

    // Hasil konversi
    this.blob = null;
    this.convertedUrl = null;
    this.convertedType = null;
    this.convertedSize = null;
    this.originalDimensions = { width: 0, height: 0 };
  }

  _detectFormat(mimeType) {
    const map = {
      'image/jpeg': 'JPG',
      'image/jpg': 'JPG',
      'image/png': 'PNG',
      'image/webp': 'WEBP',
      'image/gif': 'GIF',
      'image/bmp': 'BMP',
    };
    return map[mimeType] || mimeType.toUpperCase().replace('IMAGE/', '');
  }
}

/**
 * Global application state.
 */
class AppState {
  constructor() {
    this.files = [];
    this.targetFormat = 'image/webp';
    this.isConverting = false;
  }

  addFile(file) {
    const imageFile = new ImageFile(file);
    this.files.push(imageFile);
    return imageFile;
  }

  removeFile(id) {
    const index = this.files.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.files.splice(index, 1);
    }
  }

  findById(id) {
    return this.files.find((f) => f.id === id);
  }

  clearFiles() {
    this.files = [];
  }

  setTargetFormat(format) {
    this.targetFormat = format;
  }

  get filesByStatus() {
    const grouped = { idle: [], converting: [], done: [], error: [] };
    this.files.forEach((f) => grouped[f.status].push(f));
    return grouped;
  }

  get doneCount() {
    return this.files.filter((f) => f.status === 'done').length;
  }

  get errorCount() {
    return this.files.filter((f) => f.status === 'error').length;
  }
}

/**
 * Core conversion & EXIF cleaning logic using HTML5 Canvas.
 * Technique: drawImage + toBlob -> browser natively removes EXIF metadata
 * during re-encode through canvas. No external library needed.
 */
class ImageProcessor {
  /**
   * Membaca file dan membuat preview URL (thumbnail asli).
   * @param {ImageFile} imageFile
   * @returns {Promise<void>}
   */
  static async loadPreview(imageFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          imageFile.originalDimensions = { width: img.naturalWidth, height: img.naturalHeight };
          imageFile.previewUrl = e.target.result;
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image for preview.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(imageFile.file);
    });
  }

  /**
   * Konversi satu gambar: membersihkan EXIF (secara otomatis via canvas re-encode)
   * dan mengubah format. EXIF selalu dihapus karena HTML5 Canvas tidak menyalin
   * metadata saat drawImage + toBlob.
   * @param {ImageFile} imageFile
   * @param {string} targetFormat MIME type (image/webp, image/jpeg, image/png)
   * @returns {Promise<void>}
   */
  static async convert(imageFile, targetFormat) {
    imageFile.status = 'converting';

    try {
      // Baca file sebagai data URL untuk diproses oleh Image
      const dataUrl = await this._fileToDataURL(imageFile.file);

      const img = await this._loadImage(dataUrl);

      // Skala jika terlalu besar agar aman di canvas
      const { width, height } = this._fitDimensions(img.naturalWidth, img.naturalHeight);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      // drawImage natively does not copy EXIF metadata to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // toBlob produces a new image without EXIF
      const blob = await this._canvasToBlob(canvas, targetFormat);

      imageFile.blob = blob;
      imageFile.convertedUrl = URL.createObjectURL(blob);
      imageFile.convertedType = targetFormat;
      imageFile.convertedSize = blob.size;
      imageFile.status = 'done';
    } catch (err) {
      imageFile.status = 'error';
      imageFile.error = err.message || 'Failed to convert image.';
      throw err;
    }
  }

  /**
   * Unduh hasil konversi dan bersihkan blob URL dari memori.
   */
  static download(imageFile) {
    if (!imageFile.convertedUrl) return;

    const link = document.createElement('a');
    link.href = imageFile.convertedUrl;
    link.download = this._generateDownloadName(imageFile.name, imageFile.convertedType);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Bersihkan memori setelah unduhan
    setTimeout(() => {
      URL.revokeObjectURL(imageFile.convertedUrl);
      imageFile.convertedUrl = null;
    }, 100);
  }

  // ---------- Private helpers ----------

  static _fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  }

  static _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = src;
    });
  }

  static _fitDimensions(width, height) {
    if (width <= MAX_CANVAS_DIMENSION && height <= MAX_CANVAS_DIMENSION) {
      return { width, height };
    }
    const scale = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  }

  static _canvasToBlob(canvas, targetFormat) {
    return new Promise((resolve, reject) => {
      // Kualitas encoding disesuaikan agar output file tetap kecil tanpa mengorbankan kualitas visual.
      // WebP umumnya lebih efisien dari JPEG/PNG, namun untuk gambar kecil atau dengan sedikit warna,
      // ukuran WebP kadang tidak berubah jauh atau sedikit lebih besar dari aslinya.
      // Menggunakan kualitas 0.85 untuk WebP dan 0.90 untuk JPEG menghasilkan file yang lebih kecil
      // sambil tetap mempertahankan kualitas yang baik untuk penggunaan umum.
      const quality = targetFormat === 'image/png' ? undefined :
                      targetFormat === 'image/webp' ? 0.85 : 0.90;
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error('Failed to generate blob.'));
          else resolve(blob);
        },
        targetFormat,
        quality
      );
    });
  }

  static _generateDownloadName(originalName, mimeType) {
    const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const base = originalName.replace(/\.[^/.]+$/, ''); // hapus ekstensi lama
    return `${base}_converted.${ext}`;
  }
}

export { ImageFile, AppState, ImageProcessor, MAX_FILE_SIZE };