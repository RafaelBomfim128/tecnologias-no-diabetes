require('dotenv').config();

const { apiBaseUrl, apiKey, NODE_ENV } = require('./config/constants')
const readSheetData = require('./utils/readSheetData');
const updateSheetLinks = require('./services/sheetUpdater');
const formatLinksDownloads = require('./formatters/downloadsFormatter');
const formatLinksTutorials = require('./formatters/tutorialsFormatter');
const formatFaqData = require('./formatters/faqFormatter')
const formatNotificationsData = require('./formatters/notificationsFormatter')
const generateEncryptedQuizFile = require('./generators/generateEncryptedQuizFile');
const generateRedirects = require('./generators/generateRedirects');
const { generateAllThumbnails } = require('./generators/thumbnailGenerator');
const buildPages = require('./config/pages');
const { renderToFile } = require('./templates/htmlCompiler');
const exportToTempFile = require('./utils/debugExporter.js');

async function main() {
    const downloads = await readSheetData('Downloads!A:D');
    const tutorials = await readSheetData('Tutoriais!A:E');
    const faq = await readSheetData('FAQ!A:C');
    const notifications = await readSheetData('Avisos!A:D');
    const quiz = await readSheetData('Quiz!A:J');

    const downloadsFormatted = formatLinksDownloads(downloads);
    const tutorialsFormatted = formatLinksTutorials(tutorials);
    const faqFormatted = formatFaqData(faq);
    const notificationsFormatted = formatNotificationsData(notifications);

    await generateRedirects(downloads, tutorials)
    await generateEncryptedQuizFile(quiz);

    if (NODE_ENV !== 'read_only') {
        await updateSheetLinks('Downloads', 'E', downloads);
        await updateSheetLinks('Tutoriais', 'F', tutorials);
    }

    const pdfDataToHtml = await generateAllThumbnails();
    const mostRecentNotificationId = notificationsFormatted[0]?.id || '';

    const pages = buildPages({
        downloadsFormatted,
        tutorialsFormatted,
        faqFormatted,
        notificationsFormatted,
        pdfDataToHtml,
        apiBaseUrl,
        apiKey,
        mostRecentNotificationId
    });

    for (const page of pages) {
        renderToFile(page.template, page.output, page.data);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error("Erro durante a execução do script:", error);
        process.exit(1);
    });
}