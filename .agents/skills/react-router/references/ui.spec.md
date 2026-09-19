# UI Spec — OCEAN Predictor

Aplikasi web untuk memprediksi kepribadian Big Five (OCEAN) dari video wajah dan suara pengguna.
Model (usulan): multi-frame aggregation + Swin Transformer untuk fitur wajah, fitur suara (mel-spectrogram/MFCC), lalu fusi fitur dan regresi 5 skor.

Dokumen ini adalah sumber kebenaran untuk implementasi UI. Wireframe visual ada di `docs/wireframe.drawio`.

## 1. Aturan umum untuk implementasi

- Pendekatan **mobile-first**: tulis gaya dasar untuk mobile, lalu perluas dengan `min-width` media query.
- Stack UI: **React Router v8 (framework mode) + TypeScript + shadcn/ui + Tailwind CSS**. Gunakan komponen shadcn/ui sebisa mungkin (lihat bagian 10), buat komponen kustom hanya bila tidak ada padanannya.
- **Tampilan bawaan shadcn/ui dimaksimalkan.** Class Tailwind hanya untuk _layouting_ (flex, grid, gap, padding/margin, lebar/tinggi, posisi, urutan, visibilitas responsif). Jangan menimpa tampilan dasar komponen (warna, radius, shadow, font, border) lewat `className`. Gunakan `variant` dan `size` bawaan, atau ubah token tema di `globals.css`.
- Warna dibatasi pada token **primary** dan **secondary** (lihat bagian 10).
- Semua teks UI dalam **Bahasa Indonesia**.
- Semua skor OCEAN berupa angka **0–1**, ditampilkan dengan 2 desimal.
- Kamera dan mikrofon **tidak boleh aktif** sebelum pengguna memberi persetujuan (consent).
- Hasil selalu disertai disclaimer: prediksi model penelitian, bukan diagnosis psikologis.

## 2. Breakpoint

| Nama    | Lebar      | Layout                                                                                                                     |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| Mobile  | ≤ 639px    | 1 kolom, bottom navigation, tombol utama full-width, accordion untuk konten sekunder                                       |
| Tablet  | 640–1023px | Navbar atas ringkas (hamburger), halaman Hasil 2 kolom, halaman Input tetap 1 kolom (maks. 560px)                          |
| Desktop | ≥ 1024px   | Navbar atas penuh, konten maks. 1200px, Input: pratinjau + panduan berdampingan, Hasil: bar + radar + interpretasi sejajar |

Aturan tambahan:

- Target sentuh minimal **44×44px** di mobile.
- Konten tidak boleh menyebabkan scroll horizontal di lebar berapa pun.
- Gunakan satuan relatif (`rem`, `%`, `fr`) dan `clamp()` untuk tipografi.

## 3. Navigasi

Item: **Beranda**, **Riwayat**, **Tentang**.

- Desktop/Tablet: navbar atas. Logo "◎ OCEAN Predictor" di kiri, menu di kanan.
- Mobile: top bar berisi hamburger dan logo, serta **bottom navigation** 3 item.
- Di layar Hasil (mobile), bottom navigation diganti **action bar sticky**: "Unduh PDF" dan "Simpan".

## 4. Alur layar

```
Input ──(Mulai Analisis)──▶ Proses ──(selesai)──▶ Hasil
  ▲                            │                    │
  └──────────(Batal)───────────┘                    └─(Analisis Ulang)──▶ Input
```

### Rute (usulan, React Router framework mode)

| Path               | Layar           |
| ------------------ | --------------- |
| `/`                | Input (Beranda) |
| `/analisis/:jobId` | Proses          |
| `/hasil/:id`       | Hasil           |
| `/riwayat`         | Riwayat         |
| `/tentang`         | Tentang         |

Ikuti konvensi route config, `loader`, dan `action` dari skill React Router yang tersedia di proyek.

## 5. Layar 1 — Input

**Tujuan:** pengguna merekam video atau mengunggah video, memberi persetujuan, lalu memulai analisis.

### Komponen

