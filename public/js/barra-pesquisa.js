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

    // Pesquisa nos itens da lista
    const listItems = document.querySelectorAll('ul li');
    listItems.forEach(item => {
        const title = item.querySelector('span')?.textContent.trim().toLowerCase();
        if (title && title.includes(query)) {
            item.style.display = ''; // Exibe o item da lista
            visibleCount++;
        } else {
            item.style.display = 'none'; // Oculta o item da lista
        }
    });

    // Nenhum resultado encontrado
    const noResultsContainer = document.getElementById('no-results-container');
    const contentContainer = document.getElementById('tutorials-item-list');
    
    if (visibleCount === 0) {
        if (!noResultsContainer) {
            const container = document.createElement('div');
            container.id = 'no-results-container';
            container.className = 'text-center py-8';
            
            const message = document.createElement('p');
            message.className = 'text-gray-500 text-lg';
            message.textContent = 'Nenhum resultado encontrado.';
            
            container.appendChild(message);
            contentContainer.insertAdjacentElement('afterend', container);
        }
    } else if (noResultsContainer) {
        noResultsContainer.remove();
    }
});
