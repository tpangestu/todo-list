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
const logoutButton = document.getElementById('logout-button');
const profileNama = document.getElementById('profile-nama');
const profileJabatan = document.getElementById('profile-jabatan');
const currentDateElem = document.getElementById('current-date');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDate = document.getElementById('due-date');
const timeNote = document.getElementById('time-note');
const priorityLevel = document.getElementById('priority-level');
const todoList = document.getElementById('todo-list');
const doneList = document.getElementById('done-list');
const deleteAllButton = document.getElementById('delete-all-button');

// Custom select elements
const customSelect = document.getElementById('priority-level-wrapper');
const selectSelected = document.getElementById('select-selected');
const selectOptions = document.getElementById('select-options');

// PENJAGA HALAMAN & FUNGSI UTAMA

auth.onAuthStateChanged(user => {
    if (user) {
        setupApp(user);
    } else {
        window.location.href = 'index.html';
    }
});

logoutButton.addEventListener('click', () => {
    auth.signOut();
});

let tasksUnsubscribe; 

function setupApp(user) {
    console.log('Setup app untuk user:', user.uid);
    // Ambil data profil
    db.collection('users').doc(user.uid).get().then(doc => {
        console.log('Data profil ditemukan:', doc.exists);
        if (doc.exists) {
            const userData = doc.data();
            console.log('User data:', userData);
            profileNama.textContent = userData.nama || "Nama tidak tersedia";
            profileJabatan.textContent = userData.jabatan || "Jabatan tidak tersedia";
        } else {
            console.log("Tidak ada data profil!");
            profileNama.textContent = "Nama tidak ditemukan";
            profileJabatan.textContent = "Jabatan tidak ditemukan";
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
        profileNama.textContent = "Error memuat nama";
        profileJabatan.textContent = "Error memuat jabatan";
    });

    // Atur tanggal
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElem.textContent = today.toLocaleDateString('id-ID', options);

    // Initialize custom select
    initCustomSelect();

    // Ambil data tugas (ini yang memerlukan indeks)
    tasksUnsubscribe = db.collection('tasks')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            renderTasks(snapshot);
        }, error => {
            // akan menangkap error jika indeks belum dibuat
            console.error("Error saat mengambil data tugas: ", error);
        });
}

// Custom select functionality
function initCustomSelect() {
    if (!selectSelected || !selectOptions) return;

    // Toggle dropdown
    selectSelected.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    // Handle option selection
    selectOptions.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const value = e.target.getAttribute('data-value');
            const text = e.target.textContent;

            // Update selected text
            selectSelected.textContent = text;

            // Update hidden select
            priorityLevel.value = value;

            // Update selected class
            selectOptions.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
            e.target.classList.add('selected');

            // Close dropdown
            customSelect.classList.remove('open');
        }
    });
}

function renderTasks(snapshot) {
    todoList.innerHTML = '';
    doneList.innerHTML = '';

    snapshot.forEach(doc => {
        const task = doc.data();
        const taskId = doc.id;
        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority}`;
        li.setAttribute('data-id', taskId);

        if (task.completed) li.classList.add('completed');
        
        if (task.createdAt && task.createdAt.toDate) {
            const taskDate = task.createdAt.toDate();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (taskDate < today && !task.completed) {
                li.classList.add('overdue');
            }
        }
        
        li.innerHTML = `
            <div class="content">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span>${task.text}</span>
                <div class="task-details">
                    <small>Deadline: ${task.dueDate || 'Tidak ada'}</small>
                    ${task.timeNote ? `<small>Keterangan: ${task.timeNote}</small>` : ''}
                </div>
            </div>
            <button class="delete-task-button">🗑️</button>
        `;

        if (task.completed) {
            doneList.appendChild(li);
        } else {
            todoList.appendChild(li);
        }

        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => toggleTaskStatus(taskId, task.completed));

        const deleteButton = li.querySelector('.delete-task-button');
        deleteButton.addEventListener('click', () => deleteTask(taskId));
    });
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value;
    const dueDateValue = dueDate.value;
    const timeNoteValue = timeNote.value;
    const priority = priorityLevel.value;
    const user = auth.currentUser;

    if (text.trim() === '' || !user) return;

    db.collection('tasks').add({
        text: text,
        dueDate: dueDateValue,
        timeNote: timeNoteValue,
        priority: priority,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: user.uid
    }).then(() => {
        taskForm.reset();
        // Reset custom select to default
        selectSelected.textContent = 'Sedang';
        selectOptions.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
        selectOptions.querySelector('li[data-value="medium"]').classList.add('selected');
    }).catch(error => {
        console.error("Error adding document: ", error);
    });
});

function toggleTaskStatus(taskId, currentStatus) {
    db.collection('tasks').doc(taskId).update({ completed: !currentStatus });
}

function deleteTask(taskId) {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        db.collection('tasks').doc(taskId).delete();
    }
}

deleteAllButton.addEventListener('click', () => {
    if (!confirm('PERINGATAN: Ini akan menghapus SEMUA tugas. Lanjutkan?')) return;
    const user = auth.currentUser;
    if (!user) return;

    db.collection('tasks').where('userId', '==', user.uid).get()
        .then(snapshot => {
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            alert('Semua tugas berhasil dihapus.');
        })
        .catch(error => {
            console.error("Error removing documents: ", error);
        });
});