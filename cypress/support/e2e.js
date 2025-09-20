import './commands'
require('dotenv').config();

import 'cypress-mochawesome-reporter/register'

beforeEach(() => {
    cy.deleteDownloadsFolder();
    const disableCache = (win) => {
        const original = win.fetch;
        win.fetch = (...args) => original(...args, { cache: "no-store" }); //Disable cache disk for requests (fix encrypted-questions.json issue)
    };
    cy.on('window:before:load', win => disableCache(win));
});

Cypress.on('test:after:run', (test, runnable) => {
    if (Cypress.config('video')) {
        // assuming the videos are stored in "cypress/videos"
        const videoFile = `../videos/${Cypress.spec.name}.mp4`
        if (Cypress.Mochawesome) {
            Cypress.Mochawesome.context.push(videoFile)
        }
    }
})