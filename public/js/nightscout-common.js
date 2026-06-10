(function initializeNightscoutCommon(global) {
    function createRequestState() {
        return { hasCors: true };
    }

    async function sha1(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function normalizeUrl(input) {
        try {
            return new URL(input).href;
        } catch (error) {
            try {
                return new URL(`https://${input}`).href;
            } catch (secondError) {
                return null;
            }
        }
    }

    async function fetchWithTimeout(url, requestState, apiBaseUrl, optionsOrTimeout, maybeTimeout) {
        let options = {};
        let timeout = 60000;

        if (typeof optionsOrTimeout === 'number') {
            timeout = optionsOrTimeout;
        } else if (typeof optionsOrTimeout === 'object' && optionsOrTimeout) {
            options = optionsOrTimeout;
        }

        if (typeof maybeTimeout === 'number') {
            timeout = maybeTimeout;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            let targetUrl = url;

            if (requestState && requestState.hasCors === false) {
                if (!apiBaseUrl) {
                    throw new Error('API_BASE_URL_NOT_DEFINED');
                }

                targetUrl = new URL(`/api/proxy?url=${encodeURIComponent(url)}`, apiBaseUrl).href;
            }

            return await fetch(targetUrl, {
                cache: 'no-store',
                redirect: 'follow',
                ...options,
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async function validateUrl(rawUrl, { apiBaseUrl, requestState = createRequestState(), notify } = {}) {
        const normalizedUrl = normalizeUrl(rawUrl);

        if (!normalizedUrl) {
            return {
                ok: false,
                message: '❌ URL inválida. Verifique o formato (ex: https://example.com) e tente novamente.',
                requestState
            };
        }

        if (!apiBaseUrl) {
            return {
                ok: false,
                message: '❌ Configuração ausente ou incorreta (API_BASE_URL não definida). Contate o administrador do site.',
                requestState
            };
        }

        let response;

        try {
            response = await fetchWithTimeout(normalizedUrl, requestState, apiBaseUrl, { method: 'GET' }, 8000);
        } catch (directError) {
            notify?.('Não foi possível contatar seu Nightscout diretamente (CORS/timeout). Tentando via proxy...', 'warning');
            requestState.hasCors = false;

            try {
                response = await fetchWithTimeout(normalizedUrl, requestState, apiBaseUrl, { method: 'GET', mode: 'cors' }, 10000);
            } catch (proxyError) {
                if (proxyError.name === 'AbortError') {
                    return {
                        ok: false,
                        message: '❌ Tempo esgotado ao contatar o proxy (timeout). Tente novamente mais tarde.',
                        requestState
                        };
                }

                if (proxyError.name === 'TypeError' && /failed to fetch/i.test(String(proxyError.message))) {
                    return {
                        ok: false,
                        message: '❌ Não foi possível contatar o serviço de proxy (erro de rede). Verifique sua conexão ou tente novamente mais tarde.',
                        requestState
                    };
                }

                notify?.('Falha ao contatar o serviço de proxy. Verifique sua conexão e tente novamente.', 'error');

                return {
                    ok: false,
                    message: '❌ Não foi possível contatar o serviço de proxy. Tente novamente mais tarde.',
                    requestState
                };
            }
        }

        if (!response) {
            return {
                ok: false,
                message: '❌ Não foi obtida resposta do servidor. Tente novamente.',
                requestState
            };
        }

        let htmlText;

        try {
            htmlText = await response.text();
        } catch (error) {
            notify?.('Erro ao processar a resposta do servidor.', 'error');
            return {
                ok: false,
                message: '❌ Erro ao processar a resposta do servidor.',
                requestState
            };
        }

        let documentNode;

        try {
            documentNode = new DOMParser().parseFromString(htmlText, 'text/html');
        } catch (error) {
            notify?.('Erro ao processar o HTML retornado.', 'error');
            return {
                ok: false,
                message: '❌ Erro ao processar o HTML retornado pelo servidor.',
                requestState
            };
        }

        const hasCurrentBG = documentNode.querySelector('.currentBG') !== null;
        const details = Array.from(documentNode.querySelectorAll('dd'));
        const mongoDbUriMissing = details.some(detail => detail.textContent.includes('MONGODB_URI setting is missing'));
        const mongoDbUriInvalid = details.some(detail => detail.textContent.includes('MONGODB_URI seems invalid'));
        const shortApiSecret = details.some(detail => detail.textContent.includes('API_SECRET should be at least 12 characters'));

        if (hasCurrentBG) {
            return {
                ok: true,
                normalizedUrl,
                requestState
            };
        }

        if (mongoDbUriMissing) {
            return {
                ok: false,
                message: '❌ Seu Nightscout não foi criado corretamente, pois a variável "MONGODB_URI" não está presente.',
                requestState
            };
        }

        if (mongoDbUriInvalid) {
                return {
                    ok: false,
                    message: '❌ Falha! Duas possibilidades:<br><br>1: As credenciais do MongoDB foram definidas incorretamente durante a criação do seu Nightscout na variável MONGODB_URI.<br><br>2: Você ficou muito tempo sem acessar seu Nightscout e o provedor do banco de dados MongoDB suspendeu o serviço por inatividade.',
                    requestState
                };
        }

        if (shortApiSecret) {
            return {
                ok: false,
                message: '❌ Durante a criação do seu Nightscout, foi definida uma API Secret muito curta (menor de 12 caracteres).',
                requestState
            };
        }

        if (/502 Bad Gateway|500 Internal Server Error|Service Unavailable|Bad Gateway/i.test(htmlText)) {
            return {
                ok: false,
                message: '❌ Detectado HTML de erro no conteúdo retornado. O Nightscout pode estar fora do ar.',
                requestState
            };
        }
        
        if (response.status !== 200) {
            const proxyErrorType = response.headers.get('x-proxy-error-type');

            if (proxyErrorType === 'host-unresolved' || response.status === 422) {
                return {
                    ok: false,
                    message: '❌ Domínio inválido / não encontrado. Verifique o nome do host digitado.',
                    requestState
                };
            }

            if (proxyErrorType === 'upstream-unreachable') {
                return {
                    ok: false,
                    message: '❌ O Nightscout parece estar inatingível (conexão recusada ou timeout).',
                    requestState
                };
            }

            if (proxyErrorType === 'proxy-error') {
                return {
                    ok: false,
                    message: '❌ O proxy encontrou um erro ao tentar acessar a URL. Tente novamente mais tarde.',
                    requestState
                };
            }

            if (response.status === 502) {
                return {
                    ok: false,
                    message: rawUrl.toLowerCase().includes('.nightscout4u.com')
                        ? '❌ O Nightscout retornou erro 502 (Bad Gateway). Detectamos uso da plataforma Nightscout4u, que hoje é paga. Recomendamos migrar para outra plataforma, como o fly.io.'
                        : '❌ O Nightscout retornou erro 502 (Bad Gateway). Pode estar fora do ar ou com erro interno.',
                    requestState
                };
            }

            if (response.status >= 500 && response.status < 600) {
                return {
                    ok: false,
                    message: `❌ Erro de servidor (status ${response.status}). Seu Nightscout pode estar fora do ar ou com erro interno.`,
                    requestState
                };
            }

            if (response.status === 404) {
                return {
                    ok: false,
                    message: '❌ URL não encontrada (404). Verifique se a URL está correta.',
                    requestState
                };
            }

            return {
                ok: false,
                message: `❌ O servidor retornou status ${response.status}. Pode estar fora do ar ou com erro interno.`,
                requestState
            };
        }

        return {
            ok: false,
            message: '❌ Não foi possível identificar uma URL de Nightscout. Verifique se a URL está correta.',
            requestState
        };
    }

    async function verifyApiSecret({
        baseUrl,
        apiSecret,
        apiBaseUrl,
        requestState = createRequestState(),
        notify,
        requiredScopes = ['canRead', 'canWrite', 'isAdmin']
    } = {}) {
        const apiSecretHash = await sha1(apiSecret);
        const path = `/api/v1/verifyauth?t=${Date.now()}&secret=${apiSecretHash}`;
        const fullUrl = new URL(path, baseUrl).href;

        let response;

        try {
            response = await fetchWithTimeout(fullUrl, requestState, apiBaseUrl, { method: 'GET' });
        } catch (error) {
            notify?.('Erro de rede ao validar a API Secret.', 'error');
            return {
                ok: false,
                message: '❌ Ocorreu um erro ao buscar dados da API Secret. Verifique se você está conectado à internet.',
                requestState
            };
        }

        if (!(response && response.ok && response.status === 200)) {
            return {
                ok: false,
                message: '❌ Ocorreu um erro ao buscar dados da API Secret. Verifique se você está conectado à internet.',
                requestState
            };
        }

        let data;

        try {
            data = await response.json();
        } catch (error) {
            notify?.('Erro ao converter resposta da API Secret.', 'error');
            return {
                ok: false,
                message: '❌ Ocorreu um erro ao converter resposta da API Secret.',
                requestState
            };
        }

        const message = data?.message || {};
        const hasRequiredScopes = requiredScopes.every(scope => Boolean(message?.[scope]));

        if (hasRequiredScopes) {
            return {
                ok: true,
                apiSecretHash,
                requestState
            };
        }

        return {
            ok: false,
            message: '❌ A API Secret inserida está incorreta.',
            requestState
        };
    }

    async function fetchEntries({
        baseUrl,
        apiSecret,
        apiSecretHash,
        apiBaseUrl,
        requestState = createRequestState(),
        startDate,
        endDate,
        count = 10000,
        notify
    } = {}) {
        const resolvedSecretHash = apiSecretHash || await sha1(apiSecret);
        const params = new URLSearchParams();

        params.set('count', String(count));

        if (startDate) {
            params.set('find[date][$gte]', String(startOfDay(startDate).getTime()));
        }

        if (endDate) {
            params.set('find[date][$lte]', String(endOfDay(endDate).getTime()));
        }

        params.set('secret', resolvedSecretHash);

        const fullUrl = new URL(`/api/v1/entries.json?${params.toString()}`, baseUrl).href;
        let response;

        try {
            response = await fetchWithTimeout(fullUrl, requestState, apiBaseUrl, { method: 'GET' });
        } catch (error) {
            notify?.('Erro de rede ao buscar dados de glicemia.', 'error');
            return {
                ok: false,
                message: '❌ Ocorreu um erro de rede ao buscar os dados de glicemia.',
                requestState
            };
        }

        if (!(response && response.ok && response.status === 200)) {
            return {
                ok: false,
                message: '❌ Ocorreu um erro ao buscar os dados de glicemia no Nightscout.',
                requestState
            };
        }

        let data;

        try {
            data = await response.json();
        } catch (error) {
            notify?.('Erro ao converter os dados de glicemia retornados.', 'error');
            return {
                ok: false,
                message: '❌ Ocorreu um erro ao converter os dados de glicemia retornados.',
                requestState
            };
        }

        if (!Array.isArray(data)) {
            return {
                ok: false,
                message: '❌ O Nightscout retornou um formato inesperado para os dados de glicemia.',
                requestState
            };
        }
        const entries = data.slice().sort((first, second) => (first.date || 0) - (second.date || 0));

        return {
            ok: true,
            entries,
            requestState
        };
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function endOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    }

    global.NightscoutCommon = {
        createRequestState,
        fetchWithTimeout,
        normalizeUrl,
        sha1,
        validateUrl,
        verifyApiSecret,
        fetchEntries
    };
})(window);