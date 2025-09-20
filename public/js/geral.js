let getDailyViewsInterval;
let getMonthlyViewsInterval;
let getTotalViewsInterval;
let apiBaseUrl;
let apiKey;

try {
    apiBaseUrl = window.env.API_BASE_URL;
    apiKey = window.env.API_KEY.replace(/&quot;/g, '');

    if (!apiBaseUrl || !apiKey) {
        throw new Error('Variáveis de ambiente estão indefinidas ou inválidas.');
    }
} catch (error) {
    console.error('Erro ao obter variáveis de ambiente:', error);
}

function toggleCategory(element, categoryName) {
    const content = document.getElementById('content-' + categoryName);
    const arrow = element.querySelector('.arrow');

    arrow.classList.toggle('active');

    if (content.style.display === 'block' || content.style.display === '') {
        content.style.display = 'none';
    } else {
        content.style.display = 'block';
    }
}

function toggleNav() {
    var sidenav = document.getElementById("my-sidenav");
    sidenav.classList.toggle("active");
    if (sidenav.classList.contains("active")) {
        document.addEventListener('click', closeNavOnClickOutside);
    } else {
        document.removeEventListener('click', closeNavOnClickOutside);
    }
}

function closeNav() {
    var sidenav = document.getElementById("my-sidenav");
    sidenav.classList.remove("active");
    document.removeEventListener('click', closeNavOnClickOutside);
}

function closeNavOnClickOutside(event) {
    var sidenav = document.getElementById("my-sidenav");
    var menuButton = document.querySelector('.menu-icon');
    if (!sidenav.contains(event.target) && !menuButton.contains(event.target)) {
        closeNav();
    }
}

function copyLink(link, button, completeLink = false) {
    if (completeLink) {
        const formattedLink = link.replace(/^\.\/+/, "");
        link = window.location.pathname.includes('/public/') ? window.location.origin + '/public/' + formattedLink : window.location.origin + '/' + formattedLink;
    }
    navigator.clipboard.writeText(link)
        .then(() => {
            button.style.backgroundColor = 'green';
            button.textContent = 'Link copiado!';
            setTimeout(() => {
                button.style.backgroundColor = '';
                button.textContent = 'Copiar Link';
            }, 3000);
        })
        .catch(() => {
            button.style.backgroundColor = 'red';
            button.textContent = 'Erro!';
            setTimeout(() => {
                button.style.backgroundColor = '';
                button.textContent = 'Copiar Link';
            }, 3000);
        });
}


async function getDailyViews() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/dailyviews`);
        if (response.ok) {
            const data = await response.json();
            const viewCountElement = document.getElementById('daily-views');
            viewCountElement.textContent = data.counter;
        } else {
            console.error('Erro ao obter contador:', response.status);
        }
    } catch (error) {
        console.error('Erro na requisição GET:', error);
    }
}

async function getMonthlyViews() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/monthlyviews`);
        if (response.ok) {
            const data = await response.json();
            const viewCountElement = document.getElementById('monthly-views');
            viewCountElement.textContent = data.counter;
        } else {
            console.error('Erro ao obter contador:', response.status);
        }
    } catch (error) {
        console.error('Erro na requisição GET:', error);
    }
}

async function getTotalViews() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/totalviews`);
        if (response.ok) {
            const data = await response.json();
            const viewCountElement = document.getElementById('total-views');
            viewCountElement.textContent = data.counter;
        } else {
            console.error('Erro ao obter contador:', response.status);
        }
    } catch (error) {
        console.error('Erro na requisição GET:', error);
    }
}

async function incrementViews() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/incrementViews`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            getDailyViews();
            getMonthlyViews();
            getTotalViews();
        } else {
            console.error('Erro ao incrementar contador:', response.status);
        }
    } catch (error) {
        console.error('Erro na requisição POST:', error);
    }
}

function startAutoUpdateViews() {
    getDailyViewsInterval = setInterval(getDailyViews, 10000);
    getMonthlyViewsInterval = setInterval(getMonthlyViews, 10000);
    getTotalViewsInterval = setInterval(getTotalViews, 10000);
}

function stopAutoUpdateViews() {
    if (getDailyViewsInterval) {
        clearInterval(getDailyViewsInterval);
    }
    if (getMonthlyViewsInterval) {
        clearInterval(getMonthlyViewsInterval);
    }
    if (getTotalViewsInterval) {
        clearInterval(getTotalViewsInterval);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const isLocal = window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    if (!isLocal) {
        Promise.all([
            getDailyViews(),
            getMonthlyViews(),
            getTotalViews(),
        ]).then(() => {
            incrementViews();
            startAutoUpdateViews();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                setTimeout(() => {
                    getDailyViews();
                    getMonthlyViews();
                    getTotalViews();
                }, 1000);
                startAutoUpdateViews();
            } else {
                stopAutoUpdateViews();
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const notificationIcon = document.getElementById("notification-icon");
    const mostRecentNotificationId = window.env.MOST_RECENT_NOTIFICATION_ID;
    const lastViewedNotificationId = localStorage.getItem("lastViewedNotification");

    if ((!lastViewedNotificationId || lastViewedNotificationId !== mostRecentNotificationId) && notificationIcon) {
        notificationIcon.src = "./img/sino-nao-lida.png";
    }

    const notificationBell = document.querySelector(".notification-bell a");
    if (notificationBell) {
        notificationBell.addEventListener("click", () => {
            localStorage.setItem("lastViewedNotification", mostRecentNotificationId);
            notificationIcon.src = "./img/sino.png";
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const currentUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);

    document.querySelector('.share-btn.fb').href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
    document.querySelector('.share-btn.twitter').href = `https://twitter.com/intent/tweet?url=${currentUrl}&text=${pageTitle}`;
    document.querySelector('.share-btn.whatsapp').href = `https://wa.me/?text=${pageTitle}%20${currentUrl}`;
    document.querySelector('.share-btn.linkedin').href = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}&title=${pageTitle}`;
});
