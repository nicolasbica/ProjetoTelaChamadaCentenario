// Função pra buscar os dados do servidor
async function atualizarPainel() {
  try {
    const response = await fetch("http://192.168.1.3:3000/chamadas");
    if (response.ok) {
      const chamadas = await response.json();

      // Atualiza o painel com os dados recebidos
      const painel = document.getElementById("painel");
      painel.innerHTML = "";

      chamadas.forEach((chamada) => {
        const item = document.createElement("div");
        item.className = "chamada";
        item.innerHTML = `
          <strong>Paciente:</strong> ${chamada.paciente}<br>
          <strong>Consultório:</strong> ${chamada.consultorio}<br>
          <strong>Hora:</strong> ${chamada.hora}
        `;
        painel.appendChild(item);
      });
    } else {
      console.error("Erro ao buscar chamadas.");
    }
  } catch (error) {
    console.error("Erro ao conectar ao servidor:", error);
  }
}

// Atualiza o painel a cada 5 segundos
setInterval(atualizarPainel, 5000);