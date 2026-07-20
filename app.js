let tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const API_BASE = window.location.origin + '/app';
let userData = null;

async function api(path) {
    try {
        const tgId = tg?.initDataUnsafe?.user?.id;
        const url = tgId ? `${API_BASE}${path}&tg_id=${tgId}` : `${API_BASE}${path}`;
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        return { error: 'network_error' };
    }
}

async function init() {
    const tgId = tg?.initDataUnsafe?.user?.id;
    if (!tgId) {
        document.getElementById('content').innerHTML = '<div class="error">Откройте через Telegram бота</div>';
        return;
    }

    // Load user
    const userRes = await fetch(`${API_BASE}/user?tg_id=${tgId}`);
    userData = await userRes.json();

    if (userData && !userData.error) {
        document.getElementById('balance').textContent = `💰 ${userData.balance || 0}₽`;
    }

    // Load tariffs
    loadTariffs();
    loadSubscription();
    loadReferral();

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
            document.getElementById(`page-${btn.dataset.page}`).classList.remove('hidden');
        });
    });
}

async function loadTariffs() {
    const res = await fetch(`${API_BASE}/tariffs`);
    const tariffs = await res.json();
    const container = document.getElementById('tariffs-list');

    if (!Array.isArray(tariffs) || tariffs.length === 0) {
        container.innerHTML = '<div class="loading">Тарифы временно недоступны</div>';
        return;
    }

    container.innerHTML = tariffs.map(t => {
        const traffic = t.traffic_gb === 0 ? '♾ Безлимит' : `${t.traffic_gb} ГБ`;
        return `<div class="tariff-card">
            <h3>${t.name}</h3>
            <div class="price">${t.price}₽</div>
            <div class="info">📅 ${t.duration_days} дней · 📱 ${t.device_limit} устройства · 📊 ${traffic}</div>
            ${t.description ? `<div class="info">${t.description}</div>` : ''}
            <button class="buy-btn" onclick="alert('Оплата через Telegram бота')">Купить</button>
        </div>`;
    }).join('');
}

async function loadSubscription() {
    const tgId = tg?.initDataUnsafe?.user?.id;
    if (!tgId) return;
    const res = await fetch(`${API_BASE}/subscription?tg_id=${tgId}`);
    const sub = await res.json();
    const container = document.getElementById('subscription-info');

    if (!sub || sub.error) {
        container.innerHTML = '<div class="loading">Нет активной подписки</div>';
        return;
    }

    const trafficUsedGB = (sub.traffic_used / (1024 * 1024 * 1024)).toFixed(2);
    const trafficLimit = sub.traffic_gb === 0 ? '♾' : sub.traffic_gb;

    container.innerHTML = `<div class="sub-info">
        <div class="row"><span class="label">Тариф</span><span class="value">${sub.tariff_name}</span></div>
        <div class="row"><span class="label">Сервер</span><span class="value">${sub.server_name || '—'}</span></div>
        <div class="row"><span class="label">Действует до</span><span class="value">${sub.expires_at}</span></div>
        <div class="row"><span class="label">Трафик</span><span class="value">${trafficUsedGB} / ${trafficLimit} ГБ</span></div>
        <div class="row"><span class="label">Устройства</span><span class="value">${sub.device_count}/${sub.device_limit}</span></div>
        ${sub.config_json ? `<div class="config-box">${sub.config_json}</div>` : ''}
    </div>`;
}

async function loadReferral() {
    const container = document.getElementById('referral-info');
    const tgId = tg?.initDataUnsafe?.user?.id;
    if (!tgId) return;

    const res = await fetch(`${API_BASE}/user?tg_id=${tgId}`);
    const user = await res.json();

    if (!user || user.error) {
        container.innerHTML = '<div class="loading">Ошибка загрузки</div>';
        return;
    }

    const botUsername = 'VPNvpnvpn55bot';
    const refLink = `https://t.me/${botUsername}?start=ref_${tgId}`;

    container.innerHTML = `<div class="sub-info">
        <div class="row"><span class="label">Бонусный счёт</span><span class="value">${user.balance || 0}₽</span></div>
        <div class="row"><span class="label">Счёт для вывода</span><span class="value">${user.referral_balance || 0}₽</span></div>
        <div class="label" style="margin-top:16px;margin-bottom:8px;">🔗 Ваша реферальная ссылка:</div>
        <div class="ref-link">${refLink}</div>
        <p style="font-size:13px;color:var(--tg-theme-hint-color,#8e8e93);margin-top:8px;">
            За каждого приглашённого друга вы получаете бонус на счёт и % от его покупок
        </p>
    </div>`;
}

document.addEventListener('DOMContentLoaded', init);
