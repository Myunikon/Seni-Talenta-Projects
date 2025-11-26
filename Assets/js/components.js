document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadFooter();
    loadBottomNav();
    setActiveLink();
});

/* 1. HEADER (DESKTOP) */
function loadHeader() {
    const headerHTML = `
    <div class="logo">
        <img src="../Assets/logo.png" alt="Logo"> TALENTA
    </div>

    <nav id="mainNav">
        <ul>
            <li><a href="../Dashboard/landingpage.html" data-page="landingpage.html">Beranda</a></li>
            <li><a href="../Katalog/katalog.html" data-page="katalog.html">Koleksi</a></li>
            <li><a href="../Dashboard/galery.html" data-page="galery.html">Galeri</a></li>
        </ul>
    </nav>

    <div id="authContainer"></div>
    `;

    const headerEl = document.getElementById("app-header");
    if (headerEl) headerEl.innerHTML = headerHTML;
}

/* 2. FOOTER */
function loadFooter() {
    const footerHTML = `
    <div class="footer-container">

        <div class="footer-col footer-brand">
            <div class="logo">
                <img src="../Assets/logo.png" style="height: 35px;"> TALENTA
            </div>
            <p class="footer-desc">
                Menghadirkan kemewahan budaya nusantara melalui penyewaan kostum adat premium.
                Lestarikan tradisi dengan gaya elegan dan autentik.
            </p>
            <div class="social-links">
                <a href="https://www.instagram.com/talenta.project/" class="social-btn"><i class="fa-brands fa-instagram"></i></a>
                <a href="https://www.tiktok.com/@hanni.872/photo/7549955890804231431?is_from_webapp=1&sender_device=pc" class="social-btn"><i class="fa-brands fa-tiktok"></i></a>
                <a href="https://youtu.be/VhMrjbRUpNU?si=GwfLBqx8ADsLaDeO" class="social-btn"><i class="fa-brands fa-youtube"></i></a>
                <a href="https://wa.me/6285719714149" class="social-btn"><i class="fa-brands fa-whatsapp"></i></a>
            </div>
        </div>

        <div class="footer-col">
            <h4>Jelajahi</h4>
            <ul class="footer-links">
                <li><a href="../Dashboard/landingpage.html">Beranda</a></li>
                <li><a href="../Dashboard/about.html">Tentang Kami</a></li>
                <li><a href="../Katalog/katalog.html">Katalog Kostum</a></li>
                <li><a href="../Dashboard/galery.html">Galeri Pelanggan</a></li>
            </ul>
        </div>

        <div class="footer-col">
            <h4>Hubungi Kami</h4>
            <div class="contact-item">
                <i class="fa-solid fa-location-dot"></i>
                <span>Lotus Villa Blok C/8,<br>Makassar, Sulawesi Selatan</span>
            </div>
            <div class="contact-item">
                <i class="fa-solid fa-phone"></i>
                <span>+62 857 1971 4149</span>
            </div>
            <div class="contact-item">
                <i class="fa-regular fa-envelope"></i>
                <span>support@talentaarts.id</span>
            </div>
            <div class="contact-item">
                <i class="fa-regular fa-clock"></i>
                <span>Senin - Sabtu: 09:00 - 21:00</span>
            </div>
        </div>

        <div class="footer-col">
            <h4>Newsletter</h4>
            <p style="color:#888; margin-bottom:15px;">Dapatkan info promo sewa dan koleksi terbaru.</p>
            <form class="newsletter-form">
                <input type="email" placeholder="Email Anda..." class="news-input">
                <button type="button" class="news-btn"><i class="fa-solid fa-paper-plane"></i></button>
            </form>

            <div style="margin-top:20px;">
                <small style="color:#666;">Metode Pembayaran:</small>
                <div class="payment-row">
                    <i class="fa-brands fa-cc-visa" title="Visa"></i>
                    <i class="fa-brands fa-cc-mastercard" title="Mastercard"></i>
                    <i class="fa-solid fa-wallet" title="E-Wallet"></i>
                    <i class="fa-solid fa-building-columns" title="Bank Transfer"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="footer-bottom">
        <div class="copyright">
            &copy; 2025 <strong>Talenta Arts Project</strong>. All rights reserved.
        </div>
        <div class="legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms & Conditions</a>
            <a href="#">Cookie Policy</a>
        </div>
    </div>
    `;

    const footerEl = document.getElementById("app-footer");
    if (footerEl) footerEl.innerHTML = footerHTML;
}

/* 3. BOTTOM NAV (MOBILE) - FIX UTAMA ADA DI SINI */
function loadBottomNav() {
    if (document.querySelector('.bottom-nav')) return;

    const navHTML = `
    <div class="bottom-nav">
        <a href="../Dashboard/landingpage.html" class="nav-item" data-page="landingpage.html">
            <i class="fa-solid fa-house"></i><span>Beranda</span>
        </a>
        <a href="../Katalog/katalog.html" class="nav-item" data-page="katalog.html">
            <i class="fa-solid fa-shirt"></i><span>Koleksi</span>
        </a>
        <a href="../Dashboard/galery.html" class="nav-item" data-page="galery.html">
            <i class="fa-solid fa-images"></i><span>Galeri</span>
        </a>

        <a href="../Dashboard/settings.html" class="nav-item" data-page="settings.html">
            <i class="fa-solid fa-user"></i><span>Akun</span>
        </a>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', navHTML);
}

function setActiveLink() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    document.querySelectorAll('.nav-item, #mainNav a').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`[data-page="${page}"]`).forEach(link => {
        link.classList.add('active');
    });
}
