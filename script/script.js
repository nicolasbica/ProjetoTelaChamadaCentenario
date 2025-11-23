document.addEventListener("DOMContentLoaded", () => {
    let pacienteAnterior = null; // Inicializa com null para evitar som ao recarregar

    async function atualizarPainel() {
        try {
            const response = await fetch("http://localhost:3000/chamadas");
            if (response.ok) {
                const chamadas = await response.json();

                const pacienteAtual = document.getElementById("pacienteAtual");
                const consultorioAtual = document.getElementById("consultorioAtual");
                const listaUltimas = document.getElementById("listaUltimas");
                const alertaSom = document.getElementById("alertaSom");

                // Verifica se os elementos existem antes de manipulá-los
                if (!pacienteAtual || !consultorioAtual || !listaUltimas || !alertaSom) {
                    console.error("Erro: Elementos do DOM não encontrados.");
                    return;
                }

                if (chamadas.length > 0) {
                    const chamadaAtual = chamadas[0];

                    // Toca som apenas se o paciente for diferente do anterior e válido
                    if (pacienteAnterior !== chamadaAtual.paciente && chamadaAtual.paciente) {
                        alertaSom.play().catch((error) => {
                            console.error("Erro ao reproduzir som:", error);
                        });
                    }

                    // Atualiza o paciente anterior
                    pacienteAnterior = chamadaAtual.paciente;

                    // Atualiza os dados no painel
                    pacienteAtual.textContent = chamadaAtual.paciente || "--";
                    consultorioAtual.textContent = chamadaAtual.consultorio || "--";

                    // Atualiza o histórico de chamadas
                    listaUltimas.innerHTML = "";
                    chamadas.slice(1, 6).forEach((chamada) => {
                        const li = document.createElement("li");
                        li.textContent = `${chamada.consultorio} - ${chamada.paciente}`;
                        listaUltimas.appendChild(li);
                    });
                } else {
                    // Caso não haja chamadas
                    pacienteAtual.textContent = "--";
                    consultorioAtual.textContent = "--";
                    listaUltimas.innerHTML = "<li>Sem chamadas recentes</li>";
                }
            } else {
                console.error("Erro ao buscar chamadas.");
            }
        } catch (error) {
            console.error("Erro ao conectar ao servidor:", error);
        }
    }

    // Atualiza o painel a cada 5 segundos
    setInterval(atualizarPainel, 5000);

    // Atualiza o painel ao carregar a página
    atualizarPainel();
});