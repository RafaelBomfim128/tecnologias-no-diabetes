const home = require('../support/elements/home.json')
const usefulContents = require('../support/elements/usefulContents.json')

//In development
describe('Useful Contents section', () => {
    it('validate layout of Useful Contents', () => {
        cy.visit('/')
        cy.get(home.useful_contents_open_a).click()
        cy.validateLayout(true, false)
        cy.get(usefulContents.hero_div).should('be.visible').highlight()
        cy.get(usefulContents.title_h1).should('be.visible').highlight()
        cy.get(usefulContents.desc_p).should('be.visible').highlight()
        const macroCategories = [
            'Cartões de Identificação',
            'Conscientização nas Escolas (para pais)',
            'Diversos',
            'Educação em Diabetes',
            'Viagem de Avião',
            'Área Kids no Diabetes',
            'Ver tudo',
        ]
        // macroCategories.forEach((item, idx) => {
        //     cy.get(tutorials.all_cards_div).eq(idx).then($el => {
        //         const category = $el.find('h5').text()
        //         expect(category).to.eq(item)
        //         if (item !== 'Ver tudo') {
        //             cy.wrap($el).find('img').should('be.visible').highlight().should('have.attr', 'src', labels.tutorials.find(t => t.category === category)?.image)
        //         }
        //         cy.wrap($el).find('p').should('be.visible').highlight().should('have.text', labels.tutorials.find(t => t.category === category)?.description)
        //         cy.wrap($el).find('a').should('be.visible').highlight().invoke('attr', 'href').should('not.equal', '')
        //     })
        // })
    })
})