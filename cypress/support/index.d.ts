declare namespace Cypress {
    interface Chainable<Subject> {
        /**
         * @description Fetches data from the downloads spreadsheet and formats it using downloadsFormatter.
         * @returns {Chainable<any>} Formatted data from the downloads spreadsheet.
         */
        getDownloadsDataSheet(): Chainable<any>

        /**
         * @description Fetches data from the tutorials spreadsheet and formats it using tutorialsFormatter.
         * @returns {Chainable<any>} Formatted data from the tutorials spreadsheet.
         */
        getTutorialsDataSheet(): Chainable<any>

        /**
         * @description Fetches data from the FAQ spreadsheet and formats it using faqFormatter.
         * @returns {Chainable<any>} Formatted data from the FAQ spreadsheet.
         */
        getFaqDataSheet(): Chainable<any>

        /**
         * @description Highlights the element with a yellow border. Must be used after "cy.get".
         */
        highlight(): Chainable<any>

        /**
         * @description Reads the contents of a directory.
         * @param {string} path - The path of the directory to read.
         * @param {string} [extension] - Optional file extension to filter the results.
         * @returns {Chainable<string[]>} An array of filenames in the directory.
         */
        readDirectory(path: string, extension?: string): Chainable<string[]>

        /**
         * @description Validate fixed/common layout elements.
         * @param {boolean} [returnBtn=true] - If true, checks for the return button.
         * @param {boolean} [searchBar=true] - If true, checks for the
         */
        validateLayout(returnBtn?: boolean, searchBar?: boolean): Chainable<any>
    }
}