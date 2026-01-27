document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "ultimaChamadaId";
    const VIDEO_STORAGE_KEY = "videoatualkey"; //chave pra armazenar o video atual
    const AUDIO_INITIALIZED_KEY = "audioSystemInitialized"; // Flag para áudio inicializado
    let temporizadorRetracao = null;
    let ultimaChamadaId = localStorage.getItem(STORAGE_KEY); // Recupera o ID da última chamada salva
    
    // Se já existe um ID salvo, significa que não é a primeira vez (mesmo após reload)
    let primeiraVerificacao = (ultimaChamadaId === null);
    
    console.log(`🚀 Painel iniciado. Última ID salva: ${ultimaChamadaId} | Primeira verificação: ${primeiraVerificacao}`);

    // ========== SISTEMA DE INICIALIZAÇÃO DE ÁUDIO ==========
    const overlayInicializar = document.getElementById("inicializarSistema");
    const btnInicializar = document.getElementById("btnInicializar");
    const alertaSom = document.getElementById("alertaSom");
    
    // Verifica se o sistema de áudio já foi inicializado
    const audioJaInicializado = localStorage.getItem(AUDIO_INITIALIZED_KEY) === "true";
    
    if (audioJaInicializado) {
        // Se já foi inicializado, esconde o overlay
        if (overlayInicializar) {
            overlayInicializar.classList.add("hidden");
        }
        // Tenta carregar o áudio em background
        if (alertaSom) {
            alertaSom.load();
        }
    } else {
        // Mostra o overlay para inicializar
        if (overlayInicializar) {
            overlayInicializar.classList.remove("hidden");
        }
    }
    
    // Botão de inicializar sistema
    if (btnInicializar) {
        btnInicializar.addEventListener("click", async () => {
            console.log("🔊 Inicializando sistema de áudio...");
            
            // Toca um som silencioso para desbloquear o áudio
            if (alertaSom) {
                try {
                    alertaSom.volume = 0.01; // Volume baixo
                    await alertaSom.play();
                    alertaSom.pause();
                    alertaSom.currentTime = 0;
                    alertaSom.volume = 1.0; // Restaura volume normal
                    console.log("✅ Sistema de áudio inicializado com sucesso!");
                } catch (e) {
                    console.warn("Erro ao inicializar áudio:", e);
                }
            }
            
            // Marca como inicializado
            localStorage.setItem(AUDIO_INITIALIZED_KEY, "true");
            
            // Esconde o overlay
            if (overlayInicializar) {
                overlayInicializar.classList.add("hidden");
            }
            
            // Inicia o sistema normalmente
            carregarVideoSalvo();
            atualizarPainel();
        });
    }

    function getEls() {
        return {
            pacienteEl: document.getElementById("pacienteAtual"),
            consultorioEl: document.getElementById("consultorioAtual"),
            listaEl: document.getElementById("listaUltimas"),
            alertaSom: document.getElementById("alertaSom"),
            pacienteBox: document.getElementById("pacienteConsultorio"),
            streaming: document.getElementById("streamingNovela"),
            historico: document.getElementById("historicoChamadas"),
        };
    }

    function criarIframe(url) {
        const { streaming } = getEls();
        if (streaming) {
            streaming.innerHTML = "";
            const iframe = document.createElement("iframe");
            iframe.id = "youtubePlayer";
            iframe.src = url;
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            streaming.appendChild(iframe);
        }
    }

    function expandirTela() {
        const { pacienteBox, streaming, historico } = getEls();
        if (!pacienteBox || !streaming || !historico) return;
        pacienteBox.classList.add("expandido");
        streaming.classList.add("hidden");
        historico.classList.add("hidden");
    }

    function retrairTela() {
        const { pacienteBox, streaming, historico } = getEls();
        if (!pacienteBox || !streaming || !historico) return;
        pacienteBox.classList.remove("expandido");
        streaming.classList.remove("hidden");
        historico.classList.remove("hidden");
        clearTimeout(temporizadorRetracao);
        temporizadorRetracao = null;
    }

    async function atualizarPainel() {
        try {
            const response = await fetch("http://localhost:3000/chamadas");
            if (!response.ok) {
                console.error("Erro ao buscar chamadas:", response.status);
                return;
            }

            const chamadas = await response.json();
            const { pacienteEl, consultorioEl, listaEl, alertaSom } = getEls();
            if (!pacienteEl || !consultorioEl || !listaEl) {
                console.error("Elementos do DOM não encontrados.");
                return;
            }

            if (Array.isArray(chamadas) && chamadas.length > 0) {
                const chamadaAtual = chamadas[0];
                const nomePacienteAtual = (chamadaAtual.paciente || "").trim();
                const nomeConsultorioAtual = (chamadaAtual.consultorio || "").trim();
                const idChamadaAtual = chamadaAtual.id;

                // Atualiza UI sempre
                pacienteEl.textContent = nomePacienteAtual || "--";
                consultorioEl.textContent = nomeConsultorioAtual || "--";

                // Verifica se há uma nova chamada (compara pelo ID)
                const chamadaNova = idChamadaAtual && idChamadaAtual.toString() !== ultimaChamadaId;
                
                if (chamadaNova) {
                    console.log(`🔔 Nova chamada detectada! ID: ${idChamadaAtual} - ${nomePacienteAtual} - ${nomeConsultorioAtual}`);
                    console.log(`Última ID: ${ultimaChamadaId} | Nova ID: ${idChamadaAtual} | Primeira verificação: ${primeiraVerificacao}`);
                    
                    // Toca som e expande APENAS se não for a primeira verificação
                    if (!primeiraVerificacao) {
                        console.log("✅ Tocando som e expandindo tela...");
                        
                        if (alertaSom) {
                            try {
                                alertaSom.currentTime = 0;
                                await alertaSom.play();
                            } catch (e) {
                                console.warn("❌ Não foi possível reproduzir o áudio:", e);
                            }
                        }

                        expandirTela();
                        clearTimeout(temporizadorRetracao);
                        temporizadorRetracao = setTimeout(retrairTela, 7000);
                    } else {
                        console.log("⏭️ Primeira verificação - som não tocado (OK)");
                    }
                    
                    // Atualiza o ID da última chamada DEPOIS de tocar o som
                    ultimaChamadaId = idChamadaAtual.toString();
                    localStorage.setItem(STORAGE_KEY, ultimaChamadaId);
                }

                // Atualiza lista de últimas chamadas
                listaEl.innerHTML = "";
                chamadas.slice(1, 6).forEach((item) => {
                    const li = document.createElement("li");
                    li.textContent = `${item.consultorio} - ${item.paciente}`;
                    listaEl.appendChild(li);
                });
            } else {
                // Sem chamadas: retraia e não limpe o storage (evita falso positivo por oscilação)
                retrairTela();
                pacienteEl.textContent = "--";
                consultorioEl.textContent = "--";
                listaEl.innerHTML = "<li>Sem chamadas recentes</li>";
            }
        } catch (err) {
            console.error("Erro de conexão:", err);
        }
        
        // SEMPRE marca primeira verificação como false após a primeira execução
        if (primeiraVerificacao) {
            primeiraVerificacao = false;
            console.log("✔️ Primeira verificação concluída - próximas chamadas TOCARÃO SOM");
        }
    }

    function salvarVideoAtual() {
        const videoAtual = localStorage.getItem(VIDEO_STORAGE_KEY);
        if (videoAtual) {
            localStorage.setItem(VIDEO_STORAGE_KEY, videoAtual);//salva a url do video no localstorage
        }
    }

    function carregarVideoSalvo() {
        const videoSalvo = localStorage.getItem(VIDEO_STORAGE_KEY);
        if (videoSalvo) {
            criarIframe(videoSalvo); //cria iframe com a url salva
        }else {
            criarIframe("https://www.youtube.com/embed/LLpNUqHVam8")//url padrao
        }
    }

    // Inicializa (apenas se o áudio já foi inicializado)
    if (audioJaInicializado) {
        carregarVideoSalvo();
        atualizarPainel();
        setInterval(atualizarPainel, 5000);
    } else {
        console.log("⏸️ Aguardando inicialização do sistema de áudio...");
        // Quando o usuário clicar no botão, o sistema será iniciado
        btnInicializar.addEventListener("click", () => {
            setInterval(atualizarPainel, 5000);
        }, { once: true });
    }

    //salva o video atual antes de sair da pagina
    window.addEventListener("beforeunload", salvarVideoAtual);
});