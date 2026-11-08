# Product Requirements Document (PRD)

## Project: Web-Based Client-Side Image Converter \& EXIF Cleaner

\---

## 1\. Overview \& Project Goals

Aplikasi web utilitas berbasis *browser* yang memungkinkan pengguna untuk mengonversi format gambar, mengubah ukuran (*resizing*), dan membersihkan metadata (*EXIF data*) secara instan, aman, dan tanpa mengirimkan file ke server pihak ketiga.

### Core Value Proposition:

* **Privacy-First:** Semua pemrosesan terjadi di perangkat pengguna (*client-side* menggunakan HTML5 Canvas).
* **Lightning Fast:** Tidak memerlukan proses *upload* dan *download* server yang memakan waktu.
* **User-Friendly:** Dilengkapi fitur *Auto-Detect/Convert* dan opsi pembersih metadata yang fleksibel.

\---

## 2\. Tech Stack

* **Markup \& Structure:** HTML5 (Canvas API, FileReader API)
* **Styling:** Tailwind CSS (via CDN) untuk UI modern \& *Dark Mode*
* **Core Logic:** Vanilla JavaScript (ES6+)
* **Deployment:** GitHub Pages / Vercel

\---

## 3\. Target User

* Developer, desainer, atau pengguna umum yang ingin mengompres, mengubah format (*WebP/JPEG/PNG*), dan membersihkan data lokasi/GPS dari foto pribadi sebelum dibagikan ke publik.

\---

## 4\. Minimum Viable Product (MVP) Scope

Untuk versi awal (MVP), fokus utama adalah membangun fungsi inti yang stabil dan dapat langsung digunakan tanpa fitur yang terlalu rumit.

### Fitur MVP:

1. **Drag \& Drop / File Picker:** Area interaktif untuk memilih atau menyeret file gambar ke browser.
2. **Auto-Format \& Target Selection:** Pengguna dapat memilih format target akhir (`WebP`, `JPEG`, `PNG`), dan sistem secara otomatis mengonversi gambar dari format aslinya.
3. **Optional EXIF Cleaner (Checkbox):** Kotak centang (*checkbox*) interaktif untuk opsi penghapusan metadata dengan status aktif (tercentang) secara default, lengkap dengan keterangan kecil *"Hapus metadata untuk privasi"* di sebelah atau di bawahnya agar pengguna memiliki kontrol penuh.
4. **Instant Preview \& Download:** Menampilkan hasil konversi berupa *thumbnail* kecil lengkap dengan tombol *Download* satuan.

\---

## 5\. User Flow (Alur Pengguna)

1. Pengguna membuka halaman web.
2. Pengguna menyeret (*drag*) atau memilih file gambar dari perangkat.
3. Sistem mendeteksi file dan menampilkan daftar *preview* gambar.
4. Pengguna memilih format target konversi (misal: diubah ke `.webp`) dan dapat melihat/menyesuaikan centang pada opsi *Hapus Metadata* (aktif secara default).
5. Pengguna menekan tombol **"Convert Now"**.
6. Sistem memproses gambar secara lokal di browser (membersihkan EXIF jika opsi dicentang \& menyesuaikan format).
7. Tombol *Download* aktif, dan pengguna dapat langsung mengunduh hasil gambar tersebut.

\---

## 6\. Future Enhancements (Post-MVP)

* Fitur *Batch Processing* (Multi-file upload sekaligus).
* Tombol *Download All as ZIP* menggunakan library JSZip.
* *Slider* pengatur tingkat kualitas kompresi (Quality percentage 10% - 100%).
* Custom *Image Resizing* (mengatur dimensi piksel lebar/tinggi kustom).


7\. Referensi Desain

TinyPNG (tinypng.com)
Kenapa ini bagus: Standar industri untuk web kompresi dan utilitas berbasis browser. Desainnya sangat minimalis, ilustrasi maskot panda-nya pas tidak berlebihan, area drop zone sangat jelas, dan tidak ada gangguan iklan atau pop-up yang mengganggu.

Squoosh (squoosh.app)
Kenapa ini bagus: Aplikasi web open-source buatan Google Chrome Labs untuk kompresi dan konversi gambar lokal (client-side). Layoutnya menggunakan sistem geser (slider split-view preview aslinya vs hasil kompresi) yang sangat canggih tapi tetap bersih dan profesional. Cocok banget buat referensi layout halaman hasil konversi.

Convertio (convertio.co)
Kenapa ini bagus: Contoh web converter multiguna yang menempatkan tombol Choose Files dengan ukuran besar dan kontras tinggi di tengah layar. Navigasinya to the point, pilihan format berbentuk dropdown yang rapi, dan minim kekacauan visual.

ILoveIMG (iloveimg.com)
Kenapa ini bagus: Mengusung desain berbasis card grid untuk setiap fitur alatnya (Resize, Compress, Convert). Penataan tata letak tombol aksi utama (Call to Action) sangat konsisten, menggunakan warna aksen tunggal yang tegas tanpa bikin mata pusing.

