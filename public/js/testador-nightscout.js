const validUrlId = 'validUrl';
const correctSecretId = 'correctSecret';
const recentDataId = 'recentData';
const dbFreeSpaceId = 'dbFreeSpace';
const moreTestsId = 'moreTests';
let dateResult;
let requestState;

document.addEventListener("DOMContentLoaded", () => {
    requestState = window.NightscoutCommon.createRequestState();
    // Tenta obter contador de uso sem quebrar a inicialização se o elemento não existir
    try { getTotalUsage(); } catch (_) { }
    const btnTestNightscout = document.querySelector('#testNightscout');
    const url = document.querySelector('#urlInput');
    const apiSecret = document.querySelector('#apiSecretInput');
    apiSecret.type = 'password'

    const rememberCheckbox = document.getElementById('rememberData');
    const savedUrl = localStorage.getItem('nightscout_url');
    const savedSecret = localStorage.getItem('nightscout_secret');
    if (savedUrl) url.value = savedUrl;
    if (savedSecret) apiSecret.value = savedSecret;
    if (savedUrl || savedSecret) rememberCheckbox.checked = true;

    if (btnTestNightscout) {
        btnTestNightscout.addEventListener('click', async function () {
            reset();

            url.value = url.value.trim()
            apiSecret.value = apiSecret.value.trim();

            if (!url.value) {
                url.classList.add('error-input');
                url.focus();
                document.getElementById('urlError').classList.remove('hidden-element');
                return;
            } else {
                url.classList.remove('error-input');
                document.getElementById('urlError').classList.add('hidden-element');
            }

            if (!apiSecret.value) {
                apiSecret.classList.add('error-input');
                apiSecret.focus();
                document.getElementById('apiSecretError').classList.remove('hidden-element');
                return;
            } else {
                apiSecret.classList.remove('error-input');
                document.getElementById('apiSecretError').classList.add('hidden-element');
            }

            if (!url.value.toLowerCase().startsWith('http') && !url.value.toLowerCase().startsWith('https')) {
                url.value = `https://${url.value}`
            }

            const rememberCheckbox = document.getElementById('rememberData');
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('nightscout_url', url.value);
                localStorage.setItem('nightscout_secret', apiSecret.value);
            } else {
                localStorage.removeItem('nightscout_url');
                localStorage.removeItem('nightscout_secret');
            }

            setTimeout(showResume, 100);

            incrementUsage()
            await checkValidUrl();
            populateResume();
            const shareBtn = document.querySelector('#shareWhatsApp');
            if (shareBtn) shareBtn.classList.remove('hidden-element');
            dateResult = new Date();
        });
    }

    url.addEventListener('change', function () {
        if (url.value.toLowerCase().includes('@') && url.value.toLowerCase().includes('/api')) {
            const normalized = url.value.toLowerCase();

            const urlWithoutProtocol = url.value.replace(/^https?:\/\//i, '');

            const urlExtracted = urlWithoutProtocol.split('@')[1].split(/\/api/i)[0];
            const apiSecretExtracted = urlWithoutProtocol.split('@')[0];

            url.value = `https://${urlExtracted}/`;
            apiSecret.value = apiSecretExtracted;

            btnTestNightscout.focus();
        }
    })

    apiSecret.addEventListener('focus', function () {
        apiSecret.type = 'text'
    })

    apiSecret.addEventListener('blur', function () {
        apiSecret.type = 'password'
    })

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (dateResult) {
                const current = new Date().getTime()
                const diffMinutes = (current - dateResult) / 1000 / 60
                if (diffMinutes > 15) {
                    reset()
                }
            }
        }
    });
})

