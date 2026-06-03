document.addEventListener("DOMContentLoaded", () => {
    let currentQuestionIndex = 0;
    let correctCount = 0;
    let score = 0;
    let questions = [];
    let answers = [];
    let totalQuestionsCount = 0;
    let apiBaseUrl;
    let apiKey;
    let questionAnswered = false;

    try {
        apiBaseUrl = window.env.API_BASE_URL;
        apiKey = window.env.API_KEY.replace(/&quot;/g, '');

        if (!apiBaseUrl || !apiKey) {
            showError('Variáveis de ambiente estão indefinidas ou inválidas.');
            throw new Error('Variáveis de ambiente estão indefinidas ou inválidas.');
        }
    } catch (error) {
        showError('Erro ao obter variáveis de ambiente.');
        console.error('Erro ao obter variáveis de ambiente:', error);
    }

    async function loadRanking() {
        function formatDateParts(isoString) {
            const date = new Date(isoString);
            const datePart = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const timePart = date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            return { datePart, timePart };
        }

        function populateRanking(rankingData, tbodyId) {
            const tbody = document.getElementById(tbodyId);
            tbody.innerHTML = '';

            rankingData.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA;
            });

            rankingData.forEach((player, index) => {
                const tr = document.createElement('tr');

                const posTd = document.createElement('td');
                posTd.classList.add('ranking-pos');
                posTd.innerHTML = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1;

                const nameTd = document.createElement('td');
                nameTd.classList.add('ranking-name');
                nameTd.textContent = player.name;

                const scoreTd = document.createElement('td');
                scoreTd.classList.add('ranking-score');
                scoreTd.textContent = player.score.toFixed(1).replace('.', ',');

                const correctCount = document.createElement('td');
                correctCount.classList.add('ranking-correct');
                correctCount.textContent = player.correct_count;

                const dateTd = document.createElement('td');
                dateTd.classList.add('ranking-datetime');
                const parts = formatDateParts(player.created_at);
                dateTd.innerHTML = `<span class="ranking-date">${parts.datePart}</span><span class="ranking-time">${parts.timePart}</span>`;

                tr.appendChild(posTd);
                tr.appendChild(nameTd);
                tr.appendChild(scoreTd);
                tr.appendChild(correctCount);
                tr.appendChild(dateTd);
                tbody.appendChild(tr);
            });
        }

        try {
            const response = await fetch(`${apiBaseUrl}/api/quiz/ranking`, {
                method: "GET",
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': apiKey
                }
            });

            if (!response.ok) {
                console.error("Erro ao carregar ranking");
                showError('Erro ao carregar ranking.');
                return;
            }

            const data = await response.json();

            const dailyRankingData = data.daily || [];
            const monthlyRankingData = data.monthly || [];

            populateRanking(dailyRankingData, "daily-ranking");
            populateRanking(monthlyRankingData, "monthly-ranking");

            // Lógica das abas
            const tabButtons = document.querySelectorAll(".tab-button");
            tabButtons.forEach(button => {
                button.addEventListener("click", function () {
                    tabButtons.forEach(btn => btn.classList.remove("active"));
                    this.classList.add("active");

                    const tab = this.getAttribute("data-tab");
                    document.querySelectorAll(".tab-content").forEach(content => {
                        content.style.display = "none";
                    });
                    document.getElementById(tab).style.display = "block";
                });
            });

        } catch (error) {
            console.error("Erro ao carregar ranking", error);
            showError('Erro ao carregar ranking.');
        }
    }

    loadRanking();

    const DIFFICULTY_POINTS = {
        'Fácil': 7,
        'Médio': 10,
        'Difícil': 12,
        'Muito difícil': 13
    };

    async function startQuiz() {
        resetVariables();
        document.getElementById('quiz-start-button').textContent = 'Carregando...';
        document.getElementById('quiz-start-button').disabled = true;
        document.getElementById('next-question').textContent = 'Próxima Questão';
        questions = await fetchAndDecryptQuestions();
        if (!questions || questions.length === 0) {
            showError('Erro ao carregar questões do quiz');
            return;
        }
        await fetchStartQuiz();

        updateQuestionCounter();

        document.getElementById('quiz-start').style.display = 'none';
        document.getElementById('quiz-questions').style.display = 'block';
        loadQuestion();
        document.getElementById('total-questions').textContent = totalQuestionsCount;
        document.getElementById('correct-count').textContent = correctCount;
    }

    function showError(message) {
        document.getElementById("quiz-container").style.display = "none";
        document.getElementById("quiz-error").style.display = "block";
        document.getElementById("error-message").textContent = message || "Ocorreu um erro inesperado. Entre em contato com o administrador do site.";
    }

    function updateQuestionCounter() {
        document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    }

    function loadQuestion() {
        questionAnswered = false;
        updateQuestionCounter();
        document.getElementById('container-score-question').classList.remove('correct', 'incorrect');
        document.getElementById('result-score-question').style.display = 'none';
        document.getElementById('text-score-question').style.display = 'block';
        document.getElementById('next-question').style.display = 'none';
        document.getElementById('quiz-feedback').style.display = 'none';
        const currentQuestion = questions[currentQuestionIndex];

        const questionDifficultySpan = document.getElementById('question-difficulty');
        questionDifficultySpan.innerText = currentQuestion.difficulty;
        const difficultyContainer = questionDifficultySpan.closest('.container-question-data');
        difficultyContainer.classList.remove('easy', 'medium', 'hard', 'very-hard');
        const scoreQuestion = document.getElementById('score-question');

        if (currentQuestion.difficulty === 'Fácil') {
            difficultyContainer.classList.add('easy');
            scoreQuestion.innerText = DIFFICULTY_POINTS['Fácil'];
        } else if (currentQuestion.difficulty === 'Médio') {
            difficultyContainer.classList.add('medium');
            scoreQuestion.innerText = DIFFICULTY_POINTS['Médio'];
        } else if (currentQuestion.difficulty === 'Difícil') {
            difficultyContainer.classList.add('hard');
            scoreQuestion.innerText = DIFFICULTY_POINTS['Difícil'];
        } else if (currentQuestion.difficulty === 'Muito difícil') {
            difficultyContainer.classList.add('very-hard');
            scoreQuestion.innerText = DIFFICULTY_POINTS['Muito difícil'];
        }

        document.getElementById('quiz-question-text').innerText = currentQuestion.question;

        const multipleAnswers = currentQuestion.alternatives.filter(opt => opt.isCorrect).length > 1;

        const optionsList = document.getElementById('quiz-options');
        optionsList.innerHTML = '';
        currentQuestion.alternatives.forEach((alternative, index) => {
            const li = document.createElement('li');
            li.innerText = alternative.value;
            li.onclick = () => selectOption(li, index, multipleAnswers);
            optionsList.appendChild(li);
        });

        // Desabilitar o botão de envio no início
        const submitButton = document.getElementById('submit-answer');
        submitButton.disabled = true;
        submitButton.style.cursor = 'not-allowed';
        submitButton.style.opacity = '0.6';
        submitButton.style.display = 'block';

        document.getElementById('quiz-questions').scrollIntoView({ behavior: 'smooth' });
    }

    function selectOption(element, index, multiple = false) {
        if (element.classList.contains('selected')) {
            element.classList.remove('selected');
        } else {
            if (!multiple) {
                const options = document.querySelectorAll('#quiz-options li');
                options.forEach(option => option.classList.remove('selected'));
            }
            element.classList.add('selected');
        }

        document.querySelectorAll('#quiz-options li').forEach(option => {
            option.addEventListener('touchend', () => {
                option.classList.remove('hover');
            });
        });

        const optionsSelected = document.querySelectorAll('#quiz-options li.selected');
        const submitButton = document.getElementById('submit-answer');

        if (optionsSelected.length > 0) {
            submitButton.disabled = false;
            submitButton.style.cursor = 'pointer';
            submitButton.style.opacity = '1';
        } else {
            submitButton.disabled = true;
            submitButton.style.cursor = 'not-allowed';
            submitButton.style.opacity = '0.6';
        }
    }

    function submitAnswer() {
        if (questionAnswered) {
            return;
        }
        const selectedOptions = document.querySelectorAll('#quiz-options li.selected');
        if (selectedOptions.length === 0) {
            alert('Selecione ao menos uma opção antes de continuar!');
            return;
        }

        const question = questions[currentQuestionIndex];
        const correctAnswers = question.alternatives
            .filter(opt => opt.isCorrect)
            .map(opt => opt.value.trim());

        if (correctAnswers.length === 1 && selectedOptions.length > 1) {
            alert('Esta questão aceita apenas uma resposta correta!');
            return;
        }

        questionAnswered = true;
        const selectedTexts = Array.from(selectedOptions).map(opt => opt.textContent.trim()); // Texto das opções selecionadas

        const allCorrect =
            correctAnswers.every(answer => selectedTexts.includes(answer)) && // Todas as corretas estão incluídas
            selectedTexts.every(answer => correctAnswers.includes(answer)); // Nenhuma incorreta foi selecionada

        calculateScore(question.difficulty, selectedTexts, correctAnswers);

        // Feedback visual
        document.getElementById('submit-answer').style.display = 'none';
        const feedback = document.getElementById('quiz-feedback');
        feedback.innerHTML = ''; // Limpa o conteúdo anterior

        if (allCorrect) {
            correctCount++;
            selectedOptions.forEach(option => option.classList.add('correct'));

            feedback.innerHTML = `
                <span class="feedback-highlight correct">Correto! ✔️.</span>
                <span class="feedback-normal">${question.explanation}</span>
            `;
            answers.push({ 'id': question.id, 'result': 'correct' });
        } else {
            selectedOptions.forEach(option => {
                if (correctAnswers.includes(option.textContent.trim())) {
                    option.classList.add('correct'); // Marca como correta as opções corretas que foram selecionadas
                } else {
                    option.classList.add('incorrect'); // Marca como incorreta as opções incorretas que foram selecionadas
                }
            });

            // Destaca as alternativas corretas não selecionadas
            const allOptions = document.querySelectorAll('#quiz-options li');
            allOptions.forEach(option => {
                if (correctAnswers.includes(option.textContent.trim()) && !selectedTexts.includes(option.textContent.trim())) {
                    option.classList.add('correct'); // Marca como correta as opções corretas não selecionadas
                }
            });

            feedback.innerHTML = `
                <span class="feedback-highlight incorrect">Errado ❌.</span>
                <span class="feedback-normal">A resposta correta era: <strong>${correctAnswers.join(', ')}</strong>.</span>
                <span class="feedback-normal">${question.explanation}</span>
            `;
            answers.push({ 'id': question.id, 'result': 'incorrect' });
        }

        feedback.style.display = 'block';
        const nextQuestionButton = document.getElementById('next-question')
        nextQuestionButton.style.display = 'block';

        if (currentQuestionIndex + 1 === totalQuestionsCount) {
            nextQuestionButton.textContent = 'Ver pontuação'
        }

        document.getElementById('quiz-options').scrollIntoView({ behavior: 'smooth' });
    }

    function loadNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            showResults();
        }
    }

    function calculateScore(difficulty, selectedTexts, correctAnswers) {
        let totalScore = 0;

        const maxPoints = DIFFICULTY_POINTS[difficulty];
        const correctSelected = selectedTexts.filter(ans => correctAnswers.includes(ans)).length;
        const incorrectSelected = selectedTexts.length - correctSelected;
        const totalCorrect = correctAnswers.length;

        let calculatedScore = (correctSelected / totalCorrect) * maxPoints;

        const penaltyPerWrong = maxPoints * 0.25;
        calculatedScore -= incorrectSelected * penaltyPerWrong;

        totalScore += Math.max(0, calculatedScore);

        score += totalScore;

        const containerScoreQuestion = document.getElementById('container-score-question')
        const resultScoreQuestion = document.getElementById('result-score-question')
        containerScoreQuestion.classList.remove('correct', 'incorrect');
        document.getElementById('total-score').innerText = score.toFixed(1).replace('.', ',');

        if (totalScore === maxPoints) {
            resultScoreQuestion.innerText = `+${totalScore.toFixed(1).replace('.', ',')} pontos! 🤩`
            containerScoreQuestion.classList.add('correct');
        } else {
            resultScoreQuestion.innerText = `+${totalScore.toFixed(1).replace('.', ',')} pontos! 😓`
            containerScoreQuestion.classList.add('incorrect');
        }
        document.getElementById('text-score-question').style.display = 'none';
        resultScoreQuestion.style.display = 'block';
    }

    function showResults() {
        if (correctCount === 10) {
            document.getElementById('quiz-results-feedback').innerText = "Uau! Você arrasou, pontuou 10 de 10 questões! É um exemplo quando o assunto é diabetes! Que tal refazer o quiz para ver se garante a mesma pontuação em novas questões? 😁"
        } else if (correctCount >= 7) {
            document.getElementById('quiz-results-feedback').innerText = 'Parabéns! Você foi muito bem! Refaça o quiz para responder novas questões! 😄';
        } else if (correctCount >= 4) {
            document.getElementById('quiz-results-feedback').innerText = 'Você foi bem, mas pode melhorar! Tente novamente para acertar mais! 😉';
        } else {
            document.getElementById('quiz-results-feedback').innerText = 'Você não foi muito bem. Que tal tentar novamente? 🙂';
        }

        document.getElementById('quiz-questions').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'block';
        document.getElementById('correct-count').innerText = correctCount;
        document.getElementById('quiz-total-questions').innerText = totalQuestionsCount
        document.getElementById('quiz-score').innerText = score.toFixed(1).replace('.', ',');

        let answersQuiz = JSON.parse(localStorage.getItem("answersQuiz")) || [];
        try {
            const map = new Map();
            answersQuiz.forEach(item => map.set(item.id, item));
            answers.forEach(item => map.set(item.id, item));
            const newAnswersQuiz = Array.from(map.values());
            localStorage.setItem('answersQuiz', JSON.stringify(newAnswersQuiz));
        } catch (err) {
            console.error(err)
            localStorage.setItem('answersQuiz', JSON.stringify([]));
        }

        document.getElementById('quiz-results').scrollIntoView({ behavior: 'smooth' });
    }

    function restartQuiz() {
        resetVariables();
        updateQuestionCounter();
        document.getElementById('total-score').innerText = '0';
        document.getElementById('quiz-results').style.display = 'none';
        document.getElementById('quiz-start').style.display = 'block';
        document.getElementById('quiz-start-button').textContent = 'Iniciar Quiz';
        document.getElementById('quiz-start-button').disabled = false;
        document.getElementById("send-ranking-button").disabled = false;
        document.getElementById("send-ranking-button").style.cursor = 'pointer';
        document.getElementById("send-ranking-button").style.opacity = '1';
    }

    function resetVariables() {
        currentQuestionIndex = 0;
        correctCount = 0;
        score = 0;
        questions = [];
        answers = [];
    }

    function shareResult() {
        const currentUrl = encodeURIComponent(window.location.href);
        const message = `Eu acertei ${correctCount}/${totalQuestionsCount} no Quiz sobre Diabetes! Faça o teste também!`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}%0A%0A${currentUrl}`;
        window.open(whatsappUrl, '_blank');
    }

    const key = 'DCC52255D8D31EE38548E7F5B4BB4ABC';

    async function fetchAndDecryptQuestions() {
        const response = await fetch('./encrypted-questions.json');
        const { data } = await response.json();

        //A chave abaixo NÃO é um dado confidencial
        const decrypted = CryptoJS.AES.decrypt(data, key);
        return getTenQuestionsFiltered(JSON.parse(decrypted.toString(CryptoJS.enc.Utf8)))
    }

    async function fetchStartQuiz() {
        try {
            const questionsToSend = questions.map(q => ({ id: q.id }));
            const response = await fetch(`${apiBaseUrl}/api/quiz/start-quiz`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'x-api-key': apiKey
                },
                body: JSON.stringify({ questions: questionsToSend }),
            });

            if (!response.ok) {
                console.error("Erro ao iniciar quiz");
                showError('Erro ao iniciar quiz.');
                return;
            }

            const data = await response.json();

            // Salvar sessionID e assinatura para enviar no submit
            sessionStorage.setItem("sessionID", data.sessionID);
            sessionStorage.setItem("signature", data.signature);
        } catch (error) {
            console.error("Erro ao iniciar quiz", error);
            showError('Erro ao iniciar quiz.');
        }
    }

    function getRandomItems(array, numItems) {
        return array.slice().sort(() => Math.random() - 0.5).slice(0, numItems);
    }

    function getTenQuestionsFiltered(array) {
        const questionsEasy = array.filter(question => question.difficulty === 'Fácil')
        const questionsMedium = array.filter(question => question.difficulty === 'Médio')
        const questionsHard = array.filter(question => question.difficulty === 'Difícil')
        const questionsVeryHard = array.filter(question => question.difficulty === 'Muito difícil')

        let answersQuiz = JSON.parse(localStorage.getItem("answersQuiz")) || [];
        const idsIncorrect = Array.isArray(answersQuiz) ? answersQuiz.filter(item => item.result === 'incorrect').map(item => item.id) : []
        const idsCorrect = Array.isArray(answersQuiz) ? answersQuiz.filter(item => item.result === 'correct').map(item => item.id) : []

        const getPrioritizedQuestions = (questionsArray, totalNeeded) => {
            const unanswered = questionsArray.filter(item => !idsCorrect.includes(item.id) && !idsIncorrect.includes(item.id))
            const incorrect = questionsArray.filter(item => idsIncorrect.includes(item.id))
            const correct = questionsArray.filter(item => idsCorrect.includes(item.id))

            let selected = [];

            selected = selected.concat(getRandomItems(unanswered, totalNeeded));

            if (selected.length < totalNeeded) {
                const remaining = totalNeeded - selected.length;
                selected = selected.concat(getRandomItems(incorrect, remaining));
            }

            if (selected.length < totalNeeded) {
                const remaining = totalNeeded - selected.length;
                selected = selected.concat(getRandomItems(correct, remaining));
            }

            return selected;
        };

        const finalSelection = [
            ...getPrioritizedQuestions(questionsEasy, 3),
            ...getPrioritizedQuestions(questionsMedium, 3),
            ...getPrioritizedQuestions(questionsHard, 3),
            ...getPrioritizedQuestions(questionsVeryHard, 1)
        ];

        totalQuestionsCount = finalSelection.length
        return finalSelection
    }

    function showLoader() {
        const globalLoader = document.getElementById("global-loader");
        if (globalLoader) {
            globalLoader.style.display = "flex";
        }
    }

    function hideLoader() {
        const globalLoader = document.getElementById("global-loader");
        if (globalLoader) {
            globalLoader.style.display = "none";
        }
    }

    const obfusKey = 17;
    function encodeAndEncrypt(score, correctCount) {
        const keyBytes = CryptoJS.enc.Utf8.parse(key);
        const encodedScore = (score * obfusKey).toString(36);
        const encodedCorrect = (correctCount * obfusKey).toString(36);

        const payload = JSON.stringify({ a: encodedScore, b: encodedCorrect });

        return CryptoJS.AES.encrypt(payload, keyBytes, { mode: CryptoJS.mode.ECB }).toString();
    }

    const modal = document.getElementById("ranking-modal");
    const sendRankingButton = document.getElementById("send-ranking-button");
    const submitNameButton = document.getElementById("submit-name");
    const cancelModalButton = document.getElementById("cancel-modal");
    const playerNameInput = document.getElementById("player-name");
    const nameError = document.getElementById("name-error");

    // Abrir o modal ao clicar no botão de enviar ranking
    sendRankingButton.addEventListener("click", function () {
        modal.style.display = "flex";
        playerNameInput.value = "";
        nameError.style.display = "none";
        submitNameButton.disabled = false;
    });

    cancelModalButton.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // Validar e enviar nome
    submitNameButton.addEventListener("click", async function () {
        const playerName = playerNameInput.value.trim();
        if (playerName.length < 3 || playerName.length > 20) {
            nameError.style.display = "block";
            return;
        }
        submitNameButton.disabled = true;

        const sessionID = sessionStorage.getItem("sessionID");
        const signature = sessionStorage.getItem("signature");

        const payload = {
            name: playerName,
            data: encodeAndEncrypt(score, correctCount),
            sessionID,
            signature,
        };

        const response = await fetch(`${apiBaseUrl}/api/quiz/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'x-api-key': apiKey
            },
            body: JSON.stringify(payload),
        })

        modal.style.display = "none";

        sendRankingButton.disabled = true;
        sendRankingButton.style.cursor = 'not-allowed';
        sendRankingButton.style.opacity = '0.6';

        if (!response.ok) {
            console.error("Erro ao enviar resultado do quiz");
            showError('Erro ao enviar resultado do quiz');
            return;
        }

        showLoader();

        sessionStorage.removeItem("sessionID");
        sessionStorage.removeItem("signature");

        setTimeout(async () => {
            hideLoader();
            await loadRanking();
            document.getElementById("ranking-section").scrollIntoView({ behavior: "smooth" });
        }, 2000);
    });

    // Fechar modal ao clicar fora dele
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    //Atribuindo os eventos de chamadas de funções de acordo com os botões em tela
    document.getElementById("quiz-start-button").addEventListener("click", startQuiz);
    document.getElementById("submit-answer").addEventListener("click", submitAnswer);
    document.getElementById("next-question").addEventListener("click", loadNextQuestion);
    document.getElementById("share-result").addEventListener("click", shareResult);
    document.getElementById("restart-quiz").addEventListener("click", restartQuiz);
});