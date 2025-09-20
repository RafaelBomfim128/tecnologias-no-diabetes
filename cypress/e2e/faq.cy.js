const home = require('../support/elements/home.json')
const faq = require('../support/elements/faq.json')

describe('FAQ section', () => {
    it('validate layout of FAQ', () => {
        cy.visit('/')
        cy.get(home.faq_open_a).click()
        cy.validateLayout()
        cy.get(faq.hero_div).should('be.visible').highlight()
        cy.get(faq.title_h1).should('be.visible').highlight()
        cy.get(faq.desc_p).should('be.visible').highlight()
        cy.get(faq.faq_item_div).each($el => {
            cy.wrap($el)
                .find(faq.faq_question_btn)
                .should('be.visible').highlight()
                .click()
            cy.wrap($el)
                .find(faq.faq_answer_div)
                .should('be.visible').highlight()
                .find(faq.faq_share_item_a)
                .should('be.visible').highlight()
                .find(faq.faq_share_item_img)
                .should('be.visible').highlight()
        })
    })

    it('validate data of FAQ', () => {
        cy.visit('/')
        cy.get(home.faq_open_a).click()
        cy.getFaqDataSheet().then(data => {
            data.forEach((item, idx) => {
                cy.get(faq.faq_item_div).eq(idx).then($el => {
                    cy.wrap($el)
                        .find(faq.faq_question_btn)
                        .should('be.visible').highlight()
                        .then($question => {
                            cy.wrap($question).invoke('text')
                                .then(actualText => {
                                    expect(normalizeText(actualText)).to.eq(normalizeText(item.question))
                                })
                            cy.wrap($question).click()
                        })

                    cy.wrap($el)
                        .find(faq.faq_answer_div)
                        .should('be.visible').highlight()
                        .then($answer => {
                            cy.wrap($answer).invoke('text')
                                .then(actualText => {
                                    expect(normalizeText(actualText)).to.eq(normalizeText(item.answer))
                                })
                            cy.wrap($answer)
                            .find(faq.faq_share_item_a)
                            .invoke('attr', 'href')
                            .should('include', item.id)
                        })
                })
            })
        })
    })
})

function normalizeText(text) {
    return text
        .replace(/<img[^>]*>/gi, '')
        .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}
