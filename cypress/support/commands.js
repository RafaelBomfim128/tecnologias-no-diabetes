const layout = require('../support/elements/layout.json')
const downloadsFormatter = require('../../src/formatters/downloadsFormatter')
const tutorialsFormatter = require('../../src/formatters/tutorialsFormatter')
const faqFormatter = require('../../src/formatters/faqFormatter')

require('cypress-delete-downloads-folder').addCustomCommand();

Cypress.Commands.add('highlight', { prevSubject: 'element' }, $el => {
    $el[0].scrollIntoView()
    $el.css('border', '2px solid yellow')
    return $el
})

Cypress.Commands.add('highlightBlue', { prevSubject: 'element' }, $el => {
    $el[0].scrollIntoView()
    $el.css('border', '2px solid blue')
    return $el
})

Cypress.Commands.add('validateLayout', (returnBtn = true, searchBar = true) => {
    cy.get(layout.view_counter_div).should('be.visible').highlight()
    cy.get(layout.notification_icon_img).should('be.visible').highlight()
    cy.get(layout.menu_btn).should('be.visible').highlight()
    if (returnBtn) cy.get(layout.return_a).should('be.visible').highlight()
    if (searchBar) cy.get(layout.search_bar_ipt).should('be.visible').highlight()
    cy.get(layout.share_section_div).should('be.visible').highlight()
    cy.get(layout.share_button_fb_a).should('be.visible').highlight()
    cy.get(layout.share_button_twitter_a).should('be.visible').highlight()
    cy.get(layout.share_button_whatsapp_a).should('be.visible').highlight()
    cy.get(layout.share_button_linkedin_a).should('be.visible').highlight()
    cy.get(layout.footer_p).should('be.visible').highlight()
})

Cypress.Commands.add('getDownloadsDataSheet', () => {
    cy.task('getSheedData', 'Downloads!A:C').then(result => {
        return downloadsFormatter(result)
    })
})

Cypress.Commands.add('getTutorialsDataSheet', () => {
    cy.task('getSheedData', 'Tutoriais!A:D').then(result => {
        return tutorialsFormatter(result)
    })
})

Cypress.Commands.add('getFaqDataSheet', () => {
    cy.task('getSheedData', 'FAQ!A:C').then(result => {
        return faqFormatter(result)
    })
})