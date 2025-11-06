function attachAutoHeight(answer) {
    const setHeight = () => {
        answer.style.maxHeight = answer.scrollHeight + 10 + 'px';
    };

    let ro;
    if ('ResizeObserver' in window) {
        ro = new ResizeObserver(setHeight);
        ro.observe(answer);
    }

    const imgs = Array.from(answer.querySelectorAll('img'));
    const imgListeners = [];
    imgs.forEach(img => {
        if (!img.complete) {
            const onLoad = () => setHeight();
            img.addEventListener('load', onLoad, { once: true });
            imgListeners.push({ img, onLoad });
        }
    });

    const timeouts = [0, 200, 600, 1200].map(ms => setTimeout(setHeight, ms));

    return function detach() {
        timeouts.forEach(t => clearTimeout(t));
        imgListeners.forEach(({ img, onLoad }) => img.removeEventListener('load', onLoad));
        if (ro) ro.disconnect();
    };
}

function openAnswer(button, answer) {
    if (button.classList.contains('active')) return;
    button.classList.add('active');
    answer.style.paddingTop = '10px';
    answer.style.paddingBottom = '10px';
    answer._detachAutoHeight && answer._detachAutoHeight();
    answer._detachAutoHeight = attachAutoHeight(answer);
    answer.style.maxHeight = answer.scrollHeight + 10 + 'px';
}

function closeAnswer(button, answer) {
    if (!button.classList.contains('active')) return;
    button.classList.remove('active');
    answer.style.maxHeight = '0';
    answer.style.paddingTop = '0';
    answer.style.paddingBottom = '0';
    if (answer._detachAutoHeight) {
        answer._detachAutoHeight();
        delete answer._detachAutoHeight;
    }
}

document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const answer = button.nextElementSibling;
        if (button.classList.contains('active')) {
            closeAnswer(button, answer);
        } else {
            openAnswer(button, answer);
        }
    });

    button.addEventListener('touchend', () => {
        button.classList.remove('hover');
    });
});

//Compartilhamento de perguntas do FAQ via WhatsApp
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.faq-item').forEach((faqItem) => {
        const faqId = faqItem.getAttribute('data-id');
        const faqQuestion = faqItem.querySelector('.faq-question').textContent.trim();
        const currentUrl = `${window.location.origin}${window.location.pathname}?id=${faqId}`;

        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(faqQuestion)}%0A%0A${encodeURIComponent(currentUrl)}`;

        const whatsappIcon = faqItem.querySelector('.share-icon.whatsapp');
        whatsappIcon.href = whatsappLink;
    });
});

//Scrolla para a pergunta do FAQ e abre a resposta
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const faqId = urlParams.get('id');

    if (faqId) {
        const targetFaq = document.querySelector(`.faq-item[data-id="${faqId}"]`);

        if (targetFaq) {
            const button = targetFaq.querySelector('.faq-question');
            const answer = button.nextElementSibling;
            openAnswer(button, answer);

            targetFaq.classList.add('highlighted');
            requestAnimationFrame(() => {
                targetFaq.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }
});