| Komponen        | Deskripsi                                                                                                              | Catatan                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Heading         | "Analisis Kepribadian dari Wajah & Suara"                                                                              | Mobile: "Analisis Kepribadian"                                           |
| Subjudul        | "Rekam langsung atau unggah video berdurasi 15–60 detik"                                                               | Hanya desktop/tablet                                                     |
| Tabs mode       | "Rekam Langsung" / "Unggah Video" (mobile: "Rekam" / "Unggah")                                                         | Default: Rekam                                                           |
| CameraPreview   | Pratinjau kamera dengan panduan oval wajah dan teks "Posisikan wajah di tengah"                                        | Hanya di mode Rekam                                                      |
| UploadDropzone  | Area seret-dan-lepas + tombol pilih file                                                                               | Hanya di mode Unggah                                                     |
| AudioLevelMeter | Indikator level suara real-time                                                                                        | Hanya di mode Rekam                                                      |
| ConsentCheckbox | "Saya setuju data wajah & suara diproses untuk penelitian"                                                             | Wajib dicentang                                                          |
| GuidePanel      | Daftar panduan: pencahayaan cukup, ruangan tenang, bicara 15–60 detik, wajah terlihat jelas, izinkan kamera & mikrofon | Desktop: panel samping. Mobile: accordion "ⓘ Panduan" (tertutup default) |
| PrimaryButton   | "Mulai Analisis ▶"                                                                                                     | Mobile: full-width, tinggi ≥ 48px                                        |
| PrivacyNote     | "Data hanya dipakai untuk penelitian dan dapat dihapus kapan saja."                                                    | Teks kecil di bawah                                                      |

### State

| State                | Kondisi                                             | Perilaku UI                                                                                    |
| -------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `idle`               | Belum ada video                                     | Tombol "Mulai Analisis" nonaktif                                                               |
| `permission-pending` | Meminta izin kamera/mikrofon                        | Tampilkan pesan singkat di area pratinjau                                                      |
| `permission-denied`  | Izin ditolak                                        | Tampilkan pesan error dan tombol "Coba lagi", sarankan beralih ke tab Unggah                   |
| `recording`          | Sedang merekam                                      | Timer berjalan, tombol berubah menjadi "Berhenti", level suara aktif                           |
| `ready`              | Video tersedia (rekam/unggah) dan consent dicentang | Tombol "Mulai Analisis" aktif                                                                  |
| `invalid-file`       | File tidak sesuai                                   | Tampilkan alasan: format tidak didukung, durasi di luar 15–60 detik, atau ukuran terlalu besar |

### Validasi

- Durasi video: 15–60 detik.
- Format yang diterima: `mp4`, `webm`, `mov`.
- Ukuran file maksimum: 100 MB (sesuaikan dengan kapasitas server).
- Tombol "Mulai Analisis" hanya aktif bila video valid **dan** consent dicentang.

## 6. Layar 2 — Proses

**Tujuan:** menampilkan progres analisis dan memberi kesempatan membatalkan.

### Tahapan (stepper)

| #   | Label                          | Keterangan                                    |
| --- | ------------------------------ | --------------------------------------------- |
| 1   | Ekstrak frame & audio          | Ambil N frame (default N = 16) dan trek audio |
| 2   | Multi-frame aggregation        | Gabungkan fitur antar-frame                   |
| 3   | Swin Transformer + fitur suara | Ekstraksi fitur wajah dan suara               |
| 4   | Fusi & prediksi OCEAN          | Gabungkan fitur, hitung 5 skor                |

Status tiap langkah dibedakan lewat ikon dan gaya, bukan warna tambahan: `done` (ikon ✔, latar `primary`), `active` (ikon ⏳, border `primary`, teks tebal), `pending` (latar `secondary`, teks redup).

### Komponen

| Komponen         | Deskripsi                                                  | Catatan                                                                            |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Heading          | "Memproses Data…"                                          |                                                                                    |
| Stepper          | 4 langkah                                                  | Desktop: horizontal 4 kolom. Tablet: grid 2×2. Mobile: vertikal                    |
| ProgressBar      | Persentase + label "58% — perkiraan sisa waktu ± 12 detik" | Beri `role="progressbar"` dengan `aria-valuenow`                                   |
| FramePreviewCard | "Frame terpilih (N = 16)", thumbnail frame                 | Desktop: tampil langsung. Mobile: di dalam accordion "▸ Lihat frame & spektrogram" |
| SpectrogramCard  | "Mel-spectrogram suara"                                    | Sama seperti di atas                                                               |
| CancelButton     | "Batal"                                                    | Selalu tersedia di semua tahap                                                     |

### State

`running`, `cancelled` (kembali ke Input), `failed` (tampilkan pesan error dan tombol "Coba lagi"), `completed` (otomatis pindah ke Hasil).

## 7. Layar 3 — Hasil

**Tujuan:** menampilkan 5 skor OCEAN dan interpretasinya.

### Komponen

