const home = require('../support/elements/home.json')
const usefulContents = require('../support/elements/usefulContents.json')
const labels = require('../../src/config/labels.json')

// Helper function to get filename without extension
function getBaseName(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

function getBaseNameFromPath(path) {
    const filename = path.split('/').pop();
    return getBaseName(filename);
}

describe('Useful Contents section', () => {
    const macroCategories = labels.usefulContents.map(item => item.category)

    it('validate layout of Useful Contents', () => {
        cy.visit('/')
        cy.get(home.useful_contents_open_a).click()
        cy.validateLayout(true, false)
        cy.get(usefulContents.hero_div).should('be.visible').highlight()
        cy.get(usefulContents.title_h1).should('be.visible').highlight()
        cy.get(usefulContents.desc_p).should('be.visible').highlight()

        macroCategories.forEach((item, idx) => {
            cy.get(usefulContents.all_cards_div).eq(idx).then($el => {
                const category = $el.find('h5').text().trim()
                expect(category).to.eq(item)
                if (item !== 'Ver tudo') {
                    cy.wrap($el).find('img').should('be.visible').highlight().should('have.attr', 'src', labels.usefulContents.find(item => item.category === category)?.image)
                }
                cy.wrap($el).find('p').should('be.visible').highlight().invoke('text').then(text => expect(text.trim()).to.eq(labels.usefulContents.find(item => item.category === category)?.description))
                cy.wrap($el).find('a').should('be.visible').highlight().invoke('attr', 'href').should('not.equal', '')
            })
        })

        cy.get(usefulContents.disclaimer_text_p).should('be.visible').highlight()
    })

    it('validate contents of Useful Contents', () => {
        cy.visit('/')
        cy.get(home.useful_contents_open_a).click()

        console.log(macroCategories)

        macroCategories.forEach(category => {
            cy.visit('/conteudos-uteis-categorias.html')
            cy.get(usefulContents.all_cards_div).filter(`:has(h5:contains(${category}))`).find('a').click()
            if (category !== 'Ver tudo') {
                cy.get(usefulContents.item_title_h1).should('be.visible').highlight().invoke('text').then(text => expect(text.trim()).to.eq(category))
                cy.readDirectory(`public/pdfs/${category}`).then(files => {
                    for (let i = 0; i < files.length; i++) {
                        cy.get(usefulContents.all_items_div).eq(i).then($card => {
                            cy.wrap($card).children('a').then($a => {
                                cy.wrap($a).invoke('attr', 'href').then(href => expect(getBaseNameFromPath(href)).to.eq(getBaseName(files[i])))
                                cy.wrap($a).children('img').invoke('attr', 'src').then(src => expect(getBaseNameFromPath(src)).to.eq(getBaseName(files[i])))
                            })
                            cy.wrap($card).find(usefulContents.item_title_a).highlight().invoke('attr', 'href').then(href => expect(getBaseNameFromPath(href)).to.eq(getBaseName(files[i])))
                            cy.wrap($card).find(usefulContents.item_title_a).should('contain.text', files[i])
                            cy.wrap($card).find(usefulContents.download_button_a).invoke('attr', 'href').then(href => expect(getBaseNameFromPath(href)).to.eq(getBaseName(files[i])))
                            cy.wrap($card).find(usefulContents.download_button_a).should('have.attr', 'download')
                            cy.wait(1)
                        })
                    }
                })
            } else {
                let totalFiles
                cy.readDirectory('public/pdfs').then(files => {
                    totalFiles = 0
                    macroCategories.forEach(category => {
                        if (category !== 'Ver tudo') {
                            cy.readDirectory(`public/pdfs/${category}`).then(catFiles => {
                                totalFiles += catFiles.length
                            })
                        }
                    })
                }).then(() => {
                    cy.get(usefulContents.all_items_div).should('have.length', totalFiles)
                })
            }
        })
    })
})