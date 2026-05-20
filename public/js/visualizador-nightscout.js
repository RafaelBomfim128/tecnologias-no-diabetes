const VIEWER_STORAGE_KEYS = {
    url: 'nightscout_url',
    secret: 'nightscout_secret',
    start: 'nightscout_viewer_start',
    end: 'nightscout_viewer_end'
};

const MAX_RANGE_DAYS = 3;
const VIEWER_RESET_AFTER_MINUTES = 180;
const validUrlId = 'validUrl';
const correctSecretId = 'correctSecret';
const periodDataId = 'periodData';

let viewerResumeText = '';
let viewerRequestState;
let viewerLastResult = null;
let viewerResultAt = null;

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.id !== 'page-nightscout-viewer') {
        return;
    }

    viewerRequestState = window.NightscoutCommon.createRequestState();

    const dateElements = initDateRange();
    initSecretMask();
    initRememberedFields(dateElements);
    initViewerButton(dateElements);
    initViewerPdfExport();
    initViewerResults();
    resetViewerFetchState();
    document.addEventListener('visibilitychange', handleViewerVisibilityChange);

    try {
        getTotalUsage();
    } catch (error) {
        console.debug('Visualizador: contador de usos indisponivel.', error);
    }
});

function initSecretMask() {
    const apiSecretInput = document.getElementById('apiSecretInput');

    if (!apiSecretInput) {
        return;
    }

    apiSecretInput.type = 'password';
    apiSecretInput.addEventListener('focus', () => {
        apiSecretInput.type = 'text';
    });
    apiSecretInput.addEventListener('blur', () => {
        apiSecretInput.type = 'password';
    });
}

function initRememberedFields(dateElements) {
    const rememberCheckbox = document.getElementById('rememberData');
    const urlInput = document.getElementById('urlInput');
    const apiSecretInput = document.getElementById('apiSecretInput');

    if (!rememberCheckbox || !urlInput || !apiSecretInput || !dateElements) {
        return;
    }

    const savedUrl = localStorage.getItem(VIEWER_STORAGE_KEYS.url);
    const savedSecret = localStorage.getItem(VIEWER_STORAGE_KEYS.secret);
    const savedStart = localStorage.getItem(VIEWER_STORAGE_KEYS.start);
    const savedEnd = localStorage.getItem(VIEWER_STORAGE_KEYS.end);

    if (savedUrl) {
        urlInput.value = savedUrl;
    }

    if (savedSecret) {
        apiSecretInput.value = savedSecret;
    }

    if (savedStart) {
        const startDate = parseIsoDate(savedStart);
        const startValidation = validateSelectableDate(startDate, dateElements.today, 'Informe uma data início válida.');

        if (startValidation.valid) {
            applyStartDate(startDate, dateElements, { syncEnd: false });

            if (savedEnd) {
                const endDate = parseIsoDate(savedEnd);
                const validation = validateDateRange(startDate, endDate, dateElements.maxRangeDays, dateElements.today);

                if (validation.valid) {
                    applyEndDate(endDate, dateElements, startDate);
                } else {
                    applyEndDate(startDate, dateElements, startDate);
                }
            } else {
                applyEndDate(startDate, dateElements, startDate);
            }
        }
    }

    if (savedUrl || savedSecret || savedStart || savedEnd) {
        rememberCheckbox.checked = true;
    }
}

function initViewerButton(dateElements) {
    const viewButton = document.getElementById('viewNightscout');

    if (!viewButton || !dateElements) {
        return;
    }

    viewButton.addEventListener('click', async () => {
        if (!validateViewerInputs(dateElements)) {
            return;
        }

        const normalizedRange = normalizeDateRange(
            parseIsoDate(dateElements.startPicker.value),
            parseIsoDate(dateElements.endPicker.value)
        );

        persistRememberedFields(dateElements);

        resetViewerFetchState();
        showResume();

        try {
            incrementUsage();
        } catch (error) {
            console.debug('Visualizador: nao foi possivel incrementar uso.', error);
        }

        const fetchResult = await fetchViewerData({
            startDate: normalizedRange.startDate,
            endDate: normalizedRange.endDate
        });

        populateResume('✅ Conexao validada, mas nenhum resumo adicional foi gerado.');
        viewerResultAt = new Date();

        if (!fetchResult) {
            return;
        }

        viewerLastResult = fetchResult;

        document.dispatchEvent(new CustomEvent('nightscout-viewer:submit', {
            detail: {
                startDate: toIsoDate(fetchResult.startDate),
                endDate: toIsoDate(fetchResult.endDate),
                url: fetchResult.normalizedUrl,
                apiSecret: document.getElementById('apiSecretInput')?.value.trim() || '',
                entries: fetchResult.entries
            }
        }));

        document.dispatchEvent(new CustomEvent('nightscout-viewer:data-loaded', {
            detail: {
                startDate: toIsoDate(fetchResult.startDate),
                endDate: toIsoDate(fetchResult.endDate),
                normalizedUrl: fetchResult.normalizedUrl,
                entries: fetchResult.entries
            }
        }));

        if (hasSuccessfulViewerResult(fetchResult)) {
            scrollToViewerResults();
        }
    });
}

