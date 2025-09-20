const { defineConfig } = require("cypress");
const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib');
require('dotenv').config();
const readSheetData = require('./src/utils/readSheetData');
const { removeDirectory } = require('cypress-delete-downloads-folder');

module.exports = defineConfig({
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
        reportDir: 'cypress/results',
        charts: true,
        embeddedScreenshots: true,
        inlineAssets: false,
        saveAllAttempts: true,
        overwrite: true,
    },
    e2e: {
        setupNodeEvents(on, config) {
            require('cypress-mochawesome-reporter/plugin')(on)
            on('task', {
                getSheedData(range) {
                    return readSheetData(range)
                },
                removeDirectory
            })
        },
        watchForFileChanges: false,
        baseUrl: 'http://localhost:8080/',
        viewportWidth: 440,
        viewportHeight: 845,
        defaultCommandTimeout: 20000,
        video: true
    },
});