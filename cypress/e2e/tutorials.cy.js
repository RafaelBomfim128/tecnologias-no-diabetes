const home = require('../support/elements/home.json')
const tutorials = require('../support/elements/tutorials.json')
const labels = require('../../src/config/labels.json')

describe('Tutorials section', () => {
    it('validate layout of Tutorials', () => {
        cy.visit('/')
        cy.get(home.tutorials_open_a).click()
        cy.validateLayout(true, false)
        cy.get(tutorials.hero_div).should('be.visible').highlight()
        cy.get(tutorials.title_h1).should('be.visible').highlight()
        cy.get(tutorials.desc_p).should('be.visible').highlight()
        const macroCategories = [
            'Ponto de partida',
            'xDrip',
            'Android APS',
            'Sensores',
            'Nightscout',
            'iOS',
            'Relógios',
            'Bombas',
            'Outros',
            'Ver Todos os Tutoriais'
        ]
        macroCategories.forEach((item, idx) => {
            cy.get(tutorials.all_cards_div).eq(idx).then($el => {
                const category = $el.find('h2').text()
                expect(category).to.eq(item)
                if (item !== 'Ver Todos os Tutoriais') {
                    cy.wrap($el).find('img').should('be.visible').highlight().should('have.attr', 'src', labels.tutorials.find(t => t.category === category)?.image)
                }
                cy.wrap($el).find('p').should('be.visible').highlight().invoke('text').then(text => expect(text.trim()).to.eq(labels.tutorials.find(t => t.category === category)?.description))
                cy.wrap($el).find('a').should('be.visible').highlight().invoke('attr', 'href').should('not.equal', '')
            })
        })
    })

    it('validate links of Tutorials', () => {
        const allCategories = {
            startPoint: { screen: 'Ponto de partida', sheet: 'Ponto de partida' },
            xDrip: { screen: 'xDrip', sheet: 'xDrip' },
            androidAps: { screen: 'Android APS', sheet: 'Android APS' },
            sensors: {
                screen: 'Sensores',
                children: {
                    libre: { screen: 'Freestyle Libre 1 e 2', sheet: 'Libre' },
                    smart: { screen: 'Smart Medlevensohn', sheet: 'Smart' },
                    sibionics: { screen: 'Sibionics', sheet: 'Sibionics' },
                    accuChekSmartGuide: { screen: 'Accu-Chek SmartGuide', sheet: 'Accu-Chek SmartGuide' }
                }
            },
            nightscout: { screen: 'Nightscout', sheet: 'Nightscout' },
            ios: { screen: 'iOS', sheet: 'iOS' },
            watches: { screen: 'Relógios', sheet: 'Relógios' },
            pumps: { screen: 'Bombas', sheet: 'Bombas' },
            others: { screen: 'Outros', sheet: 'Outros' },
            all: { screen: 'Ver Todos os Tutoriais', sheet: null }
        }

        cy.visit('/')
        let validatedCategories = 0
        cy.getTutorialsDataSheet().then(data => {

            function navigateTo(path) {
                cy.visit('/tutoriais.html')
                path.forEach(screenLabel => {
                    cy.get(tutorials.all_cards_div)
                        .filter(`:contains(${screenLabel})`)
                        .highlight()
                        .find('a')
                        .should('be.visible')
                        .click()
                })
            }

            function validateNode(node, path) {
                cy.log(`🔍 Validating: ${path.join(' → ')}`)
                navigateTo(path)

                if (node.children) { // Is a group (recursion)
                    Object.values(node.children).forEach(child => {
                        validateNode(child, [...path, child.screen])
                    })
                } else if (node.sheet) {// Is not a group (direct links)
                    const itemsSheet = data[node.sheet] || []
                    itemsSheet.forEach((item, idx) => {
                        cy.get(tutorials.all_cards_div).eq(idx).highlight().within(() => {
                            cy.get('h3').invoke('text').then(text => expect(text.trim()).to.eq(item.title.trim()))
                            cy.get(tutorials.button_access_btn).should('be.visible').and('have.attr', 'onclick', `window.open('${item.fullUrl}', '_blank')`)
                            cy.get(tutorials.button_copy_link_btn).should('be.visible').and('have.attr', 'onclick', `copyLink('${item.newLink}', this)`)
                            cy.wait(10)
                        })
                    })
                }
            }

            Object.values(allCategories).forEach(rootNode => {
                if (rootNode.sheet || rootNode.children) validateNode(rootNode, [rootNode.screen])
            })

            const allLinks = Object.values(data).flat()
            const uniqueLinks = Array.from(
                new Map(allLinks.map(item => [item.shortPath, item])).values()
            );

            navigateTo([allCategories.all.screen])

            uniqueLinks.forEach((item, idx) => {
                cy.get(tutorials.all_cards_div).eq(idx).highlight().within(() => {
                    cy.get('h3').invoke('text').then(text => expect(text.trim()).to.eq(item.title.trim()))
                    cy.get(tutorials.button_access_btn).should('be.visible').and('have.attr', 'onclick', `window.open('${item.fullUrl}', '_blank')`)
                    cy.get(tutorials.button_copy_link_btn).should('be.visible').and('have.attr', 'onclick', `copyLink('${item.newLink}', this)`)
                    cy.wait(10)
                })
            })
        })
    })
})