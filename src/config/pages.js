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
        'Libre': '!bg-none !bg-[#ffd100]',
        'Smart': '!bg-none !bg-[#0e163b]',
        'Sibionics': '!bg-none !bg-[#06bf9d]',
        'Accu-Chek SmartGuide': '!bg-none !bg-[#004969]',
        'Sensores': 'hero-indigo',
        'Dicas e truques': 'hero-pink',
        'Outros': 'hero-teal',
        'Todos os tutoriais': 'hero-gradient-soft'
    };
    return gradientMap[category] || 'hero-blue';
}

// Helper function to get hero text color based on category
function getCategoryTextColor(category) {
    const textColorMap = {
        'Libre': '!text-gray-900',
        'Smart': 'text-white',
        'Sibionics': 'text-white',
        'Accu-Chek SmartGuide': 'text-white'
    };
    return textColorMap[category] || 'text-white';
}

// Helper function to get card icon background based on category
function getCategoryIconBg(category) {
    const iconBgMap = {
        'Libre': 'bg-[#ffd100]',
        'Smart': 'bg-[#0e163b]',
        'Sibionics': 'bg-[#06bf9d]',
        'Accu-Chek SmartGuide': 'bg-[#004969]'
    };
    return iconBgMap[category] || 'bg-gradient-to-br from-teal-500 to-emerald-600';
}

// Helper function to get card icon SVG text color based on category
function getCategoryIconTextColor(category) {
    const iconTextMap = {
        'Libre': '!text-gray-900',
        'Smart': 'text-white',
        'Sibionics': 'text-white',
        'Accu-Chek SmartGuide': 'text-white'
    };
    return iconTextMap[category] || 'text-white';
}

// Helper function to get button background based on category
function getCategoryButtonBg(category) {
    const buttonBgMap = {
        'Libre': 'bg-[#ffd100] hover:bg-[#e6bc00]',
        'Smart': 'bg-[#0e163b] hover:bg-[#0a102c]',
        'Sibionics': 'bg-[#06bf9d] hover:bg-[#05a688]',
        'Accu-Chek SmartGuide': 'bg-[#004969] hover:bg-[#00364d]'
    };
    return buttonBgMap[category] || 'bg-teal-500 hover:bg-teal-600';
}

// Helper function to get button text color based on category
function getCategoryButtonTextColor(category) {
    const buttonTextColorMap = {
        'Libre': '!text-gray-900'
    };
    return buttonTextColorMap[category] || 'text-white';
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
                heroTextColor: getCategoryTextColor(category),
                iconBg: getCategoryIconBg(category),
                iconTextColor: getCategoryIconTextColor(category),
                buttonBg: getCategoryButtonBg(category),
                buttonTextColor: getCategoryButtonTextColor(category),
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
            heroTextColor: getCategoryTextColor('Todos os tutoriais'),
            iconBg: getCategoryIconBg('Todos os tutoriais'),
            iconTextColor: getCategoryIconTextColor('Todos os tutoriais'),
            buttonBg: getCategoryButtonBg('Todos os tutoriais'),
            buttonTextColor: getCategoryButtonTextColor('Todos os tutoriais'),
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
            heroTextColor: getCategoryTextColor('Libre'),
            iconBg: getCategoryIconBg('Libre'),
            iconTextColor: getCategoryIconTextColor('Libre'),
            buttonBg: getCategoryButtonBg('Libre'),
            buttonTextColor: getCategoryButtonTextColor('Libre'),
            apiBaseUrl, apiKey, mostRecentNotificationId
        }
    });

    // smart category
    pages.push({
        template: 'template-tutoriais-item.html',
        output: 'item-tutorial-smart.html',
        data: {
            links: tutorialsFormatted['Smart'],
            title: 'Smart Medlevensohn',
            desc: labels.tutorials.find(item => item.category === 'Smart').description,
            image: labels.tutorials.find(item => item.category === 'Smart').image,
            heroGradient: getCategoryGradient('Smart'),
            heroTextColor: getCategoryTextColor('Smart'),
            iconBg: getCategoryIconBg('Smart'),
            iconTextColor: getCategoryIconTextColor('Smart'),
            buttonBg: getCategoryButtonBg('Smart'),
            buttonTextColor: getCategoryButtonTextColor('Smart'),
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
            heroTextColor: getCategoryTextColor('Sibionics'),
            iconBg: getCategoryIconBg('Sibionics'),
            iconTextColor: getCategoryIconTextColor('Sibionics'),
            buttonBg: getCategoryButtonBg('Sibionics'),
            buttonTextColor: getCategoryButtonTextColor('Sibionics'),
            apiBaseUrl, apiKey, mostRecentNotificationId
        }
    });

    // accu-chek smartguide category
    pages.push({
        template: 'template-tutoriais-item.html',
        output: 'item-tutorial-accu-chek-smartguide.html',
        data: {
            links: tutorialsFormatted['Accu-Chek SmartGuide'],
            title: 'Accu-Chek SmartGuide',
            desc: labels.tutorials.find(item => item.category === 'Accu-Chek SmartGuide').description,
            image: labels.tutorials.find(item => item.category === 'Accu-Chek SmartGuide').image,
            heroGradient: getCategoryGradient('Accu-Chek SmartGuide'),
            heroTextColor: getCategoryTextColor('Accu-Chek SmartGuide'),
            iconBg: getCategoryIconBg('Accu-Chek SmartGuide'),
            iconTextColor: getCategoryIconTextColor('Accu-Chek SmartGuide'),
            buttonBg: getCategoryButtonBg('Accu-Chek SmartGuide'),
            buttonTextColor: getCategoryButtonTextColor('Accu-Chek SmartGuide'),
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

    //useful contents
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
    const seeAllLabel = labels.usefulContents.find(item => item.category === 'Ver tudo') || {};
    pages.push({
        template: 'template-conteudos-uteis.html',
        output: 'conteudos-uteis-total.html',
        data: {
            apiBaseUrl,
            apiKey,
            mostRecentNotificationId,
            pdfs: allPdfs,
            title: 'Todos os conteúdos úteis',
            description: seeAllLabel.description
        }
    });

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

    // tool qr code generator for Juggluco Sibionics
    pages.push({
        template: 'template-gerador-qr-code-juggluco-sibionics.html',
        output: 'gerador-qr-code-juggluco-sibionics.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    // tool qr code generator for Juggluco Smart 2
    pages.push({
        template: 'template-gerador-qr-code-juggluco-smart2.html',
        output: 'gerador-qr-code-juggluco-smart2.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    // tool Nightscout tester
    pages.push({
        template: 'template-testador-nightscout.html',
        output: 'testador-nightscout.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    // tool Nightscout viewer
    pages.push({
        template: 'template-visualizador-glicemias-nightscout.html',
        output: 'visualizador-glicemias-nightscout.html',
        data: { apiBaseUrl, apiKey, mostRecentNotificationId }
    });

    return pages;
};