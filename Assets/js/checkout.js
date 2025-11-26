/* ===========================================================
   CHECKOUT.JS - Logic for Order Processing
   Handles: Cart Rendering, Date Logic, Promo, Payment Simulation
   =========================================================== */

// --- 1. KONSTANTA & VARIABEL GLOBAL ---
const MY_DATA = {
  gopay: "081234567890",
  dana: "081234567890",
  bni: "1234567890",
  mandiri: "1520098821",
  nama: "A.N. TALENTA ARTS",
};

const INSTRUCTIONS = {
  bni: [
    {
      method: "ATM BNI",
      steps: [
        "Masukkan Kartu & PIN.",
        "Pilih <b>Transfer > Virtual Account</b>.",
        "Masukkan VA: <b style='color:#FFD700'>[NO_REK]</b>.",
        "Selesai.",
      ],
    },
    {
      method: "Mobile Banking",
      steps: [
        "Login BNI Mobile.",
        "Pilih <b>Pembayaran > VA</b>.",
        "Masukkan VA: <b style='color:#FFD700'>[NO_REK]</b>.",
        "Masukkan Password.",
      ],
    },
  ],
  mandiri: [
    {
      method: "Livin' by Mandiri",
      steps: [
        "Login Livin'.",
        "Menu <b>Bayar > Cari Penyedia</b>.",
        "Kode: <b>88908</b>.",
        "Masukkan VA: <b style='color:#FFD700'>[NO_REK]</b>.",
        "PIN.",
      ],
    },
  ],
  gopay: [
    {
      method: "Cara Bayar",
      steps: ["Buka Gojek > Bayar.", "Scan QR Code.", "Masukkan PIN."],
    },
  ],
  dana: [
    {
      method: "Cara Bayar",
      steps: ["Buka DANA > Scan.", "Arahkan ke QR Code.", "Konfirmasi."],
    },
  ],
};

let hargaPerHari = 0;
let durasiHari = 1;
let biayaOngkir = 25000; // Default Antar
let nilaiDiskon = 0;
let countdownInterval;
const biayaLayanan = 5000;

/* --- SECURITY CHECK: Tendang Tamu --- */
(function checkAccess() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn !== 'true') {
        // Simpan pesan error biar muncul di halaman login
        localStorage.setItem('loginError', 'Anda harus login untuk menyewa kostum!');

        // Tendang ke halaman Login
        window.location.href = '../LoginRegister/login.html';
    }
})();

// --- 2. INISIALISASI HALAMAN ---
document.addEventListener("DOMContentLoaded", () => {
  initUserData();
  initDatePickers();
  renderCartItems();
  setupListeners();
});

function initUserData() {
  const savedName = localStorage.getItem("userName");
  const savedPhone = localStorage.getItem("userPhone");
  if (savedName) document.getElementById("inputNama").value = savedName;
  if (savedPhone) document.getElementById("inputHp").value = savedPhone;
}

let startDatePicker;
let endDatePicker;

function initDatePickers() {
    // Konfigurasi Dasar
    const config = {
        dateFormat: "Y-m-d", // Format mesin (biar mudah dihitung)
        altInput: true,      // Tampilkan format manusia
        altFormat: "j F Y",  // Contoh: 15 Oktober 2025
        minDate: "today",    // Tidak bisa pilih masa lalu
        disableMobile: true, // PENTING: Paksa pakai tema kita di HP (jangan native)
        theme: "dark"
    };

    // 1. Inisialisasi Tanggal Mulai
    startDatePicker = flatpickr("#tglMulai", {
        ...config,
        onChange: function(selectedDates, dateStr, instance) {
            // Saat tanggal mulai dipilih, update minimal tanggal selesai
            endDatePicker.set("minDate", dateStr);

            // Reset tanggal selesai jika tidak valid
            const endDate = endDatePicker.selectedDates[0];
            if (endDate && endDate < selectedDates[0]) {
                endDatePicker.clear();
                document.getElementById('durasiTeks').innerText = '- Hari';
            }

            hitungDurasi(); // Hitung ulang
        }
    });

    // 2. Inisialisasi Tanggal Selesai
    endDatePicker = flatpickr("#tglSelesai", {
        ...config,
        onChange: function(selectedDates, dateStr, instance) {
            hitungDurasi();
        }
    });
}

