// ========== SISTEMA DE PAINEL COM FILA E TRATAMENTO DE ERROS ==========
document.addEventListener("DOMContentLoaded", () => {
    'use strict';
    
    // ========== CONSTANTES E CONFIGURAÇÕES ==========
    const CONFIG = {
        VIDEO_STORAGE_KEY: "videoatualkey",
        AUDIO_INITIALIZED_KEY: "audioSystemInitialized",
        INTERVALO_VERIFICACAO: 3000, // 3 segundos (otimizado)
        TEMPO_EXIBICAO: 7000, // 7 segundos
        TIMEOUT_REQUISICAO: 10000, // 10 segundos timeout
        MAX_TENTATIVAS_ERRO: 3
    };
    
    // ========== VARIÁVEIS DE ESTADO ==========
    let temporizadorRetracao = null;
    let chamadaAtualId = null;
    let exibindoChamada = false;
    let tentativasErroConsecutivas = 0;
    let intervaloVerificacao = null;
    
    // Obter setor configurado
    const setorPainel = window.getPainelSetor ? window.getPainelSetor() : 'ambulatorio';
    console.log(`🏥 Painel configurado para setor: ${setorPainel}`);
    
    // ========== ELEMENTOS DO DOM ==========
    const elementos = {
        pacienteEl: document.getElementById("pacienteAtual"),
        consultorioEl: document.getElementById("consultorioAtual"),
        listaEl: document.getElementById("listaUltimas"),
        alertaSom: document.getElementById("alertaSom"),
        pacienteBox: document.getElementById("pacienteConsultorio"),
        streaming: document.getElementById("streamingNovela"),
        historico: document.getElementById("historicoChamadas"),
        overlayInicializar: document.getElementById("inicializarSistema"),
        btnInicializar: document.getElementById("btnInicializar")
    };
    
    // Verificar se elementos essenciais existem
    if (!elementos.pacienteEl || !elementos.consultorioEl || !elementos.alertaSom) {
        console.error('❌ Elementos essenciais do DOM não encontrados!');
        mostrarErroFatal('Erro ao carregar painel. Recarregue a página.');
        return;
    }
    
    // ========== INICIALIZAR PAINEL (LIMPAR CHAMADAS ANTIGAS) ==========
    const painelJaInicializado = sessionStorage.getItem(`painelInicializado_${setorPainel}`) === "true";
    
    if (!painelJaInicializado) {
        console.log('🔧 Inicializando painel pela primeira vez...');
        fetch(`/chamadas/inicializar/${setorPainel}`, {
            method: 'POST'
        })
        .then(res => res.json())
        .then(data => {
            console.log(`🧹 Painel inicializado: ${data.chamadas_limpas || 0} chamadas antigas limpas`);
            sessionStorage.setItem(`painelInicializado_${setorPainel}`, "true");
        })
        .catch(err => console.warn('⚠️ Erro ao inicializar painel:', err));
    }
    
    // ========== SISTEMA DE INICIALIZAÇÃO DE ÁUDIO ==========
    const audioJaInicializado = localStorage.getItem(CONFIG.AUDIO_INITIALIZED_KEY) === "true";
    
    if (audioJaInicializado) {
        if (elementos.overlayInicializar) {
            elementos.overlayInicializar.classList.add("hidden");
        }
        if (elementos.alertaSom) {
            elementos.alertaSom.load();
        }
        console.log('✅ Sistema de áudio já inicializado');
    } else {
        if (elementos.overlayInicializar) {
            elementos.overlayInicializar.classList.remove("hidden");
        }
        console.log('⚠️ Sistema de áudio aguardando inicialização');
    }
    
    // Botão de inicializar áudio
    if (elementos.btnInicializar) {
        elementos.btnInicializar.addEventListener("click", async () => {
            console.log("🔊 Inicializando sistema de áudio...");
            
            if (elementos.alertaSom) {
                try {
                    elementos.alertaSom.volume = 0.01;
                    await elementos.alertaSom.play();
                    elementos.alertaSom.pause();
                    elementos.alertaSom.currentTime = 0;
                    elementos.alertaSom.volume = 1.0;
                    console.log("✅ Sistema de áudio inicializado!");
                } catch (e) {
                    console.warn("⚠️ Erro ao inicializar áudio:", e);
                }
            }
            
            localStorage.setItem(CONFIG.AUDIO_INITIALIZED_KEY, "true");
            
            if (elementos.overlayInicializar) {
                elementos.overlayInicializar.classList.add("hidden");
            }
            
            iniciarSistema();
        });
    }
    
    // ========== FUNÇÕES DE INTERFACE ==========
    let youtubePlayer = null;
    let iframeJaCriado = false;
    
    function criarIframe(url) {
        if (!elementos.streaming || iframeJaCriado) return;
        
        console.log('🎬 Criando player do YouTube (apenas uma vez)...');
        iframeJaCriado = true;
        
        // Criar iframe diretamente (mais confiável que a API)
        const iframe = document.createElement('iframe');
        iframe.id = 'youtubePlayer';
        iframe.src = url + '?autoplay=1&rel=0&modestbranding=1';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.setAttribute('loading', 'eager');
        elementos.streaming.appendChild(iframe);
        youtubePlayer = iframe;
        
        console.log('✅ Player criado com sucesso!');
    }
    
    function expandirTela() {
        if (!elementos.pacienteBox || !elementos.streaming || !elementos.historico) return;
        
        elementos.pacienteBox.classList.add("expandido");
        elementos.streaming.classList.add("hidden");
        elementos.historico.classList.add("hidden");
    }
    
    function retrairTela() {
        if (!elementos.pacienteBox || !elementos.streaming || !elementos.historico) return;
        
        elementos.pacienteBox.classList.remove("expandido");
        elementos.streaming.classList.remove("hidden");
        elementos.historico.classList.remove("hidden");
        
        if (temporizadorRetracao) {
            clearTimeout(temporizadorRetracao);
            temporizadorRetracao = null;
        }
    }
    
    // ========== FUNÇÃO DE REQUISIÇÃO COM TIMEOUT ==========
    async function fetchComTimeout(url, opcoes = {}, timeout = CONFIG.TIMEOUT_REQUISICAO) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...opcoes,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }
    
    // ========== SISTEMA DE FILA - BUSCAR PRÓXIMA CHAMADA ==========
    async function buscarProximaChamada() {
        try {
            const response = await fetchComTimeout(
                `/chamadas/proxima/${setorPainel}`,
                { method: 'GET' }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const dados = await response.json();
            tentativasErroConsecutivas = 0; // Reset contador de erros
            
            return dados;
            
        } catch (error) {
            tentativasErroConsecutivas++;
            console.error(`❌ Erro ao buscar próxima chamada (tentativa ${tentativasErroConsecutivas}):`, error.message);
            
            if (tentativasErroConsecutivas >= CONFIG.MAX_TENTATIVAS_ERRO) {
                mostrarErroConexao();
            }
            
            return null;
        }
    }
    
    // ========== MARCAR CHAMADA COMO EXIBIDA ==========
    async function marcarChamadaExibida(id) {
        try {
            const response = await fetchComTimeout(
                `/chamadas/marcar-exibida/${id}`,
                { method: 'POST' }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            console.log(`✅ Chamada ${id} marcada como exibida`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao marcar chamada ${id} como exibida:`, error.message);
            return false;
        }
    }
    
    // ========== BUSCAR HISTÓRICO ==========
    async function buscarHistorico() {
        try {
            const response = await fetchComTimeout(
                `/chamadas/historico/${setorPainel}`,
                { method: 'GET' }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const historico = await response.json();
            return historico || [];
            
        } catch (error) {
            console.error('❌ Erro ao buscar histórico:', error.message);
            return [];
        }
    }
    
    // ========== ATUALIZAR HISTÓRICO NA INTERFACE ==========
    let ultimoHistoricoIds = [];
    
    function atualizarHistorico(chamadas) {
        if (!elementos.listaEl) return;
        
        if (!chamadas || chamadas.length === 0) {
            if (ultimoHistoricoIds.length !== 0) {
                elementos.listaEl.innerHTML = "<li style='opacity:0.5'>Sem chamadas recentes</li>";
                ultimoHistoricoIds = [];
            }
            return;
        }
        
        // Pega as 5 mais recentes (apenas exibidas)
        const historicoFiltrado = chamadas
            .filter(c => c.exibida === 1)
            .slice(0, 5);
        
        if (historicoFiltrado.length === 0) {
            if (ultimoHistoricoIds.length !== 0) {
                elementos.listaEl.innerHTML = "<li style='opacity:0.5'>Sem chamadas recentes</li>";
                ultimoHistoricoIds = [];
            }
            return;
        }
        
        // Comparar IDs para detectar mudanças reais
        const novosIds = historicoFiltrado.map(c => c.id).join(',');
        
        if (ultimoHistoricoIds.join(',') === novosIds) {
            // Sem mudanças, não atualizar DOM
            return;
        }
        
        // Atualizar cache de IDs
        ultimoHistoricoIds = historicoFiltrado.map(c => c.id);
        
        // Construir e atualizar HTML
        const novoHTML = historicoFiltrado.map(chamada => `
            <li>
                <strong>${String(chamada.consultorio)}</strong> - ${String(chamada.paciente)}
                <small>${chamada.hora || ''}</small>
            </li>
        `).join('');
        
        elementos.listaEl.innerHTML = novoHTML;
        console.log('📋 Histórico atualizado');
    }
    
    // ========== FUNÇÃO PRINCIPAL - VERIFICAR E EXIBIR CHAMADAS ==========
    async function verificarChamadas() {
        // Se já está exibindo uma chamada, aguardar
        if (exibindoChamada) {
            console.log('⏳ Chamada em exibição, aguardando...');
            return;
        }
        
        // Buscar próxima chamada não exibida
        const chamada = await buscarProximaChamada();
        
        if (!chamada || !chamada.id) {
            // Sem chamadas pendentes
            return;
        }
        
        // Nova chamada detectada!
        console.log(`🔔 Nova chamada na fila! ID: ${chamada.id} - ${chamada.paciente} - ${chamada.consultorio}`);
        
        // Marcar que está exibindo
        exibindoChamada = true;
        chamadaAtualId = chamada.id;
        
        // Atualizar interface
        if (elementos.pacienteEl) {
            elementos.pacienteEl.textContent = String(chamada.paciente || "--");
        }
        if (elementos.consultorioEl) {
            elementos.consultorioEl.textContent = String(chamada.consultorio || "--");
        }
        
        // Tocar som
        await tocarSom();
        
        // Expandir tela
        expandirTela();
        
        // Após tempo de exibição: retrair e marcar como exibida
        temporizadorRetracao = setTimeout(async () => {
            retrairTela();
            
            // Marcar como exibida no banco
            const marcada = await marcarChamadaExibida(chamada.id);
            
            // Atualizar histórico apenas se marcação foi bem-sucedida
            if (marcada) {
                const historico = await buscarHistorico();
                atualizarHistorico(historico);
            }
            
            // Liberar para próxima chamada
            exibindoChamada = false;
            chamadaAtualId = null;
            
            console.log('✅ Pronto para próxima chamada');
            
        }, CONFIG.TEMPO_EXIBICAO);
    }
    
    // ========== TOCAR SOM ==========
    async function tocarSom() {
        if (!elementos.alertaSom) {
            console.warn('⚠️ Elemento de áudio não encontrado');
            return;
        }
        
        try {
            elementos.alertaSom.currentTime = 0;
            await elementos.alertaSom.play();
            console.log('🔊 Som tocado com sucesso');
        } catch (error) {
            console.warn('⚠️ Erro ao tocar som:', error.message);
        }
    }
    
    // ========== FUNÇÕES DE VÍDEO ==========
    function salvarVideoAtual() {
        const videoAtual = localStorage.getItem(CONFIG.VIDEO_STORAGE_KEY);
        if (videoAtual) {
            localStorage.setItem(CONFIG.VIDEO_STORAGE_KEY, videoAtual);
        }
    }
    
    function carregarVideoSalvo() {
        const videoSalvo = localStorage.getItem(CONFIG.VIDEO_STORAGE_KEY);
        const urlPadrao = "https://www.youtube.com/embed/LLpNUqHVam8";
        criarIframe(videoSalvo || urlPadrao);
    }
    
    // ========== FUNÇÕES DE ERRO ==========
    function mostrarErroConexao() {
        console.error('🔴 Múltiplas falhas de conexão detectadas');
        if (elementos.pacienteEl) {
            elementos.pacienteEl.textContent = "ERRO DE CONEXÃO";
            elementos.pacienteEl.style.color = "#dc3545";
        }
        if (elementos.consultorioEl) {
            elementos.consultorioEl.textContent = "Verifique o servidor";
            elementos.consultorioEl.style.color = "#dc3545";
        }
    }
    
    function mostrarErroFatal(mensagem) {
        const body = document.body;
        body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#002b55;color:white;text-align:center;flex-direction:column;gap:20px;">
                <i class="fas fa-exclamation-triangle" style="font-size:5em;color:#dc3545;"></i>
                <h1>${mensagem}</h1>
                <button onclick="location.reload()" style="background:#007bff;color:white;border:none;padding:15px 30px;font-size:1.2em;border-radius:5px;cursor:pointer;">
                    Recarregar Página
                </button>
            </div>
        `;
    }
    
    // ========== INICIAR SISTEMA ==========
    function iniciarSistema() {
        console.log('🚀 Iniciando sistema de chamadas...');
        console.log(`📊 Configurações: Verificação a cada ${CONFIG.INTERVALO_VERIFICACAO/1000}s | Exibição por ${CONFIG.TEMPO_EXIBICAO/1000}s`);
        
        carregarVideoSalvo();
        
        // Carregar histórico inicial
        buscarHistorico().then(historico => {
            atualizarHistorico(historico);
            console.log('📋 Histórico inicial carregado');
        }).catch(err => {
            console.warn('⚠️ Erro ao carregar histórico inicial:', err);
        });
        
        // Primeira verificação imediata
        verificarChamadas();
        
        // Verificações periódicas
        intervaloVerificacao = setInterval(verificarChamadas, CONFIG.INTERVALO_VERIFICACAO);
        
        console.log('✅ Sistema iniciado com sucesso!');
    }
    
    // ========== INICIALIZAÇÃO ==========
    if (audioJaInicializado) {
        iniciarSistema();
    } else {
        console.log("⏸️ Aguardando inicialização manual do áudio...");
    }
    
    // Salvar vídeo antes de sair
    window.addEventListener("beforeunload", salvarVideoAtual);
    
    // Limpar timers ao sair
    window.addEventListener("beforeunload", () => {
        if (intervaloVerificacao) clearInterval(intervaloVerificacao);
        if (temporizadorRetracao) clearTimeout(temporizadorRetracao);
    });
    
    console.log('✅ Painel de Chamadas carregado');
});
