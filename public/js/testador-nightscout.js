const validUrlId = 'validUrl';
const correctSecretId = 'correctSecret';
const recentDataId = 'recentData';
const dbFreeSpaceId = 'dbFreeSpace';
const moreTestsId = 'moreTests';

document.addEventListener("DOMContentLoaded", () => {
    const btnTestNightscout = document.querySelector('#testNightscout');
    const url = document.querySelector('#urlInput');
    const apiSecret = document.querySelector('#apiSecretInput');

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
                document.getElementById('urlError').classList.remove('hidden');
                return;
            } else {
                url.classList.remove('error-input');
                document.getElementById('urlError').classList.add('hidden');
            }

            if (!apiSecret.value) {
                apiSecret.classList.add('error-input');
                apiSecret.focus();
                document.getElementById('apiSecretError').classList.remove('hidden');
                return;
            } else {
                apiSecret.classList.remove('error-input');
                document.getElementById('apiSecretError').classList.add('hidden');
            }

            if (!url.value.startsWith('http') && !url.value.startsWith('https')) {
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

            await checkValidUrl();
            populateResume();
            document.querySelector('#shareWhatsApp').classList.remove('hidden');
        });
    }

    url.addEventListener('change', function () {
        if (url.value.includes('@') && url.value.includes('/api')) {
            const urlExtracted = url.value.replace('http://', '').replace('https://', '').split('@')[1].split('/api')[0]
            const apiSecretExtracted = url.value.replace('http://', '').replace('https://', '').split('@')[0]
            url.value = `https://${urlExtracted}/`
            apiSecret.value = apiSecretExtracted
            btnTestNightscout.focus()
        }
    })
})

let hasRecentData
let resumeText = '';

function reset() {
    let hasRecentData = false
    resumeText = ''
    const resume = document.getElementById('resume').textContent = ''
    document.getElementById('urlError').classList.add('hidden');
    document.getElementById('apiSecretError').classList.add('hidden');
    document.querySelector('.status-list').classList.add('hidden');
    document.getElementById('resume').classList.add('hidden');
    document.querySelector('.resume-title').classList.add('hidden');
    document.getElementById('shareWhatsApp').classList.add('hidden');
    setNoResult(validUrlId)
    setNoResult(correctSecretId)
    setNoResult(recentDataId)
    setNoResult(dbFreeSpaceId)
    setNoResult(moreTestsId)
}

function showResume() {
    const statusList = document.querySelector('.status-list');
    if (statusList.classList.contains('hidden')) {
        statusList.classList.remove('hidden');
        document.getElementById('resume').classList.remove('hidden');
        document.querySelector('.resume-title.hidden').classList.remove('hidden');
    }
    const y = statusList.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top: y, behavior: 'smooth' });
}

async function checkValidUrl() {
    setLoadingStatus(validUrlId);
    const url = document.querySelector('#urlInput').value.trim();
    let response;
    try {
        response = await fetch(url, { method: "GET" });
    } catch (error) {
        console.error("Erro ao buscar dados da URL pelo client. Tentando pelo proxy:", error);
        try {
            const urlProxy = new URL(`/api/proxy?url=${url}`, window.env.API_BASE_URL).href
            response = await fetch(urlProxy, { method: "GET" });
        } catch (error) {
            console.error("Erro ao buscar dados da URL pelo proxy:", error);
        }
    }

    if (response.ok && response.status === 200) {
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        const hasCurrentBG = doc.querySelector(".currentBG") !== null;
        const mongoDbUriMissing = Array.from(doc.querySelectorAll("dd")).some(dd => dd.textContent.includes("MONGODB_URI setting is missing"));
        const mongoDbUriInvalid = Array.from(doc.querySelectorAll("dd")).some(dd => dd.textContent.includes("MONGODB_URI seems invalid"));
        const shortApiSecret = Array.from(doc.querySelectorAll("dd")).some(dd => dd.textContent.includes("API_SECRET should be at least 12 characters"));

        if (hasCurrentBG) {
            setCorrect(validUrlId)
            let isValidUrl = true
        } else if (mongoDbUriMissing) {
            setWrong(validUrlId)
            setResumeText('❌ Seu Nightscout não foi criado corretamente, pois a variável "MONGODB_URI" não está presente.')
            return;
        } else if (mongoDbUriInvalid) {
            setWrong(validUrlId)
            setResumeText('❌ As credenciais do MongoDB foram definidas incorretamente durante a criação do seu Nightscout na variável MONGODB_URI.')
            return;
        } else if (shortApiSecret) {
            setWrong(validUrlId)
            setResumeText('❌ Durante a criação do seu Nightscout, foi definida uma API Secret muito curta (menor de 12 caracteres).')
            return;
        } else {
            setWrong(validUrlId)
            setResumeText('❌ Algum erro desconhecido pelo desenvolvedor desse testador ocorreu no seu Nightscout. Informe no grupo de Tecnologias no Diabetes para maior auxílio.')
            return;
        }
    } else {
        setWrong(validUrlId)
        setResumeText('❌ Ocorreu um erro ao buscar dados da URL. Verifique se a URL digitada está correta e se está conectado à internet.')
        return;
    }

    await checkApiSecret();
}

