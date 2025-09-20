const home = require('../support/elements/home.json')
const downloads = require('../support/elements/downloads.json')

describe('Downloads section', () => {
    it('validate layout of Downloads', () => {
        cy.visit('/')
        cy.get(home.downloads_open_a).click()
        cy.validateLayout()
        cy.get(downloads.hero_div).should('be.visible').highlight()
        cy.get(downloads.title_h1).should('be.visible').highlight()
        cy.get(downloads.desc_p).should('be.visible').highlight()
        cy.get(downloads.links_ul).should('be.visible').highlight()
        cy.get(downloads.links_li).should('be.visible').highlight()
        cy.get(downloads.links_li).each($el => {
            cy.wrap($el).find(downloads.button_download_btn).should('be.visible').highlight()
            cy.wrap($el).find(downloads.button_copy_link_btn).should('be.visible').highlight()
        })
    })

    it('validate links of Downloads', () => {
        cy.visit('/')
        cy.get(home.downloads_open_a).click()
        cy.getDownloadsDataSheet().then(data => {
            data.forEach((item, i) => {
                cy.get(downloads.links_li).eq(i).highlight().then($el => {
                    cy.wrap($el).find('span').should('have.text', item.title)
                    cy.wrap($el).find(downloads.button_download_btn).should('have.attr', 'onclick', `window.open('${item.fullUrl}', '_blank')`)
                    cy.wrap($el).find(downloads.button_copy_link_btn).should('have.attr', 'onclick', `copyLink('${item.newLink}', this)`)
                })
            })
        })
    })
})