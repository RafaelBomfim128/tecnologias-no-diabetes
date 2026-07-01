const home = require('../support/elements/home.json')
const usefulTools = require('../support/elements/usefulTools.json')

const macroCategories = {
    qrCodeGenerator: {
        title: "Gerador de QR Code para Sibionics com Juggluco",
        description: "Gere QR Codes para configurar o sensor Sibionics no aplicativo Juggluco"
    },
    nightscoutTester: {
        title: "Testador de Nightscout",
        description: "Verifique se sua instância Nightscout está funcionando corretamente e valide configurações"
    }
}

//In development
describe('Useful Tools section', () => {
    it('validate layout of Useful Tools', () => {
        cy.visit('/')
        cy.get(home.useful_tools_open_a).click()
        cy.validateLayout(true, true)
        cy.get(usefulTools.hero_div).should('be.visible').highlight()
        cy.get(usefulTools.title_h1).should('be.visible').highlight()
        cy.get(usefulTools.desc_p).should('be.visible').highlight()

        Object.entries(macroCategories).forEach((item, idx) => {
            cy.get(usefulTools.all_cards_div).eq(idx).then(currentCard => {
                cy.wrap(currentCard).find('h3').should('have.text', item[1].title).highlight()
                cy.wrap(currentCard).find('.card-text').highlight().invoke('text').then(desc => expect(desc.trim()).to.eq(item[1].description))
                cy.wrap(currentCard).find(usefulTools.all_access_button_btn).should('be.visible').highlight()
                cy.wrap(currentCard).find(usefulTools.all_copy_button_btn).should('be.visible').highlight()
            })
        })

        cy.get(usefulTools.info_box_div).should('be.visible').highlight()
    })

    it('validate QR Code Generator for Juggluco with Sibionics', () => {
        cy.visit('/')
        cy.get(home.useful_tools_open_a).click()
        cy.get(usefulTools.qr_code_generator_sibionics_open_btn).click()
        cy.get(usefulTools.title_h1).should('be.visible')
        cy.get(usefulTools.qr_code_image_img).should('have.attr', 'src', '')
        cy.get(usefulTools.qr_code_generator_1_ipt).should('have.attr', 'maxlength', 2).type('12')
        cy.get(usefulTools.qr_code_generator_2_ipt).should('have.attr', 'maxlength', 18).type('1234567890abcdefgh')
        cy.get(usefulTools.qr_code_image_img).should('be.visible').invoke('attr', 'src').then(src => {
            expect(src.toLowerCase()).to.contain('121234567890abcdefgh')
        })
    })
})