function setupListeners() {
  // Listener Tgl Mulai
  document.getElementById("tglMulai").addEventListener("change", function () {
    document.getElementById("tglSelesai").setAttribute("min", this.value);
    const endVal = document.getElementById("tglSelesai").value;
    if (endVal && endVal < this.value) {
      document.getElementById("tglSelesai").value = "";
      document.getElementById("durasiTeks").innerText = "- Hari";
    }
    hitungDurasi();
  });

  // Listener Tgl Selesai
  document
    .getElementById("tglSelesai")
    .addEventListener("change", hitungDurasi);

  // Listener Radio Pengiriman
  document.getElementsByName("pickup").forEach((r) =>
    r.addEventListener("change", function () {
      biayaOngkir = this.value === "antar" ? 25000 : 0;
      updateTotal();
    })
  );

  // Listener Radio Pembayaran (CC Toggle)
  document.querySelectorAll(".pay-radio").forEach((r) =>
    r.addEventListener("change", function () {
      document
        .getElementById("cc-details")
        .classList.toggle("hidden", this.value !== "cc");
    })
  );
}

// --- 3. LOGIKA KERANJANG ---
function renderCartItems() {
  const keranjang = JSON.parse(localStorage.getItem("cartTalenta")) || [];
  const container = document.getElementById("cartItemsContainer");
  let totalSewaHarian = 0;

  container.innerHTML = "";

  if (keranjang.length > 0) {
    keranjang.forEach((item, index) => {
      const itemTotal = item.harga * item.qty;
      totalSewaHarian += itemTotal;
      const sizeLabel = item.size ? item.size : "All Size";

      const rowHTML = `
            <div class="cart-item">
                <img src="${item.gambar}" class="cart-thumb">
                <div class="cart-details">
                    <h4>${item.nama}</h4>
                    <p>Ukuran: ${sizeLabel} | Qty: ${item.qty}</p>
                    <p onclick="hapusItem(${index})" style="color:#ff4444; cursor:pointer; font-size:0.7rem; margin-top:4px;">
                        <i class="fa-regular fa-trash-can"></i> Hapus
                    </p>
                </div>
                <div class="cart-price">
                    ${formatRupiah(itemTotal)}
                </div>
            </div>`;

      container.insertAdjacentHTML("beforeend", rowHTML);
    });

    hargaPerHari = totalSewaHarian;
    updateTotal();
  } else {
    if (typeof showToast === "function")
      showToast("Keranjang Kosong!", "error");
    setTimeout(() => (window.location.href = "../Katalog/katalog.html"), 1000);
  }
}

function hapusItem(index) {
  let keranjang = JSON.parse(localStorage.getItem("cartTalenta")) || [];
  keranjang.splice(index, 1);
  localStorage.setItem("cartTalenta", JSON.stringify(keranjang));
  renderCartItems(); // Re-render tanpa reload halaman
}

// --- 4. LOGIKA KALKULASI ---
function hitungDurasi() {
    // Ambil value langsung dari instance Flatpickr (lebih akurat)
    const startDates = startDatePicker.selectedDates;
    const endDates = endDatePicker.selectedDates;

    if (startDates.length > 0 && endDates.length > 0) {
        const dateM = startDates[0];
        const dateS = endDates[0];

        if (dateS < dateM) {
            showToast("Tanggal selesai tidak boleh mundur!", "error");
            return;
        }

        const diffTime = Math.abs(dateS - dateM);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Jika hari sama, hitung 1 hari
        durasiHari = diffDays === 0 ? 1 : diffDays;

        document.getElementById('durasiTeks').innerText = durasiHari + " Hari";
        updateTotal();
    }
}

function cekPromo() {
  const k = document.getElementById("inputPromo").value.toUpperCase().trim();
  const codes = { TALENTA: 10000, MERDEKA: 20000 };

  if (codes[k]) {
    nilaiDiskon = codes[k];
    showToast("Promo Berhasil!");
  } else {
    nilaiDiskon = 0;
    showToast("Kode Invalid!", "error");
  }
  updateTotal();
}

