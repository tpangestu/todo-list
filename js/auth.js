
// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCrJ0fN9wxD1NXxO7tUrz6-OOEm2Ob9NEI",
    authDomain: "todo-list-38f6c.firebaseapp.com",
    projectId: "todo-list-38f6c",
    storageBucket: "todo-list-38f6c.firebasestorage.app",
    messagingSenderId: "1093704764409",
    appId: "1:1093704764409:web:f8fe8d0d2775872b0ccb28"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// SELEKTOR ELEMEN DOM
const flipContainer = document.querySelector('.flip-container');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// LOGIKA TAMPILAN (FLIP)

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    flipContainer.classList.add('is-flipped');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    flipContainer.classList.remove('is-flipped');
});


// LOGIKA OTENTIKASI

// Proses Registrasi
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const nama = document.getElementById('register-nama').value;
    const jabatan = document.getElementById('register-jabatan').value;

    let createdUserId = null; // Variabel sementara untuk menyimpan UID

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            createdUserId = userCredential.user.uid; // Simpan UID
            // KUNCI: Lanjutkan ke rantai berikutnya untuk menyimpan data
            return db.collection('users').doc(createdUserId).set({
                nama: nama,
                jabatan: jabatan
            });
        })
        .then(() => {
            console.log('Data profil berhasil disimpan');
            // KUNCI: Sekarang data sudah tersimpan, kita paksa logout
            return auth.signOut();
        })
        .then(() => {
            // Setelah semua selesai dan user sudah logout, baru beri notifikasi
            alert('✅ Registrasi berhasil! Silakan login dengan akun baru Anda.');
            registerForm.reset();
            flipContainer.classList.remove('is-flipped'); // Kembali ke halaman login
        })
        .catch((error) => {
            console.error('Error saat registrasi:', error);
            alert(`Error Registrasi: ${error.message}`);
        });
});

// Proses Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // KUNCI: Pengalihan HANYA terjadi setelah login sukses ditekan
            window.location.href = 'todo.html';
        })
        .catch((error) => {
            alert(`Error Login: ${error.message}`);
        });
});

