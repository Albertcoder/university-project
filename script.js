// Адрес твоего локального сервера
const API_URL = 'http://localhost:3000/api';

let allUnis = [];
let favorites = JSON.parse(localStorage.getItem('favUnis')) || [];
let compareList = [];
let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// 1. ЗАГРУЗКА ДАННЫХ
async function init() {
    initParticles();

    try {
        const response = await fetch(`${API_URL}/universities`);
        if (!response.ok) throw new Error('Ошибка сервера');
        allUnis = await response.json();
    } catch (e) {
        console.error("БАЗА ДАННЫХ НЕ ОТВЕЧАЕТ! Использую демо-данные.");
        allUnis = [
            { id: 1, name: "КГТУ им. Раззакова", city: "Бишкек", min_ort: 110, rating: 4.8, tuition_fee: 65000 },
            { id: 2, name: "АУЦА", city: "Бишкек", min_ort: 140, rating: 4.9, tuition_fee: 480000 },
            { id: 3, name: "КТУ Манас", city: "Бишкек", min_ort: 145, rating: 4.7, tuition_fee: 0 }
        ];
    }
    
    // Если пользователь вошел, меняем текст кнопки входа
    if (currentUser) {
        const authBtn = document.getElementById('auth-btn-main');
        if (authBtn) authBtn.innerText = currentUser.fullname.split(' ')[0].toUpperCase();
    }

    renderTop3();
    renderCards();
    updateUI();
}

// 2. ФУНКЦИЯ ЧАСТИЦ (Particles.js)
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#00f2ff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.2 },
                "size": { "value": 2 },
                "line_linked": { "enable": true, "distance": 150, "color": "#00f2ff", "opacity": 0.2, "width": 1 },
                "move": { "enable": true, "speed": 1.5 }
            },
            "interactivity": { "events": { "onhover": { "enable": true, "mode": "repulse" } } }
        });
    }
}

// 3. АУТЕНТИФИКАЦИЯ (Вход и Регистрация)
function switchAuthTab(tab) {
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-reg');
    const loginTab = document.getElementById('tab-login');
    const regTab = document.getElementById('tab-reg');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        loginTab.classList.add('active');
        regTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        regTab.classList.add('active');
        loginTab.classList.remove('active');
    }
}

async function handleAuth(type) {
    if (type === 'reg') {
        const fullname = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Регистрация успешна! Войдите в аккаунт.");
                switchAuthTab('login');
            } else alert(data.error);
        } catch (e) { alert("Сервер регистрации недоступен"); }
    } 
    else if (type === 'login') {
        const email = document.getElementById('logEmail').value;
        const password = document.getElementById('logPass').value;

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                location.reload();
            } else alert(data.error);
        } catch (e) { alert("Сервер авторизации недоступен"); }
    }
}

// 4. ВЫВОД ТОП-3
function renderTop3() {
    const container = document.getElementById('top-three');
    if (!container) return;
    const top3 = [...allUnis].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    
    container.innerHTML = top3.map((u, i) => `
        <div class="top-uni-card">
            <div class="rank">LEVEL_0${i+1}</div>
            <div style="font-family: 'Orbitron'; font-size: 16px; margin: 10px 0;">${u.name}</div>
            <div style="color: var(--primary); font-weight: bold;">⭐ ${u.rating || '4.5'}</div>
        </div>
    `).join('');
}

// 5. ОТРИСОВКА КАРТОЧЕК
function renderCards(target = 'uni-cards', data = allUnis) {
    const container = document.getElementById(target);
    const score = parseInt(document.getElementById('userOrt')?.value) || 0;
    if (!container) return;

    container.innerHTML = data.map(u => {
        const isFav = favorites.includes(u.id);
        const inComp = compareList.includes(u.id);
        let chance = score > 0 ? Math.min(Math.round((score / u.min_ort) * 100), 100) : 0;
        let color = chance >= 100 ? '#00ff88' : (chance > 75 ? '#f59e0b' : '#ff0055');

        return `
            <div class="card ${inComp ? 'comp-active' : ''}">
                <div class="card-header">
                    <span class="rating">⭐ ${u.rating || '4.5'}</span>
                    <button class="fav-btn" onclick="toggleFavorite(${u.id})">${isFav ? '❤️' : '🤍'}</button>
                </div>
                <h2>${u.name}</h2>
                <div class="info">📍 ${u.city} | Порог: ${u.min_ort}</div>
                ${score > 0 ? `
                    <div class="chance-label" style="color:${color}; font-size: 12px; margin-top: 10px;">ШАНС: ${chance}%</div>
                    <div class="bar-bg"><div class="bar-fill" style="width:${chance}%; background:${color}"></div></div>
                ` : ''}
                <div class="tuition">${(u.tuition_fee || 0).toLocaleString()} SOM</div>
                <button class="btn-compare" onclick="toggleCompare(${u.id})">
                    ${inComp ? 'УДАЛИТЬ ИЗ VS' : 'В СПИСОК СРАВНЕНИЯ'}
                </button>
            </div>
        `;
    }).join('');
}

// 6. СИСТЕМА СРАВНЕНИЯ
function toggleCompare(id) {
    const idx = compareList.indexOf(id);
    if (idx > -1) compareList.splice(idx, 1);
    else if (compareList.length < 2) compareList.push(id);
    else alert("Можно сравнивать только 2 ВУЗа одновременно!");
    
    updateCompareBar();
    renderCards();
}

function updateCompareBar() {
    const bar = document.getElementById('compare-bar');
    if (bar) bar.style.display = compareList.length > 0 ? 'flex' : 'none';
    const info = document.getElementById('compare-info');
    if (info) info.innerText = `Выбрано: ${compareList.length}/2`;
}

function startComparison() {
    if (compareList.length < 2) return alert("Выберите второй ВУЗ!");
    const u1 = allUnis.find(u => u.id === compareList[0]);
    const u2 = allUnis.find(u => u.id === compareList[1]);
    alert(`АНАЛИЗ VS:\n\n${u1.name} vs ${u2.name}\n\nПорог ОРТ: ${u1.min_ort} / ${u2.min_ort}\nЦена: ${u1.tuition_fee} / ${u2.tuition_fee}`);
}

// 7. ИЗБРАННОЕ И НАВИГАЦИЯ
function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index === -1) favorites.push(id);
    else favorites.splice(index, 1);
    localStorage.setItem('favUnis', JSON.stringify(favorites));
    updateUI();
    renderCards();
}

function showSection(name) {
    const sections = ['main-section', 'favorites-section', 'catalog-section'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    
    const target = document.getElementById(`${name}-section`);
    if (target) target.style.display = 'block';
    
    if (name === 'favorites') {
        const favData = allUnis.filter(u => favorites.includes(u.id));
        renderCards('fav-cards', favData);
    }
    if (name === 'catalog') renderTable();
}

function renderTable() {
    const body = document.getElementById('table-body');
    if (body) body.innerHTML = allUnis.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.city}</td>
            <td>${u.min_ort}</td>
            <td>${(u.tuition_fee || 0).toLocaleString()} SOM</td>
        </tr>
    `).join('');
}

function updateUI() { 
    const favCount = document.getElementById('fav-count');
    if (favCount) favCount.innerText = favorites.length; 
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

window.onload = init;