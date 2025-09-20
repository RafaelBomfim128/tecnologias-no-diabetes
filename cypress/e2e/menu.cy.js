const layout = require('../support/elements/layout.json')

describe('Menu tests', () => {
    it('test visibility and redirects of menu', () => {
        const menuLinks = [
            { option: layout.menu_home_a, link: '/index.html' },
            { option: layout.menu_downloads_a, link: '/downloads.html' },
            { option: layout.menu_tutorials_a, link: '/tutoriais.html' },
            { option: layout.menu_faq_a, link: '/faq.html' },
            { option: layout.menu_quiz_a, link: '/quiz.html' },
            { option: layout.menu_useful_contents_a, link: '/conteudos-uteis-categorias.html' },
            { option: layout.menu_useful_tools_a, link: '/ferramentas.html' },
            { option: layout.menu_notifications_a, link: '/notificacoes.html' }
        ]

        cy.visit('/')
        cy.get(layout.menu_btn).should('be.visible').highlight().click()
        cy.get(layout.menu_sidenav_div).should('be.visible').find('a').should('have.length', menuLinks.length + 1) //+1 because close button
        cy.get(layout.menu_close_a).should('be.visible').highlight().click()
        cy.get(layout.menu_sidenav_div).should('not.be.visible')

        menuLinks.forEach(item => {
            cy.get(layout.menu_btn).should('be.visible').highlight().click()
            cy.get(layout.menu_sidenav_div).should('be.visible')
            cy.get(item.option).should('be.visible').highlight().click()
            cy.get(layout.menu_sidenav_div).should('not.be.visible')
            cy.url().should('include', item.link)
        })
    })
})