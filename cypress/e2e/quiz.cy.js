const home = require('../support/elements/home.json')
const quiz = require('../support/elements/quiz.json')

describe('Quiz section', () => {
    it('validate layout of Quiz', () => {
        cy.visit('/')
        cy.get(home.quiz_open_a).click()
        cy.validateLayout(true, false)
        cy.get(quiz.title_h1).should('be.visible').highlight()
        cy.get(quiz.desc_p).should('be.visible').highlight()
        cy.get(quiz.tooltip_info_p).should('be.visible').highlight()

        cy.get(quiz.quiz_container_div).should('be.visible').highlight()
        cy.get(quiz.quiz_category_span).should('be.visible').highlight()
        cy.get(quiz.current_question_span).should('be.visible').highlight()
        cy.get(quiz.total_questions_span).should('be.visible').highlight()
        cy.get(quiz.quiz_start_title_h3).should('be.visible').highlight()
        cy.get(quiz.quiz_start_desc_p).should('be.visible').highlight()
        cy.get(quiz.quiz_start_button_btn).should('be.visible').highlight()

        cy.get(quiz.ranking_section).should('be.visible').highlight()
        cy.get(quiz.ranking_daily_btn).should('be.visible').highlight()
        cy.get(quiz.ranking_montly_btn).should('be.visible').highlight()
    })

    it('validate Quiz ranking', () => {
        cy.fixture("mocks/quiz/ranking").then(mockedRanking => {
            cy.intercept('**/api/quiz/ranking', {
                statusCode: 200,
                body: mockedRanking
            }).as('quizRanking')

            cy.visit('/')
            cy.get(home.quiz_open_a).click()
            cy.wait('@quizRanking')

            cy.get(quiz.ranking_daily_table).find('tbody tr').then(tr => {
                for (let i = 0; i < 9; i++) {
                    cy.get(tr).eq(i).highlightBlue().then(current => {
                        const scoreCurrent = parseFloat(current.find('td:eq(2)').text().replace(',', '.'))
                        const dateTimeCurrent = getTimeFromBrazilianDateTime(current.find('td:eq(4) span:eq(0)').text(), current.find('td:eq(4) span:eq(1)').text())
                        cy.get(tr).eq(i + 1).then(next => {
                            const scoreNext = parseFloat(next.find('td:eq(2)').text().replace(',', '.'))
                            const dateTimeNext = getTimeFromBrazilianDateTime(next.find('td:eq(4) span:eq(0)').text(), next.find('td:eq(4) span:eq(1)').text())
                            cy.wrap(scoreCurrent > scoreNext || scoreCurrent === scoreNext && dateTimeCurrent > dateTimeNext).should('be.true')
                            cy.wrap(next).highlightBlue()
                        })
                    })
                }
            })

            cy.get(quiz.ranking_montly_btn).highlight().click()
            cy.get(quiz.ranking_monthly_table).find('tbody tr').then(tr => {
                for (let i = 0; i < 9; i++) {
                    cy.get(tr).eq(i).highlightBlue().then(current => {
                        const scoreCurrent = parseFloat(current.find('td:eq(2)').text().replace(',', '.'))
                        const dateTimeCurrent = getTimeFromBrazilianDateTime(current.find('td:eq(4) span:eq(0)').text(), current.find('td:eq(4) span:eq(1)').text())
                        cy.get(tr).eq(i + 1).then(next => {
                            const scoreNext = parseFloat(next.find('td:eq(2)').text().replace(',', '.'))
                            const dateTimeNext = getTimeFromBrazilianDateTime(next.find('td:eq(4) span:eq(0)').text(), next.find('td:eq(4) span:eq(1)').text())
                            cy.wrap(scoreCurrent > scoreNext || scoreCurrent === scoreNext && dateTimeCurrent > dateTimeNext).should('be.true')
                            cy.wrap(next).highlightBlue()
                        })
                    })
                }
            })
        })
    })

    it('validate E2E Quiz journey', () => {
        cy.visit('/')
        cy.get(home.quiz_open_a).click()

        cy.intercept('**/api/quiz/start-quiz').as('startQuiz')
        cy.get(quiz.quiz_start_button_btn).click().highlight()
        cy.wait('@startQuiz');

        for (let i = 0; i < 10; i++) {
            cy.get(quiz.quiz_option_1_btn).click().scrollIntoView({ offset: { top: -300 } }).wait(700)
            cy.get(quiz.quiz_submit_answer_btn).click().scrollIntoView({ offset: { top: 800 } }).wait(700)
            cy.get(quiz.quiz_next_question_p).click().scrollIntoView({ offset: { top: 800 } }).wait(700)
        }

        cy.get(quiz.quiz_send_ranking_btn).click()
        cy.get(quiz.quiz_ranking_modal_div).should('be.visible')
        cy.get(quiz.quiz_ranking_cancel_btn).click()

        cy.get(quiz.quiz_send_ranking_btn).click()
        cy.get(quiz.quiz_player_name_txt).type('ab')
        cy.get(quiz.quiz_ranking_name_error_p).should('not.be.visible')
        cy.get(quiz.quiz_ranking_submit_btn).click()
        cy.get(quiz.quiz_ranking_name_error_p).should('be.visible')
        cy.get(quiz.quiz_player_name_txt).type('{selectall}{backspace}123456789012345678901').should('have.value', '12345678901234567890')
        const playerName = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`
        cy.get(quiz.quiz_player_name_txt).type(`{selectall}{backspace}${playerName}`)
        cy.intercept('**/api/quiz/ranking').as('quizRanking')
        cy.get(quiz.quiz_ranking_submit_btn).click()
        cy.wait('@quizRanking')

        cy.get(quiz.ranking_daily_table).find('tr:last td:eq(2)').invoke('text').then(lastScore => {
            cy.get(quiz.quiz_final_score_p).invoke('text').then(currentScore => {
                if (parseFloat(currentScore.replace(',', '.')) >= parseFloat(lastScore.replace(',', '.'))) {
                    cy.get(quiz.ranking_daily_table).find(`tr:contains('${playerName}')`).should('be.visible').highlight()
                }
            })
        })
    })
})

function getTimeFromBrazilianDateTime(datePart, timePart) {
    const [day, month, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    const dateObj = new Date(year, month - 1, day, hour, minute, second);
    return dateObj.getTime();
}