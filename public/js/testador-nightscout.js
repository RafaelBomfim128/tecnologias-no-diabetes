const validUrlId = 'validUrl';
const correctSecretId = 'correctSecret';
const recentDataId = 'recentData';
const dbFreeSpaceId = 'dbFreeSpace';
const moreTestsId = 'moreTests';
let dateResult;
let hasCors;

document.addEventListener("DOMContentLoaded", () => {
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
    hasCors = true
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
    // Suporta chamadas como (url, options, timeout) ou (url, timeout)
    let options = {};
    let timeout = 10000;
    if (typeof optionsOrTimeout === 'number') {
        timeout = optionsOrTimeout;
    } else if (typeof optionsOrTimeout === 'object' && optionsOrTimeout) {
        options = optionsOrTimeout;
    }
    if (typeof maybeTimeout === 'number') {
        timeout = maybeTimeout;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        let resp;
        if (hasCors) {
            resp = await fetch(url, { cache: 'no-store', redirect: 'follow', ...options, signal: controller.signal });
        } else {
            const urlProxy = new URL(`/api/proxy?url=${encodeURIComponent(url)}`, window.env.API_BASE_URL).href;
            resp = await fetch(urlProxy, { ...options, signal: controller.signal });
        }
        return resp;
    } finally {
        clearTimeout(id);
    }
}

function tryNormalizeUrl(input) {
    try {
        return new URL(input).href;
    } catch (e) {
        try {
            return new URL('https://' + input).href;
        } catch (e2) {
            return null;
        }
    }
}

async function checkValidUrl() {
    await setLoadingStatus(validUrlId);
    try {
        const raw = document.querySelector('#urlInput').value.trim();
        const normalizedUrl = tryNormalizeUrl(raw);

        if (!normalizedUrl) {
            console.warn('URL inválida fornecida:', raw);
            setWrong(validUrlId);
            setResumeText('❌ URL inválida. Verifique o formato (ex: https://example.com) e tente novamente.');
            return;
        }

        if (!window.env || !window.env.API_BASE_URL) {
            console.error('API_BASE_URL não encontrada em window.env. window.env:', window.env);
            setWrong(validUrlId);
            setResumeText('❌ Configuração do testador ausente ou incorreta (API_BASE_URL não definida). Contate o administrador do site.');
            return;
        }

        let response = null;

        try {
            response = await fetchWithTimeout(normalizedUrl, { method: "GET" }, 8000);
        } catch (clientErr) {
            console.log('Fetch direto falhou (provável CORS/timeout):', clientErr && clientErr.message);
            showToast('Não foi possível contatar seu Nightscout diretamente (CORS/timeout). Tentando via proxy...', 'warning');

            let urlProxy;
            try {
                urlProxy = new URL(`/api/proxy?url=${encodeURIComponent(normalizedUrl)}`, window.env.API_BASE_URL).href;
                console.log('Proxy URL construída:', urlProxy);
            } catch (urlErr) {
                console.error('Erro ao construir URL do proxy:', urlErr);
                setWrong(validUrlId);
                setResumeText('❌ Configuração do testador inválida (erro ao construir URL do proxy). Contate o administrador do site.');
                return;
            }

            hasCors = false;
            try {
                response = await fetchWithTimeout(urlProxy, { method: "GET", mode: "cors" }, 10000);
                console.log('Resposta do proxy obtida:', response && response.status);
            } catch (proxyErr) {
                console.error('Erro ao buscar via proxy:', proxyErr);
                showToast('Falha ao contatar o serviço de proxy. Verifique sua conexão e tente novamente.', 'error');

                if (proxyErr.name === 'AbortError') {
                    setWrong(validUrlId);
                    setResumeText('❌ Tempo esgotado ao contatar o proxy (timeout). Tente novamente mais tarde.');
                    return;
                }

                if (proxyErr.name === 'TypeError' && /failed to fetch/i.test(String(proxyErr.message))) {
                    setWrong(validUrlId);
                    setResumeText('❌ Não foi possível contatar o serviço de proxy (erro de rede). Verifique sua conexão ou tente novamente mais tarde.');
                    return;
                }

                setWrong(validUrlId);
                setResumeText('❌ Testador temporariamente indisponível (não foi possível contatar o serviço de proxy). Tente novamente mais tarde.');
                return;
            }
        }

        if (!response) {
            setWrong(validUrlId);
            setResumeText('❌ Não foi obtida resposta do servidor. Tente novamente.');
            return;
        }

        let htmlText = '';
        try {
            htmlText = await response.text();
        } catch (e) {
            console.error('Erro ao ler body da resposta 200:', e);
            setWrong(validUrlId);
            setResumeText('❌ Erro ao processar a resposta do servidor.');
            showToast('Erro ao processar a resposta do servidor.', 'error');
            return;
        }

        let parser, doc;
        try {
            parser = new DOMParser();
            doc = parser.parseFromString(htmlText, "text/html");
        } catch (e) {
            setWrong(validUrlId);
            setResumeText('❌ Erro ao processar o HTML retornado pelo servidor.');
            showToast('Erro ao processar o HTML retornado.', 'error');
            return;
        }

        const hasCurrentBG = doc.querySelector(".currentBG") !== null;
        const mongoDbUriMissing = Array.from(doc.querySelectorAll("dd")).some(dd => dd.textContent.includes("MONGODB_URI setting is missing"));
        const mongoDbUriInvalid = Array.from(doc.querySelectorAll("dd")).some(dd => dd.textContent.includes("MONGODB_URI seems invalid"));
        const shortApiSecret = Array.from(doc.querySelectorAll("dd")).some(dd => dd.textContent.includes("API_SECRET should be at least 12 characters"));

        if (hasCurrentBG) {
            setCorrect(validUrlId);
        } else if (mongoDbUriMissing) {
            setWrong(validUrlId);
            setResumeText('❌ Seu Nightscout não foi criado corretamente, pois a variável "MONGODB_URI" não está presente.');
            return;
        } else if (mongoDbUriInvalid) {
            setWrong(validUrlId);
            setResumeText('❌ As credenciais do MongoDB foram definidas incorretamente durante a criação do seu Nightscout na variável MONGODB_URI.');
            return;
        } else if (shortApiSecret) {
            setWrong(validUrlId);
            setResumeText('❌ Durante a criação do seu Nightscout, foi definida uma API Secret muito curta (menor de 12 caracteres).');
            return;
        } else if (/502 Bad Gateway|500 Internal Server Error|Service Unavailable|Bad Gateway/i.test(htmlText)) {
            setWrong(validUrlId);
            setResumeText('❌ Detectado HTML de erro no conteúdo retornado — o Nightscout pode estar fora do ar.');
            return;
        } else if (response.status !== 200) {
            const proxyErrorType = response.headers.get('x-proxy-error-type');
            console.log('Status != 200. status=', response.status, 'x-proxy-error-type=', proxyErrorType, 'bodySample=', (htmlText || '').slice(0, 200));

            if (proxyErrorType === 'host-unresolved' || response.status === 422) {
                setWrong(validUrlId);
                setResumeText('❌ Domínio inválido / não encontrado. Verifique o nome do host digitado.');
                return;
            }

            if (proxyErrorType === 'upstream-unreachable') {
                setWrong(validUrlId);
                setResumeText('❌ O Nightscout parece estar inatingível (conexão recusada ou timeout).');
                return;
            }

            if (proxyErrorType === 'proxy-error') {
                setWrong(validUrlId);
                setResumeText('❌ O testador (proxy) encontrou um erro ao tentar acessar a URL. Tente novamente mais tarde.');
                return;
            }

            if (response.status === 502) {
                setWrong(validUrlId);
                if (raw.toLowerCase().includes('.nightscout4u.com')) {
                    setResumeText('❌ O Nightscout retornou erro 502 (Bad Gateway). Detectamos que você usa Nightscout da plataforma "Nightscout4u", e infelizmente esse serviço passou a ser pago. Recomendamos que faça a migração para outra plataforma, como o fly.io.');
                } else {
                    setResumeText('❌ O Nightscout retornou erro 502 (Bad Gateway). Pode estar fora do ar ou com erro interno.');
                }
                return;
            }

            if (response.status >= 500 && response.status < 600) {
                setWrong(validUrlId);
                setResumeText(`❌ Erro de servidor (status ${response.status}). Seu Nightscout pode estar fora do ar ou com erro interno.`);
                return;
            }

            if (response.status === 404) {
                setWrong(validUrlId);
                setResumeText('❌ URL não encontrada (404). Verifique se a URL está correta.');
                return;
            }

            setWrong(validUrlId);
            setResumeText(`❌ O servidor retornou status ${response.status}. Pode estar fora do ar ou com erro interno.`);
            return;
        } else {
            setWrong(validUrlId);
            setResumeText('❌ Não foi possível identificar uma URL de Nightscout. Verifique se a URL está correta.');
            return;
        }

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
        const apiSecretHash = await sha1(apiSecret);
        const path = `/api/v1/verifyauth?t=${Date.now()}&secret=${apiSecretHash}`;
        const fullUrl = new URL(path, url).href;
        let response;
        try {
            response = await fetchWithTimeout(fullUrl, { method: "GET" });
        } catch (error) {
            response = undefined;
            console.error("Erro ao buscar dados da API Secret:", error);
            showToast('Erro de rede ao validar a API Secret.', 'error');
        }

        if (response && response.ok && response.status === 200) {
            let data;
            try {
                data = await response.json();
            } catch (error) {
                setWrong(correctSecretId);
                setResumeText('❌ Ocorreu um erro ao converter resposta da API Secret.');
                showToast('Erro ao converter resposta da API Secret.', 'error');
                return;
            }
            if (data?.message?.canRead && data?.message?.canWrite && data?.message?.isAdmin) {
                setCorrect(correctSecretId)
            } else {
                setWrong(correctSecretId)
                setResumeText('❌ A API Secret inserida está incorreta.')
                return
            }
        } else {
            setWrong(correctSecretId)
            setResumeText('❌ Ocorreu um erro ao buscar dados da API Secret. Verifique se você está conectado à internet.')
            showToast('Erro ao buscar dados da API Secret.', 'error');
            return;
        }

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
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const hashBuffer = await crypto.subtle.digest("SHA-1", data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    return hashHex;
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
        const response = await fetch(`${apiBaseUrl}/api/nightscoutUses`);
        if (response.ok) {
            const data = await response.json();
            const usagesElement = document.getElementById('usageValue');
            if (usagesElement) usagesElement.textContent = data.count;
        } else {
            console.error('Erro ao obter contador de usos do testador de Nightscout:', response.status);
        }
    } catch (error) {
        console.error('Erro na requisição GET "nightscoutUses":', error);
    }
}

async function incrementUsage() {
    try {
        const response = await fetch(`${apiBaseUrl}/api/incrementNightcoutUses`, {
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