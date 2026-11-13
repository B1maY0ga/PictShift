/**
 * PictShift - Entry Point
 * Menginisialisasi Model, View, dan Controller, lalu menjalankan aplikasi.
 */

import { AppState } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';

// ES modules dijalankan setelah DOM siap (defer), jadi tidak perlu DOMContentLoaded
const model = new AppState();
const view = new View();
const controller = new Controller(model, view);

// Show empty state on initial load since there are no images yet
view.showEmptyState();

// Expose to window for debugging (optional, can be removed)
window.__pictshift = { model, view, controller };