function updateTotal() {
  const sub = hargaPerHari * durasiHari;
  const tot = sub + biayaOngkir - nilaiDiskon; // Asuransi & Layanan dihapus sesuai request terbaru

  // Update Text
  document.getElementById("summarySubtotal").innerText = formatRupiah(sub);
  document.getElementById("summaryOngkir").innerText =
    formatRupiah(biayaOngkir);

  const rowDiskon = document.getElementById("rowDiskon");
  if (nilaiDiskon > 0) {
    rowDiskon.classList.remove("hidden");
    document.getElementById("summaryDiskon").innerText =
      "-" + formatRupiah(nilaiDiskon);
  } else {
    rowDiskon.classList.add("hidden");
  }

  document.getElementById("summaryTotal").innerText = formatRupiah(tot);

  // Update Info Periode (Box Bawah)
  const m = document.getElementById("tglMulai").value;
  const s = document.getElementById("tglSelesai").value;

  document.getElementById("infoMulai").innerText = m ? formatDateIndo(m) : "-";
  document.getElementById("infoSelesai").innerText = s
    ? formatDateIndo(s)
    : "-";
  document.getElementById("infoDurasi").innerText = durasiHari + " Hari";
}

// --- 5. NAVIGATION & HELPERS ---
function nextStep(step) {
  if (step === 2 && !document.getElementById("inputNama").value) {
    if (typeof showToast === "function")
      showToast("Nama wajib diisi!", "error");
    return;
  }
  for (let i = 1; i <= 3; i++)
    document.getElementById("step-" + i).classList.add("hidden");
  document.getElementById("step-" + step).classList.remove("hidden");

  // Update Stepper UI
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById("st-" + i);
    const line = document.getElementById("line-" + (i - 1));
    const circle = el.querySelector(".step-circle");
    if (i < step) {
      el.className = "step-item active";
      circle.innerHTML = '<i class="fa-solid fa-check"></i>';
      if (line) line.classList.add("active");
    } else if (i === step) {
      el.className = "step-item active";
      circle.innerHTML = i;
      if (line) line.classList.add("active");
    } else {
      el.className = "step-item";
      circle.innerHTML = i;
      if (line) line.classList.remove("active");
    }
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDateIndo(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

/* --- UPDATE: SIMULASI PEMBAYARAN "RASA ASLI" --- */

function prosesPembayaran() {
    const pay = document.querySelector('input[name="pay"]:checked');
    if (!pay) { showToast("Pilih metode pembayaran!", "error"); return; }

    const method = pay.value;
    const total = document.getElementById('summaryTotal').innerText;
    const btn = document.getElementById('btnBayar');

    // 1. DRAMA: Loading Awal (Menghubungkan ke Gateway...)
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menghubungkan...';
    document.getElementById('loading-modal').classList.add('active');

    // Simulasi delay jaringan 2 detik
    setTimeout(() => {
        document.getElementById('loading-modal').classList.remove('active');

        // Generate Order ID
        const orderId = '#TAS-' + Math.floor(Math.random()*900000);
        document.getElementById('order-id').innerText = orderId;

        // Siapkan Konten Modal
        let contentHTML = "";
        let modalTitle = "Menunggu Pembayaran";
        let iconHTML = `<div class="timer-badge"><i class="fa-regular fa-clock"></i> <span id="timerDisplay">15:00</span></div>`; // Default Timer
        const rek = MY_DATA[method];

        // --- LOGIKA KONTEN PER METODE ---

        // A. Transfer Bank (BNI/Mandiri)
        if (['bni', 'mandiri'].includes(method)) {
            contentHTML = `
                <div class="payment-details-box">
                    <p style="text-align:center; color:#aaa; font-size:0.9rem;">Lakukan transfer ke Virtual Account berikut:</p>

                    <div class="va-box">
                        <span class="va-number-text" id="textToCopy">${rek}</span>
                        <button class="btn-copy" onclick="copyText('${rek}')"><i class="fa-regular fa-copy"></i> Salin</button>
                    </div>

                    <div class="detail-row"><span>Bank Tujuan</span> <strong>${method.toUpperCase()}</strong></div>
                    <div class="detail-row"><span>Atas Nama</span> <strong>${MY_DATA.nama}</strong></div>
                    <div class="detail-row total"><span>Total Tagihan</span> <strong>${total}</strong></div>

                    ${generateGuides(method, rek)}

                    <button class="btn-check-status" onclick="simulasiVerifikasi('${orderId}', '${method}', '${total}')">
                        Saya Sudah Bayar
                    </button>
                </div>`;
            startTimer(15*60);
        }

        // B. E-Wallet (QR Code)
        else if (['gopay', 'dana'].includes(method)) {
            contentHTML = `
                <div class="qr-wrapper">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${rek}" alt="QR Code">
                </div>
                <p style="text-align:center; color:#FFD700; font-weight:bold; margin-bottom:10px;">Total: ${total}</p>

                <div class="payment-details-box">
                    <p style="text-align:center; font-size:0.8rem; color:#aaa;">Scan QR di atas menggunakan aplikasi ${method.toUpperCase()}</p>
                    <button class="btn-check-status" onclick="simulasiVerifikasi('${orderId}', '${method}', '${total}')">
                        Cek Status Pembayaran
                    </button>
                </div>`;
            startTimer(10*60);
        }

        // C. COD (Langsung Sukses)
        else {
            modalTitle = "Pesanan Diterima";
            iconHTML = `<div class="success-icon"><i class="fa-solid fa-truck-fast"></i></div>`;
            contentHTML = `
                <div class="payment-details-box" style="text-align:center;">
                    <p style="color:#fff; margin-bottom:10px;">Pesanan COD berhasil dibuat.</p>
                    <p style="color:#aaa; font-size:0.9rem;">Siapkan uang tunai <strong>${total}</strong> saat kurir tiba.</p>
                    <button class="btn-next" onclick="finishOrder('${orderId}', '${method}', '${total}')" style="width:100%; margin-top:20px; justify-content:center;">
                        Lihat Pesanan Saya
                    </button>
                </div>`;
        }

        // Tampilkan Modal Pembayaran
        document.getElementById('modal-icon').innerHTML = iconHTML;
        document.getElementById('modal-title').innerText = modalTitle;
        document.getElementById('payment-content').innerHTML = contentHTML;
        document.getElementById('success-modal').classList.add('active');

        btn.innerHTML = 'Bayar Sekarang';

    }, 2000); // Delay 2 detik
}

/* --- FITUR BARU: SIMULASI VERIFIKASI --- */
function simulasiVerifikasi(id, method, total) {
    const btn = document.querySelector('.btn-check-status');
    // Ubah tombol jadi loading
    btn.innerHTML = '<span class="mini-spinner"></span> Memverifikasi...';
    btn.style.background = "#666";
    btn.disabled = true;

    // Drama Verifikasi (3 Detik)
    setTimeout(() => {
        // Ubah Tampilan Modal jadi SUKSES
        document.getElementById('modal-icon').innerHTML = `<div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>`;
        document.getElementById('modal-title').innerText = "Pembayaran Diterima!";

        document.getElementById('payment-content').innerHTML = `
            <div style="text-align:center; margin: 20px 0;">
                <p style="color:#aaa;">Terima kasih! Pembayaran Anda sebesar <strong style="color:#FFD700">${total}</strong> telah kami terima.</p>
                <p style="color:#aaa; font-size:0.85rem; margin-top:10px;">Silakan cek status pesanan di menu Akun.</p>

                <button class="btn-next" onclick="finishOrder('${id}', '${method}', '${total}')" style="width:100%; margin-top:20px; justify-content:center;">
                    Selesai
                </button>
            </div>
        `;
    }, 3000);
}

/* --- FITUR BARU: COPY TO CLIPBOARD --- */
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Nomor VA Disalin!");
    }).catch(err => {
        console.error('Gagal menyalin: ', err);
    });
}