| Komponen           | Deskripsi                                                                  | Catatan                                                                        |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Heading            | "Hasil Prediksi Big Five (OCEAN)"                                          | Mobile: "Hasil OCEAN"                                                          |
| TraitBars          | 5 baris: label, nilai 0.00–1.00, bar horizontal                            | Urutan: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism  |
| RadarChart         | Radar 5 sumbu OCEAN                                                        | Desktop/Tablet: di samping bar. Mobile: di atas bar, ukuran lebih kecil        |
| InterpretationCard | Ringkasan singkat, misalnya trait dengan skor tertinggi                    | Desktop: kartu terbuka. Mobile: accordion "▸ Interpretasi per trait & catatan" |
| Disclaimer         | "⚠ Hasil merupakan prediksi model penelitian, bukan diagnosis psikologis." | Selalu terlihat                                                                |
| Actions            | "Unduh PDF" (primer), "Analisis Ulang", "Simpan ke Riwayat"                | Mobile: action bar sticky berisi "Unduh PDF" dan "Simpan"                      |

### Perilaku

- Bar dan radar memakai nilai yang sama dari `OceanResult`.
- Tiap trait dapat dibuka untuk melihat deskripsi singkat tingkat rendah/sedang/tinggi.
- "Analisis Ulang" kembali ke layar Input dengan state `idle`.
- "Simpan ke Riwayat" menyimpan hasil dan menampilkan konfirmasi singkat (toast).

## 8. Model data (TypeScript)

```ts
type TraitKey =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism";

interface OceanScores {
  openness: number; // 0..1
  conscientiousness: number; // 0..1
  extraversion: number; // 0..1
  agreeableness: number; // 0..1
  neuroticism: number; // 0..1
}

interface OceanResult {
  id: string;
  createdAt: string; // ISO 8601
  scores: OceanScores;
  framesUsed: number; // mis. 16
  durationSeconds: number;
}

type PipelineStepStatus = "pending" | "active" | "done" | "failed";

interface PipelineStep {
  key: "extract" | "aggregate" | "encode" | "fuse";
  label: string;
  status: PipelineStepStatus;
}

interface JobStatus {
  jobId: string;
  state: "running" | "completed" | "failed" | "cancelled";
  progress: number; // 0..100
  etaSeconds?: number;
  steps: PipelineStep[];
  result?: OceanResult; // ada bila state = 'completed'
  error?: string;
}
```

## 9. Kontrak API (usulan)

| Method | Endpoint                      | Fungsi                                                                 |
| ------ | ----------------------------- | ---------------------------------------------------------------------- |
| POST   | `/api/analyses`               | Kirim video (multipart) dan `consent: true`, mengembalikan `{ jobId }` |
| GET    | `/api/analyses/:jobId`        | Ambil `JobStatus` (polling tiap 1–2 detik atau SSE)                    |
| DELETE | `/api/analyses/:jobId`        | Batalkan proses                                                        |
| GET    | `/api/results`                | Daftar riwayat hasil                                                   |
| GET    | `/api/results/:id`            | Detail satu hasil                                                      |
| DELETE | `/api/results/:id`            | Hapus hasil dan data terkait                                           |
| GET    | `/api/results/:id/report.pdf` | Unduh laporan PDF                                                      |

## 10. Tema visual (shadcn/ui)

Palet aksen dibatasi pada **dua warna: `primary` dan `secondary`**, diatur lewat CSS variable shadcn/ui di `globals.css`. Jangan menambah warna aksen lain (hijau, kuning, merah, ungu).

| Token                                | Pemakaian                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `primary` / `primary-foreground`     | Tombol utama, tab terpilih, bar skor OCEAN, garis dan isi radar, progress bar, langkah `done` dan `active` |
| `secondary` / `secondary-foreground` | Tombol sekunder, tab tidak terpilih, kartu panduan dan interpretasi, langkah `pending`, track (latar) bar  |

Aturan:

- Token netral bawaan shadcn (`background`, `foreground`, `border`, `muted`) tetap dipakai untuk latar, teks, dan garis. Ini bukan warna aksen.
- Status (berhasil, sedang berjalan, menunggu, error) dibedakan lewat **ikon, teks, ketebalan font, dan variasi opasitas**, bukan lewat warna baru.
- Warna di wireframe (biru, hijau, kuning, merah muda, ungu) hanya untuk membedakan area di diagram. Abaikan saat implementasi.
- Pastikan kontras `primary` terhadap `primary-foreground` dan `secondary` terhadap `secondary-foreground` memenuhi WCAG AA.
- Dukungan dark mode cukup dengan mengatur ulang variabel `primary` dan `secondary` di `.dark`.
- Untuk komponen kustom (Stepper, UploadDropzone, CameraPreview, AudioLevelMeter, bottom navigation), gunakan token tema (`bg-primary`, `bg-secondary`, `text-muted-foreground`, `border`), bukan warna mentah.

### Pemetaan komponen ke shadcn/ui