async function checkApiSecret() {
    setLoadingStatus(correctSecretId);

    const url = document.querySelector('#urlInput').value.trim();
    const apiSecret = document.querySelector('#apiSecretInput').value.trim();
    const apiSecretHash = await sha1(apiSecret);
    const path = `/api/v1/verifyauth?t=${Date.now()}&secret=${apiSecretHash}`;
    const fullUrl = new URL(path, url).href;
    let response;
    try {
        response = await fetch(fullUrl, { method: "GET" });
    } catch (error) {
        console.error("Erro ao buscar dados da API Secret:", error);
    }

    if (response.ok && response.status === 200) {
        const data = await response.json();
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
        return;
    }

    await checkRecentData()
}

async function checkRecentData() {
    setLoadingStatus(recentDataId);

    const url = document.querySelector('#urlInput').value.trim();
    const apiSecret = document.querySelector('#apiSecretInput').value.trim();
    const apiSecretHash = await sha1(apiSecret);
    const path = `/api/v1/entries.json?count=1&secret=${apiSecretHash}`;
    const fullUrl = new URL(path, url).href;
    let response;
    try {
        response = await fetch(fullUrl, { method: "GET" });
    } catch (error) {
        console.error("Erro ao buscar dados recentes:", error);
    }

    if (response.ok && response.status === 200) {
        const data = await response.json();

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
                setResumeText('') //Mensagem de resumo informando que não há dados recentes recebidos
            }
        } else {
            setWarning(recentDataId)
            setResumeText('') //Mensagem de resumo informando que não há objeto de dados recentes no Nightscout
        }
    } else {
        setWrong(recentDataId)
        setResumeText('') //Mensagem de resumo informando que erro ao buscar dados recentes
        return;
    }

    await checkDbFreeSpace()
}

async function checkDbFreeSpace() {
    setLoadingStatus(dbFreeSpaceId);

    const url = document.querySelector('#urlInput').value.trim();
    const apiSecret = document.querySelector('#apiSecretInput').value.trim();
    const apiSecretHash = await sha1(apiSecret);
    const path = `/api/v2/properties/dbsize?secret=${apiSecretHash}`;
    const fullUrl = new URL(path, url).href;
    let response;
    try {
        response = await fetch(fullUrl, { method: "GET" });
    } catch (error) {
        console.error("Erro ao buscar dados do tamanho do banco de dados:", error);
    }

    if (response.ok && response.status === 200) {
        const data = await response.json();

        let dbSize = data?.dbsize?.dataPercentage
        if (dbSize) {
            dbSize = parseInt(dbSize)
            if (dbSize >= 100) {
                setWrong(dbFreeSpaceId)
                setResumeText('') //Mensagem de resumo informando tamanho do banco de dados maior do que 100%
            } else if (dbSize >= 70) {
                setWarning(dbFreeSpaceId)
                setResumeText('') //Mensagem de resumo informando atenção, pois banco de dados está acima de 70%
            } else {
                setCorrect(dbFreeSpaceId)
            }
        } else {
            setWarning(dbFreeSpaceId)
            setResumeText('') //Mensagem de resumo informando que não encontrou o objeto banco de dados no Nightscout
        }
    } else {
        setWrong(dbFreeSpaceId)
        setResumeText('') //Mensagem de resumo informando erro ao buscar tamanho do banco de dados
        return;
    }

    await moreTests()
}

async function moreTests() {
    let errorFound = false
    setLoadingStatus(moreTestsId)
    const url = document.querySelector('#urlInput').value.trim();
    const apiSecret = document.querySelector('#apiSecretInput').value.trim();
    const apiSecretHash = await sha1(apiSecret);
    const pathBattery = `/api/v2/properties/upbat?secret=${apiSecretHash}`;
    const fullUrlBattery = new URL(pathBattery, url).href;
    try {
        const responseBattery = await fetch(fullUrlBattery, { method: "GET" });
        if (responseBattery.ok && responseBattery.status === 200) {
            const dataBattery = await responseBattery.json();
            const minBattery = parseInt(dataBattery?.upbat?.min?.value)
            if (minBattery < 15) {
                errorFound = true
                setWarning(moreTestsId)
                if (hasRecentData) {
                    setResumeText('') //Mensagem de resumo informando que a bateria de um dos dispositivos é menor do que x%
                } else {
                    setResumeText('') //Mensagem de resumo informando que a bateria de um dos dispositivos é menor do que x%, e talvez seja por isso que não há dados recentes
                }
            }
        } else {
            errorFound = true
            setWarning(moreTestsId)
            setResumeText('') //Mensagem de resumo informando erro ao buscar dados de bateria
        }
    } catch (error) {
        errorFound = true
        setWrong(moreTestsId)
        console.error("Erro ao buscar dados de bateria:", error);
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
    resume.textContent = resumeText;
}