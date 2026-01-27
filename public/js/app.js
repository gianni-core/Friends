async function req(url, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (res.status === 401) window.location.href = '/login.html';
    return res.json();
}

function renderStats(user, containerId) {
    const container = document.getElementById(containerId);
    let html = `<h3>${user.username}</h3>`;
    ['bonte', 'humour', 'sociabilite', 'confiance', 'respect', 'dopamine'].forEach(stat => {
        html += `
        <div class="stat-row">
            <span class="stat-label">${stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
            <div class="progress-bar"><div class="fill" style="width: ${user[stat]}%"></div></div>
        </div>`;
    });
    container.innerHTML = html;
}