/* --- FINALISASI ORDER (Simpan & Redirect) --- */
function finishOrder(id, method, total) {
    saveToHistory(id, method, total);
    window.location.href = '../Dashboard/settings.html';
}

function saveToHistory(id, method, total) {
  const keranjang = JSON.parse(localStorage.getItem("cartTalenta")) || [];

  let namaBarang = "Paket Kostum";
  if (keranjang.length === 1) {
    namaBarang = keranjang[0].nama;
  } else if (keranjang.length > 1) {
    namaBarang = `${keranjang[0].nama} & ${keranjang.length - 1} lainnya`;
  }

  const tgl = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const newOrder = {
    id: id,
    item: namaBarang,
    date: tgl,
    total: total,
    method: method.toUpperCase(),
    status: "Diproses",
  };

  let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
  history.unshift(newOrder);
  localStorage.setItem("orderHistory", JSON.stringify(history));

  localStorage.removeItem("cartTalenta"); // Kosongkan Keranjang
}

function generateGuides(method, data) {
  const list = INSTRUCTIONS[method];
  if (!list) return "";

  let html = `<div class="guide-box"><div class="guide-title">Instruksi Pembayaran</div>`;
  list.forEach((g, index) => {
    const stepsHTML = g.steps
      .map((step) => `<li>${step.replace("[NO_REK]", data)}</li>`)
      .join("");
    html += `
        <div class="accordion-item" style="margin-bottom:5px; border:1px solid #333; border-radius:6px; overflow:hidden;">
            <div class="accordion-header" onclick="toggleAccordion(this)" style="background:#222; padding:10px 15px; cursor:pointer; display:flex; justify-content:space-between; font-size:0.85rem; color:#fff;">
                <span>${g.method}</span>
                <i class="fa-solid fa-chevron-down" style="transition:0.3s;"></i>
            </div>
            <div class="accordion-body" style="display:none; background:#111; padding:15px;">
                <ol class="step-list" style="margin:0; padding-left:20px;">${stepsHTML}</ol>
            </div>
        </div>`;
  });
  return html + "</div>";
}