function initDateRange() {
    const elements = {
        container: document.getElementById('dateRangeContainer'),
        startShell: document.querySelector('#dateRangeContainer .ns-date-field:first-child .ns-date-shell'),
        startField: document.getElementById('dateStartInput'),
        startPicker: document.getElementById('dateStartPicker'),
        startButton: document.getElementById('dateStartButton'),
        startError: document.getElementById('dateStartError'),
        endShell: document.querySelector('#dateRangeContainer .ns-date-field:nth-child(2) .ns-date-shell'),
        endField: document.getElementById('dateEndInput'),
        endPicker: document.getElementById('dateEndPicker'),
        endButton: document.getElementById('dateEndButton'),
        endError: document.getElementById('dateEndError'),
        endWrapper: document.querySelector('#dateRangeContainer .ns-date-field--disabled')
    };

    if (Object.values(elements).some(element => !element)) {
        return null;
    }

    elements.maxRangeDays = Number(elements.container.dataset.maxRangeDays) || MAX_RANGE_DAYS;
    elements.today = startOfDay(new Date());
    elements.todayIso = toIsoDate(elements.today);
    elements.startPicker.max = elements.todayIso;
    elements.endPicker.max = elements.todayIso;

    bindPickerHotArea(elements.startShell, elements.startPicker);
    bindPickerHotArea(elements.endShell, elements.endPicker);

    const handleStartSelection = () => {
        const selectedDate = parseIsoDate(elements.startPicker.value);
        const validation = validateSelectableDate(selectedDate, elements.today, 'Informe uma data início válida.');

        if (!validation.valid) {
            showFieldError(elements.startField, elements.startError, validation.message);
            resetStartDate(elements);
            return;
        }

        applyStartDate(selectedDate, elements);
    };

    const handleEndSelection = () => {
        const selectedDate = parseIsoDate(elements.endPicker.value);
        const startDate = parseIsoDate(elements.startPicker.value);
        const validation = validateDateRange(startDate, selectedDate, elements.maxRangeDays, elements.today);

        if (!validation.valid) {
            showFieldError(elements.endField, elements.endError, validation.message);
            return;
        }

        applyEndDate(selectedDate, elements, startDate);
    };

    elements.startPicker.addEventListener('input', handleStartSelection);
    elements.startPicker.addEventListener('change', handleStartSelection);
    elements.endPicker.addEventListener('input', handleEndSelection);
    elements.endPicker.addEventListener('change', handleEndSelection);

    disableEndDate(elements);

    return elements;
}

function bindPickerHotArea(shell, picker) {
    if (!shell || !picker) {
        return;
    }

    const handlePointerOpen = event => {
        if (picker.disabled) {
            return;
        }

        event.preventDefault();
        openNativePicker(picker);
    };

    const handleKeyboardOpen = event => {
        if (picker.disabled || (event.key !== 'Enter' && event.key !== ' ')) {
            return;
        }

        event.preventDefault();
        openNativePicker(picker);
    };

    shell.addEventListener('click', handlePointerOpen);
    shell.addEventListener('keydown', handleKeyboardOpen);
}

function openNativePicker(dateInput) {
    if (!dateInput || dateInput.disabled) {
        return;
    }

    dateInput.focus({ preventScroll: true });

    if (typeof dateInput.showPicker === 'function') {
        dateInput.showPicker();
        return;
    }

    dateInput.click();
}

function applyStartDate(startDate, elements, options = {}) {
    const settings = { syncEnd: true, ...options };

    elements.startField.value = formatBrazilianDate(startDate);
    elements.startPicker.value = toIsoDate(startDate);
    clearFieldError(elements.startField, elements.startError);

    enableEndDate(elements, startDate);

    if (settings.syncEnd) {
        applyEndDate(startDate, elements, startDate);
    }
}

function applyEndDate(endDate, elements, startDate) {
    elements.endField.value = formatBrazilianDate(endDate);
    elements.endPicker.value = toIsoDate(endDate);
    clearFieldError(elements.endField, elements.endError);
    updateEndRangeLimits(elements, startDate || parseIsoDate(elements.startPicker.value));
}

function enableEndDate(elements, startDate) {
    elements.endField.disabled = false;
    elements.endField.removeAttribute('aria-disabled');
    elements.endPicker.disabled = false;
    elements.endShell.tabIndex = 0;
    elements.endShell.setAttribute('aria-disabled', 'false');
    elements.endWrapper.classList.remove('ns-date-field--disabled');
    updateEndRangeLimits(elements, startDate);
}

