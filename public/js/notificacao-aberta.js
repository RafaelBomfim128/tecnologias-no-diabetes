document.addEventListener("DOMContentLoaded", () => {
    const notificationElement = document.querySelector("article[data-id]") || document.querySelector(".notification-opened");
    const notificationId = notificationElement?.dataset.id;

    if (notificationId) {
        let readNotifications = JSON.parse(localStorage.getItem("readNotifications")) || [];

        if (!readNotifications.includes(notificationId)) {
            readNotifications.push(notificationId);
            localStorage.setItem("readNotifications", JSON.stringify(readNotifications));
        }

        if (notificationId === window.env.MOST_RECENT_NOTIFICATION_ID) {
            localStorage.setItem("lastViewedNotification", notificationId);
            const notificationIcon = document.getElementById("notification-icon");
            if (notificationIcon) {
                notificationIcon.src = "./img/sino.png";
            }
        }
    }

    const currentUrl = encodeURIComponent(window.location.href);
    const notificationTitle = (
        document.querySelector('article h1')?.textContent.trim() || 
        document.querySelector('.notification-title')?.textContent.trim() ||
        document.title
    );

    const whatsappButton = document.getElementById('whatsapp-share') || document.querySelector('.share-icon.whatsapp');
    
    if (whatsappButton && notificationTitle) {
        const whatsappText = `${notificationTitle}%0A%0A${currentUrl}`;
        whatsappButton.href = `https://wa.me/?text=${whatsappText}`;
    }
});