| Komponen di spec                             | shadcn/ui                                | Catatan                                    |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| Tabs mode                                    | `Tabs`                                   |                                            |
| ConsentCheckbox                              | `Checkbox` + `Label`                     |                                            |
| GuidePanel                                   | `Card` (desktop), `Accordion` (mobile)   | Ganti tampilan dengan breakpoint           |
| PrimaryButton                                | `Button` (default)                       | Mobile: `w-full`, tinggi ≥ 48px            |
| Tombol sekunder ("Analisis Ulang", "Simpan") | `Button variant="secondary"`             |                                            |
| CancelButton ("Batal")                       | `Button variant="outline"`               |                                            |
| ProgressBar                                  | `Progress`                               |                                            |
| Stepper                                      | Kustom (`Card` + ikon lucide)            | Tidak ada bawaan di shadcn/ui              |
| FramePreviewCard, SpectrogramCard            | `Card`; mobile di dalam `Accordion`      |                                            |
| TraitBars                                    | `Progress` per trait                     | Nilai = skor × 100                         |
| RadarChart                                   | `Chart` (Recharts `RadarChart`)          | Pakai `var(--primary)` untuk garis dan isi |
| InterpretationCard                           | `Card` (desktop), `Accordion` (mobile)   |                                            |
| Disclaimer                                   | `Alert`                                  | Ikon ⚠ tanpa warna khusus                  |
| Pesan error (izin ditolak, gagal proses)     | `Alert`                                  | Bedakan lewat ikon dan teks                |
| Konfirmasi "Simpan ke Riwayat"               | `Sonner` (toast)                         |                                            |
| Menu hamburger (mobile/tablet)               | `Sheet`                                  |                                            |
| Bottom navigation dan action bar sticky      | Kustom (Tailwind `fixed bottom-0`)       |                                            |
| UploadDropzone                               | Kustom (`Input type="file"` + area drop) |                                            |
| CameraPreview, AudioLevelMeter               | Kustom                                   | Memakai `getUserMedia` dan Web Audio API   |

## 11. Aksesibilitas

- Semua kontrol dapat dijangkau keyboard dengan fokus yang terlihat.
- Grafik (bar dan radar) punya alternatif teks: tabel atau daftar skor bagi pembaca layar.
- Status proses diumumkan lewat `aria-live="polite"`.
- Jangan mengandalkan warna saja untuk status. Sertakan ikon atau teks (✔, ⏳).
- Hormati `prefers-reduced-motion` untuk animasi progres.

## 12. Privasi dan etika

- Consent eksplisit sebelum kamera/mikrofon aktif dan sebelum unggahan diproses.
- Fallback unggah video bila izin kamera ditolak.
- Pengguna dapat menghapus video dan hasil kapan saja.
- Disclaimer hasil tampil di layar Hasil dan di PDF.

## 13. Kriteria penerimaan

- [ ] Ketiga layar tampil benar di 375px, 768px, dan 1280px tanpa scroll horizontal.
- [ ] Tombol "Mulai Analisis" hanya aktif bila video valid dan consent dicentang.
- [ ] Kamera/mikrofon tidak aktif sebelum consent.
- [ ] Progres, tombol Batal, dan penanganan error berfungsi di semua tahap.
- [ ] Nilai bar dan radar konsisten dengan `OceanResult`.
- [ ] Disclaimer selalu terlihat di layar Hasil.
- [ ] Seluruh alur dapat dioperasikan hanya dengan keyboard.
- [ ] Tidak ada warna aksen selain `primary` dan `secondary` di seluruh UI.
- [ ] Tidak ada `className` yang menimpa tampilan dasar komponen shadcn/ui (hanya layouting).

## 14. Catatan untuk Copilot

- Buat komponen kecil dan reusable sesuai tabel komponen di atas.
- Boleh menjalankan perintah CLI shadcn untuk memasang komponen yang dibutuhkan (mis. `shadcn add button tabs`) memakai package manager proyek. Ikuti skill shadcn/ui untuk cara yang benar.
- Jangan menambahkan class Tailwind untuk mengubah tampilan dasar komponen shadcn/ui. Class hanya untuk layouting (lihat bagian 1).
- Gunakan komponen shadcn/ui sesuai tabel di bagian 10 dan hanya token warna `primary` dan `secondary`. Jangan menambah warna hardcode (hex/Tailwind seperti `green-500`).
- Jangan menambahkan fitur di luar dokumen ini tanpa konfirmasi.
- Jika ada konflik antara wireframe dan dokumen ini, ikuti dokumen ini.
- Data contoh di wireframe (0.72, 0.58, 0.41, 0.66, 0.33) hanya placeholder.
