# ⏱️ Time Sync - Accurate NTP Clock

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Chromium](https://img.shields.io/badge/platform-Chromium-1192D4?logo=chromium&logoColor=white)
![Chrome](https://img.shields.io/badge/platform-Chrome-4285F4?logo=googlechrome&logoColor=white)
![Edge](https://img.shields.io/badge/platform-Edge-0078D7?logo=microsoftedge&logoColor=white)
![Brave](https://img.shields.io/badge/platform-Brave-FB542B?logo=brave&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> **Validasi waktu yang presisi untuk setiap tangkapan layar Anda.**

Sering ragu apakah _timestamp_ di _screenshot_ Anda sudah valid? **Time Sync** adalah ekstensi Chromium base (Chrome, Edge, Brave) ringan yang menyinkronkan waktu lokal komputer Anda dengan server NTP (_Network Time Protocol_) global secara _real-time_.

Alat ini sangat cocok digunakan untuk memastikan keabsahan waktu pada dokumentasi laporan administratif investigasi OSINT (_Open-Source Intelligence_), forensik digital, atau sekadar pengujian sistem yang sensitif terhadap waktu.

---

## ✨ Fitur Unggulan

- 🌍 **Multi-Server Public API:** Mengambil data waktu dengan presisi tinggi dari _provider_ tepercaya.
- 📌 **Floating Window (Detach mode):** Lepas panel ekstensi menjadi jendela melayang yang praktis. Sangat mudah disandingkan di pojok layar saat Anda bersiap mengambil _screenshot_.
- 🔒 **Smart Resize Lock:** Jendela _floating_ akan selalu mengunci pada ukuran proporsional yang rapi. Tidak perlu khawatir jendela tidak sengaja membesar atau merusak estetika _screenshot_.
- ⚡ **Cerdas Membaca Latensi:** Dilengkapi dengan indikator warna (_diff_) yang menoleransi _Round-Trip Time_ (RTT) jaringan internet Anda.

---

## 🌐 Panduan Instalasi untuk Google Chrome (dan Chromium)

Untuk pengguna Google Chrome, Microsoft Edge, atau Brave, kami sangat menyarankan untuk menginstal langsung melalui toko resmi Chrome Web Store agar selalu mendapatkan pembaruan otomatis dan lebih aman. Namun, kami juga menyediakan opsi instalasi manual.

### Opsi A: Instalasi via Chrome Web Store (Rekomendasi)

Ini adalah cara termudah dan paling aman.

1. Buka halaman resmi Time Sync Pro di Chrome Web Store:  
   👉 **[Install Time Sync Pro dari Chrome Web Store](https://chromewebstore.google.com/detail/fambmhachpjgnjjppcjgooodpjekejip?utm_source=item-share-cb)**
2. Klik tombol biru **"Add to Chrome"** (atau Tambahkan ke Chrome).
3. Klik **"Add extension"** pada _pop-up_ persetujuan yang muncul. Selesai! 🎉

### Opsi B: Instalasi Manual via Developer Mode (Source Code)

Gunakan cara ini jika Anda ingin menguji versi _development_ secara manual dari GitHub.

1. **Unduh File:** Download _source code_ (file `.zip`) dari menu **Code -> Download ZIP** di repositori ini, lalu ekstrak ke dalam sebuah folder di komputer Anda.
2. **Buka Halaman Ekstensi:** Buka browser Chrome Anda, ketik `chrome://extensions/` di _address bar_, lalu tekan Enter.
3. **Aktifkan Mode Pengembang:** Perhatikan di pojok kanan atas layar, nyalakan sakelar **"Developer mode"** (Mode Pengembang).
4. **Muat Ekstensi:** Akan muncul menu baru di kiri atas. Klik tombol **"Load unpacked"**, lalu cari dan pilih folder hasil ekstrak tadi. Selesai! 🎉

---

## 📖 Panduan Penggunaan

1. **Buka Ekstensi:** Klik ikon **Time Sync** di _toolbar_.
2. **Pantau Waktu:** Anda akan melihat **Server Time (UTC)** bersanding dengan **Local PC Time** (menyesuaikan zona waktu lokal Anda, misalnya GMT+7).
3. **Sinkronisasi:** Klik tombol **Sync Now** untuk menyamakan waktu secara manual, atau gunakan fitur **Auto Sync**.
4. **Mode Tangkapan Layar:** Klik **Detach** untuk mengubahnya menjadi jendela kecil melayang. Posisikan di dekat area yang ingin Anda potret.

---

## 🚦 Membaca Indikator Status

Jangan biarkan latensi internet merusak validasi Anda! Ekstensi ini memberi tahu Anda kapan waktu terbaik untuk mengambil _screenshot_:

- 🟢 **`● Synced Perfectly` (Selisih ≤ 0.5s):** Waktu sangat akurat. Kondisi paling ideal untuk dokumentasi.
- 🔵 **`● Acceptable` (Selisih 0.5s - 1.0s):** Waktu masih valid, selisih murni disebabkan oleh jeda jaringan.
- 🟠 **`● Time Late` (Selisih > 3.0s):** Ada _delay_ dari server. Sebaiknya klik _Sync Now_ sekali lagi sebelum mengambil gambar.

---

## ⚙️ Pengaturan Tambahan

Anda memegang kendali penuh. Masuk ke menu **Settings** untuk:

- Mengganti alamat server NTP secara manual
- Mengatur interval _Auto Sync_ (Minimal 10 detik).
- Mengaktifkan/menonaktifkan _Resize Lock_ (Izinkan _Fullscreen_).

---

_Dibuat untuk memastikan setiap detik dokumentasi Anda dapat dipertanggungjawabkan._