function disableEndDate(elements) {
    elements.endField.disabled = true;
    elements.endField.setAttribute('aria-disabled', 'true');
    elements.endField.value = '';
    elements.endPicker.disabled = true;
    elements.endShell.tabIndex = -1;
    elements.endShell.setAttribute('aria-disabled', 'true');
    elements.endPicker.value = '';
    elements.endPicker.min = '';
    elements.endPicker.max = elements.todayIso;
    elements.endWrapper.classList.add('ns-date-field--disabled');
    clearFieldError(elements.endField, elements.endError);
}

function resetStartDate(elements) {
    elements.startField.value = '';
    elements.startPicker.value = '';
    clearFieldError(elements.startField, elements.startError);
    disableEndDate(elements);
}

function updateEndRangeLimits(elements, startDate) {
    if (!startDate) {
        return;
    }

    const rangeOffset = Math.max(elements.maxRangeDays - 1, 0);
    const earliestDate = addDays(startDate, -rangeOffset);
    const latestDate = addDays(startDate, rangeOffset);
    const cappedLatestDate = latestDate > elements.today ? elements.today : latestDate;

    elements.endPicker.min = toIsoDate(earliestDate);
    elements.endPicker.max = toIsoDate(cappedLatestDate);
}

function validateViewerInputs(elements) {
    let isValid = true;
    let firstInvalidTarget = null;

    const urlInput = document.getElementById('urlInput');
    const apiSecretInput = document.getElementById('apiSecretInput');
    const urlError = document.getElementById('urlError');
    const apiSecretError = document.getElementById('apiSecretError');

    if (urlInput) {
        urlInput.value = urlInput.value.trim();

        if (!urlInput.value) {
            urlInput.classList.add('error-input');
            urlError?.classList.remove('hidden-element');
            isValid = false;
            firstInvalidTarget ||= urlInput;
        } else {
            urlInput.classList.remove('error-input');
            urlError?.classList.add('hidden-element');
        }
    }

    if (apiSecretInput) {
        apiSecretInput.value = apiSecretInput.value.trim();

        if (!apiSecretInput.value) {
            apiSecretInput.classList.add('error-input');
            apiSecretError?.classList.remove('hidden-element');
            isValid = false;
            firstInvalidTarget ||= apiSecretInput;
        } else {
            apiSecretInput.classList.remove('error-input');
            apiSecretError?.classList.add('hidden-element');
        }
    }

    if (!elements.startPicker.value || !elements.startField.value.trim()) {
        showFieldError(elements.startField, elements.startError, 'Selecione a data início.');
        isValid = false;
        firstInvalidTarget ||= elements.startShell;
    } else {
        const startValidation = validateSelectableDate(
            parseIsoDate(elements.startPicker.value),
            elements.today,
            'Informe uma data início válida.'
        );

        if (!startValidation.valid) {
            showFieldError(elements.startField, elements.startError, startValidation.message);
            isValid = false;
            firstInvalidTarget ||= elements.startShell;
        } else {
            clearFieldError(elements.startField, elements.startError);
        }
    }

    if (!elements.endPicker.value || !elements.endField.value.trim()) {
        showFieldError(elements.endField, elements.endError, 'Selecione a data fim.');
        isValid = false;
        firstInvalidTarget ||= elements.endShell;
    } else {
        const validation = validateDateRange(
            parseIsoDate(elements.startPicker.value),
            parseIsoDate(elements.endPicker.value),
            elements.maxRangeDays,
            elements.today
        );

        if (!validation.valid) {
            showFieldError(elements.endField, elements.endError, validation.message);
            isValid = false;
            firstInvalidTarget ||= elements.endShell;
        } else {
            clearFieldError(elements.endField, elements.endError);
        }
    }

    if (!isValid && firstInvalidTarget) {
        scrollToValidationTarget(firstInvalidTarget);
    }

    return isValid;
}

function scrollToValidationTarget(target) {
    if (!target) {
        return;
    }

    const y = target.getBoundingClientRect().top + window.pageYOffset - 120;
    window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });

    if (typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
    }
}

