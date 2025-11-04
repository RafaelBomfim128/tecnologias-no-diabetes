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
        cy.get(downloads.links_card_div).should('be.visible').highlight()
        cy.get(downloads.links_card_div).each($el => {
            cy.wrap($el).find(downloads.button_download_btn).should('be.visible').highlight()
            cy.wrap($el).find(downloads.button_copy_link_btn).should('be.visible').highlight()
            cy.wrap($el).find(downloads.short_link_p).should('be.visible').highlight()
        })
    })

    it('validate links of Downloads', () => {
        cy.visit('/')
        cy.get(home.downloads_open_a).click()
        cy.getDownloadsDataSheet().then(data => {
            data.forEach((item, i) => {
                cy.get(downloads.links_card_div).eq(i).highlight().then($el => {
                    cy.wrap($el).find('h3').highlight().invoke('text').then(title => {
                        expect(title.trim()).to.eq(item.title.trim())
                    })
                    cy.wrap($el).find(downloads.button_download_btn).should('have.attr', 'onclick', `window.open('${item.fullUrl}', '_blank')`).highlight()
                    cy.wrap($el).find(downloads.button_copy_link_btn).should('have.attr', 'onclick', `copyDownloadLink('${item.newLink}', this)`).highlight()
                    cy.wrap($el).find(downloads.short_link_p).highlight().invoke('text').then(text => {
                        expect(text.trim()).to.contain(item.newLink)
                    })
                })
            })
        })
    })
})