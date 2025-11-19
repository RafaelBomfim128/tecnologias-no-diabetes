//Se apertar enter, fecha o teclado no mobile
document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const searchBar = document.getElementById('search-bar');
    searchBar.blur();
});

//Pesquisa em tempo real (sem precisar apertar enter)
document.getElementById('search-bar').addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();

    // Pesquisa nos tutoriais
    const tutorialItems = document.querySelectorAll('.tutorials-item-list-item');
    let visibleCount = 0;

    tutorialItems.forEach(item => {
        const title = item.querySelector('.tutorials-item-link-title').textContent.trim().toLowerCase();
        if (title.includes(query)) {
            item.style.display = ''; // Exibe o item
            visibleCount++;
        } else {
            item.style.display = 'none'; // Oculta o item
        }
    });

    // Pesquisa nos itens do FAQ
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        if (item) {
            const question = item.querySelector('.faq-question')?.textContent.trim().toLowerCase();
            const answer = item.querySelector('.faq-answer')?.textContent.trim().toLowerCase();

            if (question && answer && (question.includes(query) || answer.includes(query))) {
                item.style.display = ''; // Exibe o item do FAQ
                visibleCount++;
            } else {
                item.style.display = 'none'; // Oculta o item do FAQ
            }
        }
    });

    // Pesquisa nas listas simples (ex: página "Ver tudo" de tutoriais)
    const listItems = document.querySelectorAll('ul li');
    listItems.forEach(item => {
        const span = item.querySelector('span');
        if (!span) return; // ignora menus/breadcrumbs
        const title = span.textContent.trim().toLowerCase();
        if (title && title.includes(query)) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Pesquisa nos PDFs (conteúdos úteis) - cards dentro de #recursos
    const pdfCards = document.querySelectorAll('#recursos > div');
    pdfCards.forEach(wrapper => {
        const titleEl = wrapper.querySelector('.card-title');
        if (!titleEl) return; // não é um card de pdf
        const title = titleEl.textContent.trim().toLowerCase();
        if (title.includes(query)) {
            wrapper.style.display = '';
            visibleCount++;
        } else {
            wrapper.style.display = 'none';
        }
    });

    // Nenhum resultado encontrado
    const noResultsContainer = document.getElementById('no-results-container');
    // Define onde anexar a mensagem dependendo da página
    let contentContainer = document.getElementById('tutorials-item-list');
    if (!contentContainer) contentContainer = document.getElementById('recursos');
    if (!contentContainer) contentContainer = document.querySelector('main');
    
    if (visibleCount === 0) {
        if (!noResultsContainer) {
            const container = document.createElement('div');
            container.id = 'no-results-container';
            container.className = 'text-center py-8';
            
            const message = document.createElement('p');
            message.className = 'text-gray-500 text-lg';
            message.textContent = 'Nenhum resultado encontrado.';
            
            container.appendChild(message);
            if (contentContainer) contentContainer.insertAdjacentElement('afterend', container);
        }
    } else if (noResultsContainer) {
        noResultsContainer.remove();
    }
});
