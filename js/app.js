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

// Expose ke window untuk debugging (opsional, bisa dihapus)
window.__pictshift = { model, view, controller };