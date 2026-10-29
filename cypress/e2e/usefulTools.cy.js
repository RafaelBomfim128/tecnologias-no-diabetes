const home = require('../support/elements/home.json')
const usefulTools = require('../support/elements/usefulTools.json')

const macroCategories = {
    qrCodeGeneratorSibionics: {
        title: "Gerador de QR Code para Sibionics com Juggluco",
        description: "Gere QR Codes para configurar o sensor Sibionics no aplicativo Juggluco"
    },
    qrCodeGeneratorSmart: {
        title: "Gerador de QR Code para Smart 2 com Juggluco",
        description: "Gere QR Codes para configurar o sensor Smart 2 no aplicativo Juggluco"
    },
    nightscoutTester: {
        title: "Testador de Nightscout",
        description: "Verifique se sua instância Nightscout está funcionando corretamente e valide configurações"
    },
    nightscoutViewer: {
        title: "Visualizador de Glicemias do Nightscout em tabela",
        description: "Visualize suas glicemias do Nightscout de dias anteriores de forma rápida e prática."
    },
    tndScout: {
        title: "Painel de Relatórios Nightscout TnDScout",
        description: "Acesse gráficos e relatórios avançados dos seus dados do Nightscout com o TnDScout"
    },
    vitalDiary: {
        title: "VitalDiary - Diário do Diabetes",
        description: "Registre glicemias, carboidratos e observações da rotina, gere relatórios e acompanhe tempo no alvo, coeficiente de variação e hipo/hiperglicemias"
    },
    cloudflareNightscout: {
        title: "TndScout CloudFlare Edge - Criação de Nightscout pelo CloudFlare",
        description: "Crie um Nightscout com um clique tendo apenas uma conta na CloudFlare"
    }
}

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

    it('generates a QR Code for Juggluco with Sibionics', () => {
        cy.intercept('GET', 'https://api.qrserver.com/**', { statusCode: 200, body: '' })
        cy.visit('/ferramentas.html')
        cy.get(usefulTools.qr_code_generator_sibionics_open_btn).click()
        cy.get(usefulTools.title_h1).should('be.visible')
        cy.get(usefulTools.qr_code_image_img).should('have.attr', 'src', '')
        cy.get(usefulTools.qr_code_generator_1_ipt).should('have.attr', 'maxlength', 2).type('12')
        cy.get(usefulTools.qr_code_generator_2_ipt).should('have.attr', 'maxlength', 18).type('1234567890abcdefgh')
        cy.get(usefulTools.qr_code_image_img).should('be.visible').invoke('attr', 'src').then(src => {
            expect(src.toLowerCase()).to.contain('121234567890abcdefgh')
        })
    })

    it('generates a QR Code for Juggluco with Smart 2', () => {
        cy.intercept('GET', 'https://api.qrserver.com/**', { statusCode: 200, body: '' })
        cy.visit('/ferramentas.html')
        cy.get(usefulTools.qr_code_generator_smart_open_btn).click()
        cy.get('h1').should('contain.text', 'Gerador de QR Code para Smart 2')
        cy.get('#qrCode').should('have.attr', 'src', '')
        cy.get('#qrInput').should('have.attr', 'maxlength', '10').type('1234567890')
        cy.get('#qrCode')
            .should('have.attr', 'alt', 'QR Code gerado com o texto fornecido')
            .and('have.attr', 'src')
            .and('include', 'data=00106958590310112112511171727031610QF25K065%1D211234567890')
    })

    it('validates required fields in the Nightscout tester without making a request', () => {
        cy.visit('/ferramentas.html')
        cy.contains('.card h3', 'Testador de Nightscout')
            .parents('.card')
            .contains('button', 'Acessar')
            .click()
        cy.location('pathname').should('include', '/testador-nightscout.html')
        cy.get('#apiSecretInput').should('have.attr', 'type', 'password')
        cy.get('#testNightscout').click()

        cy.get('#urlError').should('not.have.class', 'hidden-element')
        cy.get('#apiSecretError').should('have.class', 'hidden-element')
        cy.get('.status-list').should('have.class', 'hidden-element')
    })

    it('validates required fields in the Nightscout viewer without making a request', () => {
        cy.visit('/ferramentas.html')
        cy.contains('.card h3', 'Visualizador de Glicemias do Nightscout em tabela')
            .parents('.card')
            .contains('button', 'Acessar')
            .click()
        cy.location('pathname').should('include', '/visualizador-glicemias-nightscout.html')
        cy.get('#dateRangeContainer').should('have.attr', 'data-max-range-days', '3')
        cy.get('#apiSecretInput').should('have.attr', 'type', 'password')
        cy.get('#viewNightscout').click()

        cy.get('#urlError').should('not.have.class', 'hidden-element')
        cy.get('.status-list').should('have.class', 'hidden-element')
    })
})