function toggleAccordion(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector("i");
  if (body.style.display === "none") {
    body.style.display = "block";
    icon.style.transform = "rotate(180deg)";
    header.style.color = "#FFD700";
  } else {
    body.style.display = "none";
    icon.style.transform = "rotate(0deg)";
    header.style.color = "#fff";
  }
}

function startTimer(sec) {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const m = Math.floor(sec / 60),
      s = sec % 60;
    const el = document.getElementById("timerDisplay");
    if (el) el.innerText = `${m}:${s < 10 ? "0" : ""}${s}`;
    if (--sec < 0) {
      clearInterval(countdownInterval);
      showToast("Waktu Habis!", "error");
      setTimeout(() => location.reload(), 2000);
    }
  }, 1000);
}

function getLocation() {
    if(!navigator.geolocation) return showToast("Browser tidak support Geo.", "error");

    const btn = document.querySelector('.btn-location');
    const addressInput = document.getElementById('inputAlamat');

    // MASUKKAN API KEY ANDA DI SINI (JANGAN KOSONG!)
    const API_KEY = "API_KEY_GEOAPIFY_ANDA";

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Melacak...';
    btn.disabled = true;

    // Opsi Geolocation: Timeout 10 detik
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        async (p) => {
            // --- SUKSES DAPAT KOORDINAT ---
            const lat = p.coords.latitude;
            const long = p.coords.longitude;
            document.getElementById('coord-text').innerText = `Lat: ${lat.toFixed(5)}, Long: ${long.toFixed(5)}`;

            try {
                // Panggil Geoapify
                const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${long}&apiKey=${API_KEY}`);

                if (!response.ok) throw new Error("Gagal koneksi ke Geoapify (Cek API Key)");

                const result = await response.json();

                if (result.features && result.features.length > 0) {
                    addressInput.value = result.features[0].properties.formatted;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Alamat Ditemukan';
                    btn.style.color = "#4CAF50";
                    showToast("Lokasi berhasil dideteksi!");
                } else {
                    throw new Error("Alamat tidak ditemukan.");
                }
            } catch (error) {
                console.error(error);
                showToast("Gagal konversi alamat: " + error.message, "error");
                btn.innerHTML = 'Coba Lagi';
            } finally {
                btn.disabled = false;
            }
        },
        (e) => {
            // --- GAGAL DAPAT KOORDINAT ---
            let msg = "Gagal ambil lokasi.";
            if (e.code === 1) msg = "Izin lokasi ditolak.";
            if (e.code === 2) msg = "Lokasi tidak tersedia.";
            if (e.code === 3) msg = "Waktu habis (Timeout).";

            showToast(msg, "error");
            btn.innerHTML = 'Gunakan Manual';
            btn.disabled = false;
        },
        options // Masukkan opsi timeout di sini
    );
}