// Toast helper
function showToast(message, type = 'error') {
    try {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
        toast.innerHTML = `<span class="toast-icon">${icon}</span><p class="toast-message">${message}</p>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-6px)';
            setTimeout(() => toast.remove(), 200);
        }, 4000);
    } catch (_) { /* no-op */ }
}

let hasRecentData
let resumeText = '';

function reset() {
    hasRecentData = false
    requestState = window.NightscoutCommon.createRequestState()
    resumeText = ''
    dateResult = ''
    const resume = document.getElementById('resume').textContent = 'Aguardando testes concluírem...'
    document.getElementById('urlError').classList.add('hidden-element');
    document.getElementById('apiSecretError').classList.add('hidden-element');
    document.querySelector('.status-list').classList.add('hidden-element');
    document.getElementById('resume').classList.add('hidden-element');
    document.querySelector('.resume-title').classList.add('hidden-element');
    const shareBtn = document.getElementById('shareWhatsApp');
    if (shareBtn) shareBtn.classList.add('hidden-element');
    setNoResult(validUrlId)
    setNoResult(correctSecretId)
    setNoResult(recentDataId)
    setNoResult(dbFreeSpaceId)
    setNoResult(moreTestsId)
}

function showResume() {
    const statusList = document.querySelector('.status-list');
    if (statusList.classList.contains('hidden-element')) {
        statusList.classList.remove('hidden-element');
        document.getElementById('resume').classList.remove('hidden-element');
        document.querySelector('.resume-title.hidden-element').classList.remove('hidden-element');
    }
    const y = statusList.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top: y, behavior: 'smooth' });
}

async function fetchWithTimeout(url, optionsOrTimeout, maybeTimeout) {
    return window.NightscoutCommon.fetchWithTimeout(url, requestState, window.env?.API_BASE_URL, optionsOrTimeout, maybeTimeout);
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
            requestState,
            notify: showToast
        });

        if (!result.ok) {
            setWrong(validUrlId);
            setResumeText(result.message);
            return;
        }

        document.querySelector('#urlInput').value = result.normalizedUrl;
        setCorrect(validUrlId);
        await checkApiSecret();
    } catch (error) {
        setWrong(validUrlId);
        setResumeText('❌ Ocorreu um erro inesperado ao validar a URL do Nightscout.');
        console.error("Erro inesperado em checkValidUrl:", error);
        showToast('Erro inesperado ao validar a URL.', 'error');
        return;
    }
}

async function checkApiSecret() {
    await setLoadingStatus(correctSecretId);

    try {
        const url = document.querySelector('#urlInput').value.trim();
        const apiSecret = document.querySelector('#apiSecretInput').value.trim();
        const result = await window.NightscoutCommon.verifyApiSecret({
            baseUrl: url,
            apiSecret,
            apiBaseUrl: window.env?.API_BASE_URL,
            requestState,
            notify: showToast
        });

        if (!result.ok) {
            setWrong(correctSecretId)
            setResumeText(result.message)
            return;
        }

        setCorrect(correctSecretId)

        await checkRecentData()
    } catch (error) {
        setWrong(correctSecretId);
        setResumeText('❌ Ocorreu um erro inesperado ao buscar dados da API Secret.');
        console.error("Erro inesperado em checkApiSecret:", error);
        showToast('Erro inesperado ao buscar dados da API Secret.', 'error');
        return;
    }
}

async function checkRecentData() {
    await setLoadingStatus(recentDataId);
    try {
        const url = document.querySelector('#urlInput').value.trim();
        const apiSecret = document.querySelector('#apiSecretInput').value.trim();
        const apiSecretHash = await sha1(apiSecret);
        const path = `/api/v1/entries.json?count=1&secret=${apiSecretHash}`;
        const fullUrl = new URL(path, url).href;
        let response;
        try {
            response = await fetchWithTimeout(fullUrl, { method: "GET" });
        } catch (error) {
            response = undefined;
            console.error("Erro ao buscar dados recentes:", error);
            showToast('Erro de rede ao buscar dados recentes.', 'error');
        }

        if (response && response.ok && response.status === 200) {
            let data;
            try {
                data = await response.json();
            } catch (error) {
                setWrong(recentDataId);
                setResumeText('❌ Ocorreu um erro ao converter resposta dos dados recentes.');
                showToast('Erro ao converter dados recentes.', 'error');
                return;
            }

            const lastRead = data[0]?.date
            if (lastRead) {
                const now = Date.now()
                const diffMs = now - lastRead
                const diffMin = diffMs / (1000 * 60)
                if (diffMin < 15) {
                    setCorrect(recentDataId)
                    hasRecentData = true
                } else {
                    setWrong(recentDataId)
                    setResumeText(`❌ Não há dados recentes de glicemia recebidos: ${parseInt(diffMin)} minutos atrás.`)
                }
            } else {
                setWarning(recentDataId)
                setResumeText('❌ Não foram encontrados dados de glicemia no seu Nightscout.')
            }
        } else {
            setWrong(recentDataId)
            setResumeText('❌ Ocorreu um erro ao buscar dados recentes de glicemia.')
            showToast('Erro ao buscar dados recentes de glicemia.', 'error');
            return;
        }

        await checkDbFreeSpace()
    } catch (error) {
        setWrong(recentDataId);
        setResumeText('❌ Ocorreu um erro inesperado ao buscar dados recentes de glicemia.');
        console.error("Erro inesperado em checkRecentData:", error);
        showToast('Erro inesperado ao buscar dados recentes.', 'error');
        return;
    }
}

async function checkDbFreeSpace() {
    await setLoadingStatus(dbFreeSpaceId);
    try {
        const url = document.querySelector('#urlInput').value.trim();
        const apiSecret = document.querySelector('#apiSecretInput').value.trim();
        const apiSecretHash = await sha1(apiSecret);
        const path = `/api/v2/properties/dbsize?secret=${apiSecretHash}`;
        const fullUrl = new URL(path, url).href;
        let response;
        try {
            response = await fetchWithTimeout(fullUrl, { method: "GET" });
        } catch (error) {
            response = undefined;
            console.error("Erro ao buscar dados do tamanho do banco de dados:", error);
            showToast('Erro de rede ao buscar tamanho do banco de dados.', 'error');
        }

        if (response && response.ok && response.status === 200) {
            let data;
            try {
                data = await response.json();
                if (!data.dbsize) {
                    console.warn("Resposta vazia do Nightscout, tentando novamente...");
                    await new Promise(r => setTimeout(r, 1000));
                    const retry = await fetchWithTimeout(fullUrl, { method: "GET" });
                    if (retry.ok) data = await retry.json();
                }
            } catch (error) {
                setWrong(dbFreeSpaceId);
                setResumeText('❌ Ocorreu um erro ao converter resposta do espaço do banco de dados.');
                showToast('Erro ao converter espaço do banco de dados.', 'error');
                return;
            }

            let dbSize = data?.dbsize?.dataPercentage
            if (dbSize !== undefined) {
                dbSize = parseInt(dbSize)
                if (dbSize >= 100) {
                    setWrong(dbFreeSpaceId)
                    setResumeText(`❌ O espaço utilizado no banco de dados é de ${dbSize}%. <a target="_blank" href="https://tecnologiasnodiabetes.com.br/apagando-bancodedados">Clique aqui</a> para aprender a resolver este problema.`)
                } else if (dbSize >= 70) {
                    setWarning(dbFreeSpaceId)
                    setResumeText(`⚠️ O espaço utilizado no banco de dados é de ${dbSize}% e, nesse ritmo, em breve irá encher. <a target="_blank" href="https://tecnologiasnodiabetes.com.br/apagando-bancodedados">Clique aqui</a> para aprender a resolver este problema.`)
                } else {
                    setCorrect(dbFreeSpaceId)
                }
            } else {
                setWarning(dbFreeSpaceId)
                setResumeText('❌ Não foi possível localizar espaço utilizado do banco de dados no seu Nightscout.')
            }
        } else {
            setWrong(dbFreeSpaceId)
            setResumeText('❌ Ocorreu um erro ao buscar o espaço utilizado do banco de dados.')
            showToast('Erro ao buscar o espaço do banco de dados.', 'error');
            return;
        }

        await moreTests()
    } catch (error) {
        setWrong(dbFreeSpaceId);
        setResumeText('❌ Ocorreu um erro inesperado ao buscar espaço do banco de dados.');
        console.error("Erro inesperado em checkDbFreeSpace:", error);
        showToast('Erro inesperado ao buscar espaço do banco.', 'error');
        return;
    }
}

async function moreTests() {
    let errorFound = false
    await setLoadingStatus(moreTestsId)
    try {
        const url = document.querySelector('#urlInput').value.trim();
        const apiSecret = document.querySelector('#apiSecretInput').value.trim();
        const apiSecretHash = await sha1(apiSecret);
        const pathDeviceStatus = `/api/v1/devicestatus?secret=${apiSecretHash}`;
        const fullUrlDeviceStatus = new URL(pathDeviceStatus, url).href
        let responseDeviceStatus

        try {
            responseDeviceStatus = await fetchWithTimeout(fullUrlDeviceStatus, { method: "GET" });
        } catch (error) {
            errorFound = true
            setWrong(moreTestsId)
            setResumeText('❌ Ocorreu um erro ao buscar dados de bateria dos dispositivos conectados.')
            console.error("Erro ao buscar dados de bateria:", error);
            showToast('Erro de rede ao buscar dados de bateria.', 'error');
        }

        if (responseDeviceStatus && responseDeviceStatus.ok && responseDeviceStatus.status === 200) {
            let dataDeviceStatus;
            try {
                dataDeviceStatus = await responseDeviceStatus.json();
            } catch (error) {
                errorFound = true
                setWrong(moreTestsId)
                setResumeText('❌ Ocorreu um erro ao converter dados de bateria dos dispositivos conectados.')
                console.error("Erro ao converter dados de bateria:", error);
                showToast('Erro ao converter dados de bateria.', 'error');
            }

            if (dataDeviceStatus) {
                const devicesFiltered = dataDeviceStatus.filter(item => item.uploader && item.uploader.battery)
                const devicesGrouped = devicesFiltered.reduce((acc, item) => {
                    const key = item.device;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                    }, {});

                if (Object.keys(devicesGrouped).length > 0) {
                    Object.values(devicesGrouped).forEach(items => {
                        const first = items[0]
                        if (first.uploader.battery < 30) {
                            const now = Date.now()
                            const diffMs = now - new Date(first.created_at)
                            const diffMin = parseInt(diffMs / (1000 * 60))
                            errorFound = true
                            setWarning(moreTestsId)
                            setResumeText(`⚠️ Dispositivo "${first.device}" conectado ao Nightscout detectado com apenas ${first.uploader.battery}% de bateria${diffMin > 60 ? ` (detecção antiga: ${diffMin} minutos atrás)` : ''}.`)
                        }
                    })
                } else {
                    errorFound = true
                    setWrong(moreTestsId)
                    setResumeText(`❌ Não foi encontrado nenhum dado de bateria dos dispositivos conectados ao Nightscout.`)
                }
            }
        } else if (!errorFound) {
            errorFound = true
            setWrong(moreTestsId)
            setResumeText('❌ Ocorreu um erro ao buscar dados de bateria dos dispositivos conectados.')
            showToast('Erro ao buscar dados de bateria.', 'error');
        }
    } catch (error) {
        errorFound = true
        setWrong(moreTestsId)
        setResumeText('❌ Ocorreu um erro inesperado ao buscar dados de bateria dos dispositivos conectados.')
        console.error("Erro inesperado em moreTests:", error);
        showToast('Erro inesperado ao buscar dados de bateria.', 'error');
    }

    if (!errorFound) {
        setCorrect(moreTestsId)
    }
}

async function sha1(message) {
    return window.NightscoutCommon.sha1(message);
}

function setLoadingStatus(id) {
    document.getElementById(id).src = './img/loading.gif';
    return new Promise(resolve => setTimeout(resolve, 500));
}

function setCorrect(id) {
    document.getElementById(id).src = './img/check.png';
}

function setWrong(id) {
    document.getElementById(id).src = './img/wrong.png';
}

function setWarning(id) {
    document.getElementById(id).src = './img/warning.png';
}

function setNoResult(id) {
    document.getElementById(id).src = './img/no-result.png';
}

function setResumeText(message) {
    resumeText += `${message}\n\n`
}

function populateResume() {
    if (resumeText === '') {
        resumeText = '✅ Seu Nightscout está funcionando corretamente, se algo não parece bem, é provável que seja configuração dentro dos aplicativos.'
    }
    const resume = document.getElementById('resume');
    resume.innerHTML = resumeText;
}

async function getTotalUsage() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/nightscoutTesterUses`);
        if (response.ok) {
            const data = await response.json();
            const usagesElement = document.getElementById('usageValue');
            if (usagesElement) usagesElement.textContent = data.count;
        } else {
            console.error('Erro ao obter contador de usos do testador de Nightscout:', response.status);
        }
    } catch (error) {
        console.error('Erro na requisição GET "nightscoutTesterUses":', error);
    }
}

async function incrementUsage() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/incrementNightscoutTesterUses`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            try { await getTotalUsage(); } catch (_) { }
        } else {
            console.error('Erro ao incrementar contador:', response.status);
        }
    } catch (error) {
        console.error('Erro na requisição POST:', error);
    }
}