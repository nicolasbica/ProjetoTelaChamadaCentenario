// ========== PROTEÇÃO DE AUTENTICAÇÃO ==========
// Verifica autenticação ANTES de carregar qualquer funcionalidade
(function checkAuth() {
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (isAuthenticated !== "true") {
        window.location.href = "login.html";
        return;
    }
    console.log('✅ Autenticação verificada com sucesso');
})();

// ========== SISTEMA DE LOGOUT ==========
document.addEventListener("DOMContentLoaded", () => {
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            if (confirm('Tem certeza que deseja sair?')) {
                sessionStorage.clear();
                window.location.href = "login.html";
            }
        });
    }
});

// ========== CÓDIGO ORIGINAL DO PAINEL ==========
// Define o setor baseado no usuário logado
const userSetor = sessionStorage.getItem("userSetor") || "ambulatorio";
let setorAtual = userSetor === "ProntoSocorro" ? "pronto-socorro" : "ambulatorio";

console.log(`🏥 Médico logado no setor: ${setorAtual}`);

// Configura o slider baseado no setor do usuário
document.addEventListener("DOMContentLoaded", () => {
    const slider = document.getElementById("slider");
    const consultorioInput = document.getElementById("consultorio");
    const pacienteInput = document.getElementById("paciente");
    
    if (!slider || !consultorioInput) {
        console.error('❌ Elementos do formulário não encontrados');
        return;
    }
    
    // Prevenir submit com Enter
    const preventSubmit = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('btnChamar').click();
        }
    };
    
    if (pacienteInput) {
        pacienteInput.addEventListener('keypress', preventSubmit);
    }
    if (consultorioInput) {
        consultorioInput.addEventListener('keypress', preventSubmit);
    }
    
    if (setorAtual === "ambulatorio") {
        slider.checked = true;
        consultorioInput.disabled = false;
        consultorioInput.placeholder = "Digite o número do consultório";
        consultorioInput.value = "";
    } else {
        slider.checked = false;
        consultorioInput.disabled = true;
        consultorioInput.placeholder = "Acolhimento";
        consultorioInput.value = "Acolhimento";
    }
    
    console.log('✅ Interface configurada para:', setorAtual);
});

document.getElementById("slider").addEventListener("change", (e) => {
    const slider = document.getElementById("slider");
    const consultorioInput = document.getElementById("consultorio");
    
    // Prevenir mudança não intencional
    if (!e.isTrusted) {
        console.log('⚠️ Mudança programática do slider ignorada');
        return;
    }

    if (slider.checked) {
        setorAtual = "ambulatorio";
        consultorioInput.disabled = false;
        consultorioInput.placeholder = "Digite o número do consultório";
        if (consultorioInput.value === "Acolhimento") {
            consultorioInput.value = "";
        }
    } else {
        setorAtual = "pronto-socorro";
        consultorioInput.disabled = true;
        consultorioInput.placeholder = "Acolhimento";
        consultorioInput.value = "Acolhimento";
    }
    
    console.log('🔄 Setor alterado manualmente para:', setorAtual);
});

document.getElementById("btnChamar").addEventListener("click", async (e) => {
    console.log('🔵 Botão "Chamar" clicado!');
    console.log('🔍 Tipo do evento:', e.type);
    console.log('🔍 Target:', e.target);
    console.log('🔍 CurrentTarget:', e.currentTarget);
    
    // Prevenir qualquer comportamento padrão
    e.preventDefault();
    e.stopPropagation();
    
    console.log('✋ PreventDefault e StopPropagation aplicados');
    
    // Obter valores dos inputs
    const paciente = document.getElementById("paciente").value.trim();
    const consultorio = document.getElementById("consultorio").value.trim();
    
    console.log('📝 Valores capturados:', { paciente, consultorio, setor: setorAtual });
    
    // Validação de campos
    if (!paciente) {
        Toastify({
            text: "❌ Por favor, digite o nome do paciente.",
            duration: 2000,
            gravity: "top",
            position: "center",
            style: {
                background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                fontSize: "1.1em",
                padding: "15px 25px",
                borderRadius: "10px",
                fontWeight: "bold"
            }
        }).showToast();
        return;
    }
    
    if (!consultorio && setorAtual === "ambulatorio") {
        Toastify({
            text: "❌ Por favor, digite o número do consultório.",
            duration: 2000,
            gravity: "top",
            position: "center",
            style: {
                background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                fontSize: "1.1em",
                padding: "15px 25px",
                borderRadius: "10px",
                fontWeight: "bold"
            }
        }).showToast();
        return;
    }

    // Validação de tamanho
    if (paciente.length > 200) {
        Toastify({
            text: "❌ Nome do paciente muito longo (máximo 200 caracteres).",
            duration: 2500,
            gravity: "top",
            position: "center",
            style: {
                background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                fontSize: "1.1em",
                padding: "15px 25px",
                borderRadius: "10px",
                fontWeight: "bold"
            }
        }).showToast();
        return;
    }
    
    if (consultorio.length > 100) {
        Toastify({
            text: "❌ Consultório muito longo (máximo 100 caracteres).",
            duration: 2500,
            gravity: "top",
            position: "center",
            style: {
                background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                fontSize: "1.1em",
                padding: "15px 25px",
                borderRadius: "10px",
                fontWeight: "bold"
            }
        }).showToast();
        return;
    }

    const chamada = {
        paciente,
        consultorio,
        setor: setorAtual
    };
    
    console.log('📤 Enviando chamada:', chamada);

    try {
        const response = await fetch("/chamada", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(chamada),
        });

        if (response.ok) {
            const result = await response.json();
            
            const setorNome = setorAtual === "pronto-socorro" ? "Pronto Socorro" : "Ambulatório";
            
            console.log('✅ Chamada registrada com sucesso! ID:', result.id);
            
            // Mostrar notificação de sucesso
            Toastify({
                text: `✅ Chamada Registrada!\n\n👤 ${paciente}\n🚪 ${consultorio}\n🏥 ${setorNome}`,
                duration: 6000,
                gravity: "top",
                position: "center",
                style: {
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    fontSize: "1.3em",
                    padding: "25px 35px",
                    borderRadius: "15px",
                    fontWeight: "bold",
                    textAlign: "center",
                    whiteSpace: "pre-line",
                    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)"
                }
            }).showToast();

            // Limpar campo após 6 segundos
            setTimeout(() => {
                console.log('🧹 Limpando campo de paciente...');
                const pacienteInput = document.getElementById("paciente");
                if (pacienteInput) {
                    pacienteInput.value = "";
                    pacienteInput.focus();
                    console.log('✨ Campo limpo e focado');
                }
            }, 6000);
        } else {
            const error = await response.json();
            Toastify({
                text: `❌ Erro ao Registrar\n${error.error || 'Erro ao registrar chamada.'}`,
                duration: 3000,
                gravity: "top",
                position: "center",
                style: {
                    background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                    fontSize: "1.2em",
                    padding: "20px 30px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    whiteSpace: "pre-line"
                }
            }).showToast();
            console.error('❌ Erro do servidor:', error);
        }
    } catch (error) {
        console.error("❌ Erro ao enviar chamada:", error);
        Toastify({
            text: "❌ Erro de Conexão\nNão foi possível conectar com o servidor.",
            duration: 3000,
            gravity: "top",
            position: "center",
            style: {
                background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                fontSize: "1.2em",
                padding: "20px 30px",
                borderRadius: "12px",
                fontWeight: "bold",
                whiteSpace: "pre-line"
            }
        }).showToast();
    }
});