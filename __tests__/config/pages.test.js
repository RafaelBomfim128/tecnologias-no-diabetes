const buildPages = require('../../src/config/pages');

describe('buildPages', () => {
    it('builds a consistent page list from representative site data', () => {
        const sharedTutorial = {
            title: 'Tutorial de exemplo',
            shortPath: 'tutorial-de-exemplo',
            fullUrl: 'https://example.com/tutorial'
        };
        const pages = buildPages({
            downloadsFormatted: [{ title: 'Download de exemplo' }],
            tutorialsFormatted: {
                'Categoria de exemplo': [sharedTutorial],
                'Outra categoria': [sharedTutorial]
            },
            faqFormatted: [{ question: 'Pergunta de exemplo' }],
            notificationsFormatted: [{ id: 'aviso-de-exemplo' }],
            pdfDataToHtml: {
                'Cartões de Identificação': [{ title: 'PDF de exemplo' }]
            },
            apiBaseUrl: 'https://api.example.com',
            apiKey: 'test-key',
            mostRecentNotificationId: 'aviso-de-exemplo'
        });
        const outputs = pages.map(page => page.output);
        const pageByOutput = output => pages.find(page => page.output === output);

        expect(pages.length).toBeGreaterThan(0);
        expect(pages).toEqual(expect.arrayContaining([
            expect.objectContaining({ template: 'template-index.html', output: 'index.html' }),
            expect.objectContaining({ template: 'template-downloads.html', output: 'downloads.html' }),
            expect.objectContaining({ template: 'template-tutoriais.html', output: 'tutoriais.html' }),
            expect.objectContaining({ template: 'template-tutoriais-sensores.html', output: 'tutoriais-sensores.html' }),
            expect.objectContaining({ template: 'template-faq.html', output: 'faq.html' }),
            expect.objectContaining({ template: 'template-notificacoes.html', output: 'notificacoes.html' }),
            expect.objectContaining({ template: 'template-ferramentas.html', output: 'ferramentas.html' }),
            expect.objectContaining({ template: 'template-tutoriais-item.html', output: 'item-tutorial-categoria-de-exemplo.html' }),
            expect.objectContaining({ template: 'template-tutoriais-item.html', output: 'item-tutorial-outra-categoria.html' }),
            expect.objectContaining({ template: 'template-tutoriais-item.html', output: 'item-tutorial-total.html' })
        ]));

        expect(pages.every(page =>
            typeof page.template === 'string' &&
            typeof page.output === 'string' &&
            page.data !== null &&
            typeof page.data === 'object'
        )).toBe(true);
        expect(new Set(outputs).size).toBe(outputs.length);
        expect(pageByOutput('item-tutorial-total.html').data.links).toEqual([sharedTutorial]);
        expect(pageByOutput('index.html').data).toMatchObject({
            apiBaseUrl: 'https://api.example.com',
            apiKey: 'test-key',
            mostRecentNotificationId: 'aviso-de-exemplo'
        });
    });
});