function persistRememberedFields(elements) {
    const rememberCheckbox = document.getElementById('rememberData');
    const urlInput = document.getElementById('urlInput');
    const apiSecretInput = document.getElementById('apiSecretInput');

    if (!rememberCheckbox || !urlInput || !apiSecretInput) {
        return;
    }

    if (rememberCheckbox.checked) {
        localStorage.setItem(VIEWER_STORAGE_KEYS.url, urlInput.value.trim());
        localStorage.setItem(VIEWER_STORAGE_KEYS.secret, apiSecretInput.value.trim());
        localStorage.setItem(VIEWER_STORAGE_KEYS.start, elements.startPicker.value || '');
        localStorage.setItem(VIEWER_STORAGE_KEYS.end, elements.endPicker.value || '');
        return;
    }

    Object.values(VIEWER_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

function validateSelectableDate(date, today, emptyMessage) {
    if (!date) {
        return { valid: false, message: emptyMessage };
    }

    if (date > today) {
        return { valid: false, message: 'Não é permitido selecionar datas futuras.' };
    }

    return { valid: true };
}

function validateDateRange(startDate, endDate, maxRangeDays = MAX_RANGE_DAYS, today = startOfDay(new Date())) {
    const startValidation = validateSelectableDate(startDate, today, 'Selecione a data início primeiro.');

    if (!startValidation.valid) {
        return startValidation;
    }

    const endValidation = validateSelectableDate(endDate, today, 'Informe uma data fim válida.');

    if (!endValidation.valid) {
        return endValidation;
    }

    const differenceInDays = getDateDifferenceInDays(startDate, endDate) + 1;

    if (differenceInDays > maxRangeDays) {
        return { valid: false, message: `O intervalo máximo permitido é de ${maxRangeDays} dias.` };
    }

    return { valid: true };
}

function normalizeDateRange(startDate, endDate) {
    if (startDate <= endDate) {
        return { startDate, endDate };
    }

    return {
        startDate: endDate,
        endDate: startDate
    };
}

function getDateDifferenceInDays(firstDate, secondDate) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs(secondDate - firstDate) / millisecondsPerDay);
}

function showFieldError(input, errorElement, message) {
    input.classList.add('error-input');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden-element');
}

function clearFieldError(input, errorElement) {
    input.classList.remove('error-input');
    errorElement.classList.add('hidden-element');
}

function parseIsoDate(value) {
    if (!value) {
        return null;
    }

    const parts = value.split('-').map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return null;
    }

    return startOfDay(new Date(parts[0], parts[1] - 1, parts[2]));
}

function formatBrazilianDate(date) {
    return [
        String(date.getDate()).padStart(2, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getFullYear())
    ].join('/');
}

function toIsoDate(date) {
    return [
        String(date.getFullYear()),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
    ].join('-');
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return startOfDay(result);
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function fetchWithTimeout(url, optionsOrTimeout, maybeTimeout) {
    return window.NightscoutCommon.fetchWithTimeout(url, viewerRequestState, window.env?.API_BASE_URL, optionsOrTimeout, maybeTimeout);
}

function tryNormalizeUrl(input) {
    return window.NightscoutCommon.normalizeUrl(input);
}

async function checkValidUrl() {
    await setLoadingStatus(validUrlId);

    try {
        const raw = document.querySelector('#urlInput').value.trim();
        const result = await window.NightscoutCommon.validateUrl(raw, {
            apiBaseUrl: window.env?.API_BASE_URL,
            requestState: viewerRequestState,
            notify: showToast
        });

        if (!result.ok) {
            setWrong(validUrlId);
            setResumeText(result.message);
            return null;
        }

        document.querySelector('#urlInput').value = result.normalizedUrl;
        setCorrect(validUrlId);
        return result;
    } catch (error) {
        setWrong(validUrlId);
        setResumeText('❌ Ocorreu um erro inesperado ao validar a URL do Nightscout.');
        console.error("Erro inesperado em checkValidUrl:", error);
        showToast('Erro inesperado ao validar a URL.', 'error');
        return null;
    }
}

async function checkApiSecret(normalizedUrl) {
    await setLoadingStatus(correctSecretId);

    try {
        const apiSecret = document.querySelector('#apiSecretInput').value.trim();
        const result = await window.NightscoutCommon.verifyApiSecret({
            baseUrl: normalizedUrl,
            apiSecret,
            apiBaseUrl: window.env?.API_BASE_URL,
            requestState: viewerRequestState,
            notify: showToast,
            requiredScopes: ['canRead']
        });

        if (!result.ok) {
            setWrong(correctSecretId)
            setResumeText(result.message)
            return null;
        }

        setCorrect(correctSecretId)
        return result;
    } catch (error) {
        setWrong(correctSecretId);
        setResumeText('❌ Ocorreu um erro inesperado ao buscar dados da API Secret.');
        console.error("Erro inesperado em checkApiSecret:", error);
        showToast('Erro inesperado ao buscar dados da API Secret.', 'error');
        return null;
    }
}

async function checkPeriodData(normalizedUrl, apiSecretHash, range) {
    await setLoadingStatus(periodDataId);

    try {
        const result = await window.NightscoutCommon.fetchEntries({
            baseUrl: normalizedUrl,
            apiSecretHash,
            apiBaseUrl: window.env?.API_BASE_URL,
            requestState: viewerRequestState,
            startDate: range.startDate,
            endDate: range.endDate,
            notify: showToast
        });

        if (!result.ok) {
            setWrong(periodDataId);
            setResumeText(result.message);
            return null;
        }

        const rangeLabel = `${formatBrazilianDate(range.startDate)} e ${formatBrazilianDate(range.endDate)}`;

        if (result.entries.length === 0) {
            setWarning(periodDataId);
            setResumeText(`⚠️ Não foram encontrados dados de glicemia entre ${rangeLabel}.`);
        } else {
            setCorrect(periodDataId);
            setResumeText(`✅ Foram encontrados ${result.entries.length} registros de glicemia entre ${rangeLabel}.`);
        }

        return result.entries;
    } catch (error) {
        setWrong(periodDataId);
        setResumeText('❌ Ocorreu um erro inesperado ao buscar os dados do período selecionado.');
        console.error('Erro inesperado em checkPeriodData:', error);
        showToast('Erro inesperado ao buscar os dados do período.', 'error');
        return null;
    }
}

async function fetchViewerData(range) {
    const runtimeRangeValidation = validateDateRange(
        range?.startDate,
        range?.endDate,
        MAX_RANGE_DAYS,
        startOfDay(new Date())
    );

    if (!runtimeRangeValidation.valid) {
        setWrong(periodDataId);
        setResumeText(`❌ ${runtimeRangeValidation.message}`);
        showToast(runtimeRangeValidation.message, 'error');
        return null;
    }

    const urlResult = await checkValidUrl();

    if (!urlResult) {
        return null;
    }

    const secretResult = await checkApiSecret(urlResult.normalizedUrl);

    if (!secretResult) {
        return null;
    }

    const entries = await checkPeriodData(urlResult.normalizedUrl, secretResult.apiSecretHash, range);

    if (!entries) {
        return null;
    }

    return {
        normalizedUrl: urlResult.normalizedUrl,
        entries,
        startDate: range.startDate,
        endDate: range.endDate
    };
}

function showToast(message, type = 'error') {
    try {
        const container = document.getElementById('toast-container');

        if (!container) {
            return;
        }

        const toast = document.createElement('div');
        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';

        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icon}</span><p class="toast-message">${message}</p>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-6px)';
            setTimeout(() => toast.remove(), 200);
        }, 4000);
    } catch (error) {
        console.debug('Toast indisponivel:', error);
    }
}

