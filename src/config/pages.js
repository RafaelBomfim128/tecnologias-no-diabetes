// src/config/pages.js
const labels = require('../config/labels.json');
const formatPath = require('../utils/formatPath');

// Helper function to get gradient color class based on category
function getCategoryGradient(category) {
    const gradientMap = {
        'xDrip': 'hero-blue',
        'Android APS': 'hero-green',
        'Nightscout': 'hero-purple',
        'iOS': 'hero-indigo',
        'Relógios': 'hero-teal',
        'Bombas': 'hero-orange',
        'Ponto de partida': 'hero-gradient-soft',
        'Libre': 'hero-blue',
        'AiDEX': 'hero-green',
        'Sibionics': 'hero-purple',
        'Sensores': 'hero-indigo',
        'Dicas e truques': 'hero-pink',
        'Outros': 'hero-teal',
        'Todos os tutoriais': 'hero-gradient-soft'
    };
    return gradientMap[category] || 'hero-blue';
}

module.exports = function buildPages({
    downloadsFormatted,
    tutorialsFormatted,
    faqFormatted,
    notificationsFormatted,
    pdfDataToHtml,
    apiBaseUrl,
    apiKey,
    mostRecentNotificationId
}) {
    const pages = [];

    // index
    pages.push({
        template: 'template-index.html',
        output: 'index.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    // downloads
    pages.push({
        template: 'template-downloads.html',
        output: 'downloads.html',
        data: { links: downloadsFormatted, apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    // tutorials
    pages.push({
        template: 'template-tutoriais.html',
        output: 'tutoriais.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    // sensors
    pages.push({
        template: 'template-tutoriais-sensores.html',
        output: 'tutoriais-sensores.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    // category of tutorials
    const tutorialsTotal = [];
    const addedShortPaths = new Set();
    for (const [category, links] of Object.entries(tutorialsFormatted)) {
        links.forEach(link => {
            if (!addedShortPaths.has(link.shortPath)) {
                tutorialsTotal.push(link);
                addedShortPaths.add(link.shortPath);
            }
        });
        pages.push({
            template: 'template-tutoriais-item.html',
            output: `item-tutorial-${formatPath(category)}.html`,
            data: {
                links,
                title: category,
                desc: labels.tutorials.find(t => t.category === category)?.description || '',
                image: labels.tutorials.find(t => t.category === category)?.image || '',
                heroGradient: getCategoryGradient(category),
                apiBaseUrl, apiKey, mostRecentNotificationId
            }
        });
    }

    // all tutorials
    pages.push({
        template: 'template-tutoriais-item.html',
        output: 'item-tutorial-total.html',
        data: {
            links: tutorialsTotal,
            title: 'Todos os tutoriais',
            desc: 'Todos os tutoriais disponíveis em uma única página.',
            heroGradient: getCategoryGradient('Todos os tutoriais'),
            apiBaseUrl, apiKey, mostRecentNotificationId
        }
    });

    // libre category
    pages.push({
        template: 'template-tutoriais-item.html',
        output: 'item-tutorial-libre.html',
        data: {
            links: tutorialsFormatted['Libre'],
            title: 'Freestyle Libre 1 e 2',
            desc: labels.tutorials.find(item => item.category === 'Libre').description,
            image: labels.tutorials.find(item => item.category === 'Libre').image,
            heroGradient: getCategoryGradient('Libre'),
            apiBaseUrl, apiKey, mostRecentNotificationId
        }
    });

    // aidex category
    pages.push({
        template: 'template-tutoriais-item.html',
        output: 'item-tutorial-aidex.html',
        data: {
            links: tutorialsFormatted['AiDEX'],
            title: 'AiDEX',
            desc: labels.tutorials.find(item => item.category === 'AiDEX').description,
            image: labels.tutorials.find(item => item.category === 'AiDEX').image,
            heroGradient: getCategoryGradient('AiDEX'),
            apiBaseUrl, apiKey, mostRecentNotificationId
        }
    });

    // sibionics category
    pages.push({
        template: 'template-tutoriais-item.html',
        output: 'item-tutorial-sibionics.html',
        data: {
            links: tutorialsFormatted['Sibionics'],
            title: 'Sibionics',
            desc: labels.tutorials.find(item => item.category === 'Sibionics').description,
            image: labels.tutorials.find(item => item.category === 'Sibionics').image,
            heroGradient: getCategoryGradient('Sibionics'),
            apiBaseUrl, apiKey, mostRecentNotificationId
        }
    });

    // faq
    pages.push({
        template: 'template-faq.html',
        output: 'faq.html',
        data: {
            questionAnswer: faqFormatted,
            apiBaseUrl, apiKey, mostRecentNotificationId
        }
    });

    // notifications
    pages.push({
        template: 'template-notificacoes.html',
        output: 'notificacoes.html',
        data: {
            notifications: notificationsFormatted,
            apiBaseUrl, apiKey, mostRecentNotificationId
        }
    });

    // notification opened
    notificationsFormatted.forEach(notification => {
        pages.push({
            template: 'template-notificacao-aberta.html',
            output: `detalhes-aviso-${formatPath(notification.id)}.html`,
            data: {
                notification,
                apiBaseUrl,
                apiKey,
                mostRecentNotificationId
            }
        });
    });

    //quiz
    pages.push({
        template: 'template-quiz.html',
        output: 'quiz.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    const pdfCategoriesPages = [];
    const allPdfs = [];

    for (const [category, pdfs] of Object.entries(pdfDataToHtml)) {
        const labelInfo = labels.usefulContents.find(item => item.category === category) || {};

        // useful contents
        pages.push({
            template: 'template-conteudos-uteis.html',
            output: `${formatPath(category)}.html`,
            data: {
                apiBaseUrl,
                apiKey,
                mostRecentNotificationId,
                pdfs,
                title: labelInfo.category,
                description: labelInfo.description
            }
        });

        allPdfs.push(...pdfs);

        pdfCategoriesPages.push({
            title: labelInfo.category,
            icon: labelInfo.image,
            desc: labelInfo.description,
            url: `${formatPath(category)}.html`
        });
    }

    // useful contents total
    pages.push({
        template: 'template-conteudos-uteis.html',
        output: 'conteudos-uteis-total.html',
        data: {
            apiBaseUrl,
            apiKey,
            mostRecentNotificationId,
            pdfs: allPdfs,
            title: 'Todos os conteúdos úteis',
            description: 'Todos os conteúdos úteis disponíveis em uma única página'
        }
    });

    const seeAllLabel = labels.usefulContents.find(item => item.category === 'Ver tudo') || {};
    pdfCategoriesPages.push({
        title: seeAllLabel.category,
        icon: undefined,
        desc: seeAllLabel.description,
        url: 'conteudos-uteis-total.html'
    });

    // useful contents categories
    pages.push({
        template: 'template-conteudos-uteis-categorias.html',
        output: 'conteudos-uteis-categorias.html',
        data: {
            apiBaseUrl,
            apiKey,
            mostRecentNotificationId,
            categories: pdfCategoriesPages
        }
    });

    // tools
    pages.push({
        template: 'template-ferramentas.html',
        output: 'ferramentas.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    // tool qr code generator for Juggluco
    pages.push({
        template: 'template-gerador-qr-code-juggluco.html',
        output: 'gerador-qr-code-juggluco.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    return pages;
};