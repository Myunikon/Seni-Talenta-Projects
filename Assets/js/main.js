
document.addEventListener("DOMContentLoaded", () => {
    injectGlobalStyles(); // CSS Toast & Modal
    injectLogoutModal();  // HTML Modal Logout
    checkLoginState();
    initCatalogLogic();
});

function injectGlobalStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* TOAST STYLES */
        #toast-box {
            visibility: hidden; min-width: 250px; background-color: #111; color: #fff;
            text-align: center; border-radius: 8px; padding: 16px; position: fixed; z-index: 9999;
            left: 50%; bottom: 30px; transform: translateX(-50%);
            border: 1px solid #FFD700; box-shadow: 0 5px 20px rgba(0,0,0,0.8);
            display: flex; align-items: center; gap: 10px; justify-content: center;
            font-family: 'Poppins', sans-serif; font-size: 0.9rem; opacity: 0; transition: all 0.5s;
        }
        #toast-box.show { visibility: visible; opacity: 1; bottom: 50px; }
        #toast-box.error { border-color: #ff4444; }
        #toast-box i { font-size: 1.1rem; }

        /* MODAL LOGOUT STYLES */
        .logout-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(5px);
            z-index: 10000; display: flex; justify-content: center; align-items: center;
            opacity: 0; visibility: hidden; transition: 0.3s ease;
        }
        .logout-overlay.active { opacity: 1; visibility: visible; }

        .logout-box {
            background: #111; border: 1px solid #333; padding: 30px; width: 90%; max-width: 400px;
            border-radius: 16px; text-align: center; transform: scale(0.9); transition: 0.3s ease;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5); position: relative;
        }
        .logout-overlay.active .logout-box { transform: scale(1); }

        .logout-icon {
            width: 60px; height: 60px; background: rgba(255, 68, 68, 0.1); color: #ff4444;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem; margin: 0 auto 20px; border: 1px solid rgba(255, 68, 68, 0.3);
        }

        .logout-title { color: #fff; font-size: 1.2rem; font-weight: 700; margin-bottom: 10px; font-family: 'Poppins', sans-serif; }
        .logout-desc { color: #aaa; font-size: 0.9rem; margin-bottom: 25px; font-family: 'Poppins', sans-serif; }

        .logout-actions { display: flex; gap: 15px; justify-content: center; }

        .btn-cancel {
            background: transparent; border: 1px solid #444; color: #fff;
            padding: 10px 25px; border-radius: 30px; cursor: pointer; font-weight: 600; transition: 0.3s;
            font-family: 'Poppins', sans-serif;
        }
        .btn-cancel:hover { border-color: #fff; background: #222; }

        .btn-confirm {
            background: #ff4444; border: none; color: #fff;
            padding: 10px 30px; border-radius: 30px; cursor: pointer; font-weight: 600; transition: 0.3s;
            font-family: 'Poppins', sans-serif; box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
        }
        .btn-confirm:hover { background: #cc0000; transform: translateY(-2px); }
    `;
    document.head.appendChild(style);

    // Buat elemen Toast HTML jika belum ada
    if (!document.getElementById('toast-box')) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'toast-box';
        toastDiv.innerHTML = '<i class="fa-solid fa-info-circle"></i> <span id="toast-msg">Notifikasi</span>';
        document.body.appendChild(toastDiv);
    }
}

/* --- 2. INJECT HTML MODAL LOGOUT --- */
function injectLogoutModal() {
    if (!document.getElementById('customLogoutModal')) {
        const modalHTML = `
            <div id="customLogoutModal" class="logout-overlay">
                <div class="logout-box">
                    <div class="logout-icon">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </div>
                    <h3 class="logout-title">Konfirmasi Keluar</h3>
                    <p class="logout-desc">Apakah Anda yakin ingin mengakhiri sesi ini?</p>
                    <div class="logout-actions">
                        <button class="btn-cancel" onclick="closeLogoutModal()">Batal</button>
                        <button class="btn-confirm" onclick="confirmLogout()">Ya, Keluar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

function logout() {
    const modal = document.getElementById('customLogoutModal');
    if (modal) modal.classList.add('active');
}

function closeLogoutModal() {
    const modal = document.getElementById('customLogoutModal');
    if (modal) modal.classList.remove('active');
}

function confirmLogout() {
    localStorage.clear();
    closeLogoutModal();
    showToast("Berhasil Logout. Sampai Jumpa!");

    // Redirect setelah animasi toast
    setTimeout(() => {
        if(window.location.pathname.includes('/Dashboard/')) {
            window.location.href = '../LoginRegister/login.html';
        } else {
            window.location.href = 'LoginRegister/login.html'; // Fallback
        }
    }, 1500);
}

// Tutup modal jika klik di luar box (overlay)
window.onclick = function(event) {
    const modal = document.getElementById('customLogoutModal');
    if (event.target === modal) {
        closeLogoutModal();
    }
}

/* --- 4. UTILITY FUNCTIONS (Sama seperti sebelumnya) --- */
function showToast(message, type = 'normal') {
    const toast = document.getElementById("toast-box");
    const msg = document.getElementById("toast-msg");
    const icon = toast.querySelector('i');

    msg.innerText = message;
    toast.className = type === 'error' ? 'error' : '';

    if(type === 'error') {
        icon.className = "fa-solid fa-circle-exclamation"; icon.style.color = "#ff4444";
    } else {
        icon.className = "fa-solid fa-circle-check"; icon.style.color = "#FFD700";
    }

    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 3000);
}

function formatRupiah(angka) {
    return "Rp " + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


/* --- UPDATE main.js : FUNGSI CHECK LOGIN --- */

function checkLoginState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userName = localStorage.getItem('userName');
    const authContainer = document.getElementById('authContainer');

    if (!authContainer) return;

    // USER SUDAH LOGIN
    if (isLoggedIn === 'true') {
        // Perbaikan Path: Selalu mundur (../) lalu masuk ke Dashboard
        const profileLink = "../Dashboard/settings.html";

        authContainer.innerHTML = `
            <a href="${profileLink}" class="btn-auth" style="border:1px solid #FFD700; color:#000000ff;">
                <i class="fa-solid fa-user"></i> ${userName}
            </a>
        `;
    }

    // USER BELUM LOGIN (TAMU)
    else {
        const path = window.location.pathname;

        // Logika Tombol Login/Daftar
        if (path.includes("login.html")) {
            // Jika sedang di login, tombol mengarah ke register (masih satu folder)
            authContainer.innerHTML = `<a href="register.html" class="btn-auth">Daftar</a>`;
        }
        else if (path.includes("register.html")) {
            authContainer.innerHTML = `<a href="login.html" class="btn-auth">Masuk</a>`;
        }
        else {
            // Jika di halaman lain, mundur (../) lalu masuk ke LoginRegister
            authContainer.innerHTML = `<a href="../LoginRegister/login.html" class="btn-auth">Masuk</a>`;
        }
    }
}

/* --- 6. CATALOG LOGIC --- */
function initCatalogLogic() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const productCards = document.querySelectorAll('.product-card');
    const checkboxes = document.querySelectorAll('.checkbox-item input');

    searchInput.addEventListener('keyup', (e) => { filterProducts(e.target.value.toLowerCase()); });

    checkboxes.forEach(box => {
        box.addEventListener('change', () => {
            const checkedBoxes = Array.from(checkboxes).filter(i => i.checked).map(i => i.parentElement.innerText.toLowerCase().trim());
            if (checkedBoxes.length === 0) filterProducts(searchInput.value.toLowerCase());
            else filterByCheckbox(checkedBoxes);
        });
    });

    function filterProducts(term) {
        let visibleCount = 0;
        productCards.forEach(card => {
            const txt = card.innerText.toLowerCase();
            if (txt.includes(term)) { card.style.display = "flex"; visibleCount++; }
            else { card.style.display = "none"; }
        });
        updateCount(visibleCount);
    }

    function filterByCheckbox(keywords) {
        let visibleCount = 0;
        productCards.forEach(card => {
            const txt = card.innerText.toLowerCase();
            const isMatch = keywords.some(k => txt.includes(k.split('(')[0].trim()));
            if (isMatch) { card.style.display = "flex"; visibleCount++; }
            else { card.style.display = "none"; }
        });
        updateCount(visibleCount);
    }

    function updateCount(n) {
        const el = document.querySelector('.result-count');
        if(el) el.innerHTML = `Menampilkan <span>${n}</span> kostum`;
    }
}
