document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "ultimoPacienteKey";
    const VIDEO_STORAGE_KEY = "videoatualkey"; //chave pra armazenar o video atual
    let temporizadorRetracao = null;
    let primeiraExecucao = true; // Evita tocar som/animar na primeira execução
    let ultimoPacienteExibido = localStorage.getItem(STORAGE_KEY); // Recupera o último paciente salvo

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
                const chaveAtual = `${nomePacienteAtual}||${nomeConsultorioAtual}`;

                // Atualiza UI sempre
                pacienteEl.textContent = nomePacienteAtual || "--";
                consultorioEl.textContent = nomeConsultorioAtual || "--";

               // Evita tocar som na primeira execução (ao carregar a página)
                if (ultimoPacienteExibido === null) {
                    ultimoPacienteExibido = chaveAtual;
                    localStorage.setItem(STORAGE_KEY, ultimoPacienteExibido);
                } else if (chaveAtual && chaveAtual !== ultimoPacienteExibido && !primeiraExecucao) {
                    // Toca som apenas se não for a primeira execução
                    ultimoPacienteExibido = chaveAtual;
                    localStorage.setItem(STORAGE_KEY, ultimoPacienteExibido);

                    if (alertaSom) {
                        try {
                            alertaSom.currentTime = 0;
                            await alertaSom.play();
                        } catch (e) {
                            console.warn("Não foi possível reproduzir o áudio:", e);
                        }
                    }

                    expandirTela();
                    clearTimeout(temporizadorRetracao);
                    temporizadorRetracao = setTimeout(retrairTela, 7000);
                }
                // Se mudou mas é a primeira execução, grava silenciosamente
                else if (chaveAtual && chaveAtual !== ultimoPacienteExibido && primeiraExecucao) {
                    ultimoPacienteExibido = chaveAtual;
                    localStorage.setItem(STORAGE_KEY, ultimoPacienteExibido);
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
        } finally {
            primeiraExecucao = false; // Garante que a próxima mudança será considerada "nova"
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

    // Inicializa
    carregarVideoSalvo();
    atualizarPainel();
    setInterval(atualizarPainel, 5000);

    //salva o video atual antes de sair da pagina
    window.addEventListener("beforeunload", salvarVideoAtual);
});