function resetViewerFetchState() {
    viewerRequestState = window.NightscoutCommon.createRequestState();
    viewerResumeText = '';
    viewerLastResult = null;
    viewerResultAt = null;

    const statusList = document.querySelector('.status-list');
    const resumeTitle = document.querySelector('.resume-title');
    const resume = document.getElementById('resume');
    const resultsSection = document.getElementById('viewerResults');
    const resultsMeta = document.getElementById('viewerResultsMeta');
    const resultsContent = document.getElementById('viewerResultsContent');

    if (statusList) {
        statusList.classList.add('hidden-element');
    }

    if (resumeTitle) {
        resumeTitle.classList.add('hidden-element');
    }

    if (resume) {
        resume.classList.add('hidden-element');
        resume.textContent = 'Aguardando validações concluírem...';
    }

    if (resultsSection) {
        resultsSection.classList.add('hidden-element');
    }

    if (resultsMeta) {
        resultsMeta.textContent = '';
    }

    if (resultsContent) {
        resultsContent.replaceChildren();
    }

    setViewerPdfAvailability(false);

    setNoResult(validUrlId);
    setNoResult(correctSecretId);
    setNoResult(periodDataId);
}

function handleViewerVisibilityChange() {
    if (document.visibilityState !== 'visible' || !viewerResultAt) {
        return;
    }

    const current = new Date().getTime();
    const diffMinutes = (current - viewerResultAt) / 1000 / 60;

    if (diffMinutes > VIEWER_RESET_AFTER_MINUTES) {
        resetViewerFetchState();
    }
}

function showResume() {
    const statusList = document.querySelector('.status-list');
    const resume = document.getElementById('resume');
    const resumeTitle = document.querySelector('.resume-title');

    if (statusList?.classList.contains('hidden-element')) {
        statusList.classList.remove('hidden-element');
    }

    if (resume?.classList.contains('hidden-element')) {
        resume.classList.remove('hidden-element');
    }

    if (resumeTitle?.classList.contains('hidden-element')) {
        resumeTitle.classList.remove('hidden-element');
    }

    if (statusList) {
        const y = statusList.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}

function hasSuccessfulViewerResult(fetchResult) {
    return Boolean(fetchResult && Array.isArray(fetchResult.entries) && fetchResult.entries.length > 0);
}

function scrollToViewerResults() {
    const resultsSection = document.getElementById('viewerResults');

    if (!resultsSection || resultsSection.classList.contains('hidden-element')) {
        return;
    }

    const y = resultsSection.getBoundingClientRect().top + window.pageYOffset - 200;
    window.scrollTo({ top: y, behavior: 'smooth' });
}

function initViewerPdfExport() {
    const printButton = document.getElementById('printViewerResults');

    if (!printButton) {
        return;
    }

    printButton.addEventListener('click', () => {
        downloadViewerResultsPdf();
    });
}

function setViewerPdfAvailability(isVisible) {
    const printButton = document.getElementById('printViewerResults');

    if (!printButton) {
        return;
    }

    printButton.hidden = !isVisible;
    printButton.disabled = !isVisible;
    printButton.setAttribute('aria-hidden', String(!isVisible));
}

function downloadViewerResultsPdf() {
    if (!hasSuccessfulViewerResult(viewerLastResult)) {
        showToast('Busque um período com dados antes de salvar em PDF.', 'warning');
        return;
    }

    const jsPdfConstructor = window.jspdf?.jsPDF;

    if (typeof jsPdfConstructor !== 'function') {
        showToast('A biblioteca de PDF não foi carregada corretamente.', 'error');
        return;
    }

    const documentPdf = new jsPdfConstructor({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    if (typeof documentPdf.autoTable !== 'function') {
        showToast('A biblioteca de tabelas do PDF não foi carregada corretamente.', 'error');
        return;
    }

    const marginX = 42;
    const topMargin = 48;
    const bottomMargin = 42;
    const pageHeight = documentPdf.internal.pageSize.getHeight();
    const contentWidth = documentPdf.internal.pageSize.getWidth() - (marginX * 2);
    const startDate = viewerLastResult.startDate;
    const endDate = viewerLastResult.endDate;
    const groupedEntries = groupEntriesByDay(viewerLastResult.entries);
    const dateRangeLabel = `${formatBrazilianDate(startDate)} a ${formatBrazilianDate(endDate)}`;
    const totalLabel = `${viewerLastResult.entries.length} ${viewerLastResult.entries.length === 1 ? 'glicemia encontrada' : 'glicemias encontradas'}`;
    const normalizedUrl = viewerLastResult.normalizedUrl || document.getElementById('urlInput')?.value.trim() || '';
    let currentY = topMargin;

    documentPdf.setFont('helvetica', 'bold');
    documentPdf.setFontSize(17);
    documentPdf.text('Glicemias do período', marginX, currentY);
    currentY += 24;

    documentPdf.setFont('helvetica', 'normal');
    documentPdf.setFontSize(10);

    [
        `Período: ${dateRangeLabel}`,
        `Total: ${totalLabel}.`,
        normalizedUrl ? `Nightscout: ${normalizedUrl}` : ''
    ].filter(Boolean).forEach(line => {
        const lines = documentPdf.splitTextToSize(line, contentWidth);
        documentPdf.text(lines, marginX, currentY);
        currentY += (lines.length * 12) + 6;
    });

    currentY += 6;

    groupedEntries.forEach(group => {
        if (currentY > pageHeight - 120) {
            documentPdf.addPage();
            currentY = topMargin;
        }

        documentPdf.setFont('helvetica', 'bold');
        documentPdf.setFontSize(12);
        documentPdf.text(group.title, marginX, currentY);

        const body = group.entries.map(entry => {
            const entryDate = getEntryDate(entry);

            return {
                time: entryDate ? formatTime(entryDate) : 'Horário indisponível',
                value: typeof entry.sgv === 'number' ? `${entry.sgv} mg/dL` : 'Valor indisponível',
                trendDirection: entry.direction || ''
            };
        });

        documentPdf.autoTable({
            startY: currentY + 8,
            columns: [
                { header: 'Horário', dataKey: 'time' },
                { header: 'Glicemia', dataKey: 'value' },
                { header: 'Tendência', dataKey: 'trendDirection' }
            ],
            body,
            margin: { left: marginX, right: marginX },
            theme: 'grid',
            headStyles: {
                fillColor: [239, 246, 255],
                textColor: [30, 58, 138],
                fontStyle: 'bold',
                lineColor: [226, 232, 240],
                lineWidth: 0.6
            },
            bodyStyles: {
                textColor: [15, 23, 42],
                lineColor: [226, 232, 240],
                lineWidth: 0.4
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            styles: {
                font: 'helvetica',
                fontSize: 10,
                cellPadding: 7,
                overflow: 'linebreak',
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 72, halign: 'center' }
            },
            didParseCell: hookData => {
                if (hookData.section === 'body' && hookData.column.dataKey === 'trendDirection') {
                    hookData.cell.text = [''];
                    hookData.cell.styles.minCellHeight = 24;
                }
            },
            didDrawCell: hookData => {
                if (hookData.section === 'body' && hookData.column.dataKey === 'trendDirection') {
                    drawPdfTrendIndicator(documentPdf, hookData.cell, hookData.row.raw?.trendDirection);
                }
            }
        });

        currentY = documentPdf.lastAutoTable.finalY + 22;

        if (currentY > pageHeight - bottomMargin) {
            documentPdf.addPage();
            currentY = topMargin;
        }
    });

    documentPdf.save(buildViewerPdfFileName(startDate, endDate));
}

function setLoadingStatus(id) {
    const element = document.getElementById(id);

    if (element) {
        element.src = './img/loading.gif';
    }

    return new Promise(resolve => setTimeout(resolve, 500));
}

function setCorrect(id) {
    const element = document.getElementById(id);

    if (element) {
        element.src = './img/check.png';
    }
}

function setWrong(id) {
    const element = document.getElementById(id);

    if (element) {
        element.src = './img/wrong.png';
    }
}

function setWarning(id) {
    const element = document.getElementById(id);

    if (element) {
        element.src = './img/warning.png';
    }
}

function setNoResult(id) {
    const element = document.getElementById(id);

    if (element) {
        element.src = './img/no-result.png';
    }
}

function setResumeText(message) {
    viewerResumeText += `${message}\n\n`;
}

function populateResume(defaultMessage) {
    const resume = document.getElementById('resume');

    if (!resume) {
        return;
    }

    resume.innerHTML = viewerResumeText || defaultMessage || '✅ Operacao concluida.';
}

function initViewerResults() {
    document.addEventListener('nightscout-viewer:data-loaded', event => {
        renderViewerResults(event.detail);
    });
}

function renderViewerResults(detail) {
    const resultsSection = document.getElementById('viewerResults');
    const resultsMeta = document.getElementById('viewerResultsMeta');
    const resultsContent = document.getElementById('viewerResultsContent');

    if (!resultsSection || !resultsMeta || !resultsContent) {
        return;
    }

    resultsSection.classList.remove('hidden-element');
    resultsContent.replaceChildren();

    const startDate = parseIsoDate(detail.startDate);
    const endDate = parseIsoDate(detail.endDate);
    const entries = Array.isArray(detail.entries) ? detail.entries : [];
    const dateRangeLabel = startDate && endDate
        ? `${formatBrazilianDate(startDate)} a ${formatBrazilianDate(endDate)}`
        : '';
    resultsMeta.textContent = entries.length > 0
        ? `${entries.length} glicemias encontradas no período de ${dateRangeLabel}.`
        : `Nenhuma glicemia encontrada no período de ${dateRangeLabel}.`;

    setViewerPdfAvailability(entries.length > 0);

    if (entries.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'viewer-results__empty';
        emptyState.textContent = 'Nenhum valor de glicemia foi encontrado para o período selecionado.';
        resultsContent.appendChild(emptyState);
        return;
    }

    const groupedEntries = groupEntriesByDay(entries);

    groupedEntries.forEach(group => {
        const groupSection = document.createElement('section');
        groupSection.className = 'viewer-day-group';

        const groupTitle = document.createElement('h3');
        groupTitle.className = 'viewer-day-group__title';
        groupTitle.textContent = group.title;
        groupSection.appendChild(groupTitle);

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'viewer-table-wrapper';

        const table = document.createElement('table');
        table.className = 'viewer-results-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Horário', 'Glicemia'].forEach(label => {
            const header = document.createElement('th');
            header.scope = 'col';
            header.textContent = label;
            headerRow.appendChild(header);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        group.entries.forEach(entry => {
            const row = document.createElement('tr');
            const entryDate = getEntryDate(entry);

            const dateCell = document.createElement('td');
            dateCell.className = 'viewer-results-table__datetime';
            dateCell.textContent = entryDate ? formatDateTime(entryDate) : 'Data indisponível';
            row.appendChild(dateCell);

            const valueCell = document.createElement('td');
            valueCell.className = 'viewer-results-table__value';

            const valueText = document.createElement('span');
            valueText.className = 'viewer-results-table__sgv';
            valueText.textContent = typeof entry.sgv === 'number' ? `${entry.sgv} mg/dL` : 'Valor indisponível';
            valueCell.appendChild(valueText);

            const trend = getTrendPresentation(entry.direction);

            if (trend.icon) {
                const trendIcon = document.createElement('span');
                trendIcon.className = 'viewer-results-table__trend';
                trendIcon.textContent = trend.icon;
                trendIcon.setAttribute('aria-label', trend.label);
                trendIcon.title = trend.label;
                valueCell.appendChild(trendIcon);
            }

            row.appendChild(valueCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        groupSection.appendChild(tableWrapper);
        resultsContent.appendChild(groupSection);
    });
}

function groupEntriesByDay(entries) {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const groups = new Map();

    entries.forEach(entry => {
        const entryDate = getEntryDate(entry);

        if (!entryDate) {
            return;
        }

        const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;

        if (!groups.has(key)) {
            groups.set(key, {
                title: formatter.format(entryDate),
                entries: []
            });
        }

        groups.get(key).entries.push(entry);
    });

    return Array.from(groups.values());
}

function getEntryDate(entry) {
    if (typeof entry?.date === 'number') {
        return new Date(entry.date);
    }

    if (entry?.dateString) {
        const parsedDate = new Date(entry.dateString);
        if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate;
        }
    }

    return null;
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function buildViewerPdfFileName(startDate, endDate) {
    const startLabel = startDate ? formatFileDate(startDate) : 'inicio';
    const endLabel = endDate ? formatFileDate(endDate) : 'fim';
    const timestamp = Math.floor(Date.now() / 1000);
    return `glicemias-nightscout-${startLabel}-a-${endLabel}_${timestamp}.pdf`;
}

function formatFileDate(date) {
    return [
        String(date.getDate()).padStart(2, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getFullYear())
    ].join('-');
}

function drawPdfTrendIndicator(documentPdf, cell, direction) {
    const trend = getTrendPresentation(direction);

    if (!trend.icon) {
        return;
    }

    const centerX = cell.x + (cell.width / 2);
    const centerY = cell.y + (cell.height / 2);
    const arrowColor = [37, 99, 235];

    documentPdf.setDrawColor(...arrowColor);
    documentPdf.setFillColor(...arrowColor);
    documentPdf.setLineWidth(1.4);

    switch (direction) {
        case 'DoubleUp':
            drawPdfArrow(documentPdf, centerX - 7, centerY + 4, 270);
            drawPdfArrow(documentPdf, centerX + 7, centerY + 4, 270);
            break;
        case 'SingleUp':
            drawPdfArrow(documentPdf, centerX, centerY + 4, 270);
            break;
        case 'FortyFiveUp':
            drawPdfArrow(documentPdf, centerX - 1, centerY + 1, 315);
            break;
        case 'Flat':
            drawPdfArrow(documentPdf, centerX - 4, centerY, 0);
            break;
        case 'FortyFiveDown':
            drawPdfArrow(documentPdf, centerX - 1, centerY - 1, 45);
            break;
        case 'SingleDown':
            drawPdfArrow(documentPdf, centerX, centerY - 4, 90);
            break;
        case 'DoubleDown':
            drawPdfArrow(documentPdf, centerX - 7, centerY - 4, 90);
            drawPdfArrow(documentPdf, centerX + 7, centerY - 4, 90);
            break;
        default:
            break;
    }
}

function drawPdfArrow(documentPdf, centerX, centerY, angleDegrees) {
    const shaftLength = 13;
    const headLength = 6;
    const headWidth = 4;
    const angle = angleDegrees * (Math.PI / 180);
    const startX = centerX - Math.cos(angle) * (shaftLength / 2);
    const startY = centerY - Math.sin(angle) * (shaftLength / 2);
    const endX = centerX + Math.cos(angle) * (shaftLength / 2);
    const endY = centerY + Math.sin(angle) * (shaftLength / 2);
    const baseX = endX - Math.cos(angle) * headLength;
    const baseY = endY - Math.sin(angle) * headLength;
    const leftX = baseX + Math.cos(angle + Math.PI / 2) * headWidth;
    const leftY = baseY + Math.sin(angle + Math.PI / 2) * headWidth;
    const rightX = baseX + Math.cos(angle - Math.PI / 2) * headWidth;
    const rightY = baseY + Math.sin(angle - Math.PI / 2) * headWidth;

    documentPdf.line(startX, startY, endX, endY);
    documentPdf.triangle(endX, endY, leftX, leftY, rightX, rightY, 'F');
}

function getTrendPresentation(direction) {
    const trendMap = {
        DoubleUp: { icon: '↑↑', label: 'Subindo rapidamente' },
        SingleUp: { icon: '↑', label: 'Subindo' },
        FortyFiveUp: { icon: '↗', label: 'Subindo em diagonal' },
        Flat: { icon: '→', label: 'Estável' },
        FortyFiveDown: { icon: '↘', label: 'Descendo em diagonal' },
        SingleDown: { icon: '↓', label: 'Descendo' },
        DoubleDown: { icon: '↓↓', label: 'Descendo rapidamente' },
        'NOT COMPUTABLE': { icon: '', label: 'Tendência indisponível' },
        'OUT OF RANGE': { icon: '', label: 'Tendência fora da faixa' },
        NONE: { icon: '', label: 'Sem tendência' }
    };

    return trendMap[direction] || { icon: '', label: 'Sem tendência' };
}

async function getTotalUsage() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/nightscoutViewerUses`);

        if (!response.ok) {
            console.error('Erro ao obter contador de usos do visualizador de Nightscout:', response.status);
            return;
        }

        const data = await response.json();
        const usagesElement = document.getElementById('usageValue');

        if (usagesElement) {
            usagesElement.textContent = data.count;
        }
    } catch (error) {
        console.error('Erro na requisição GET "nightscoutViewerUses":', error);
    }
}

async function incrementUsage() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/incrementNightscoutViewerUses`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Erro ao incrementar contador do visualizador:', response.status);
            return;
        }

        await getTotalUsage();
    } catch (error) {
        console.error('Erro na requisição POST do visualizador:', error);
    }
}