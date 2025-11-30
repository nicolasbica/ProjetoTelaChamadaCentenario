let setorAtual = "ProntoSocorro"; // Define o setor padrão como Pronto Socorro

document.getElementById("slider").addEventListener("change", () => {
    const slider = document.getElementById("slider");

    if (slider.checked) {
        setorAtual = "Ambulatorio";
        document.getElementById("consultorio").disabled = false; // Habilita o campo de consultório
        document.getElementById("consultorio").placeholder = "Digite o número do consultório";
        document.getElementById("consultorio").value = ""; // Limpa o valor do campo
    } else {
        setorAtual = "ProntoSocorro";
        document.getElementById("consultorio").disabled = true; // Desabilita o campo de consultório
        document.getElementById("consultorio").placeholder = "Acolhimento";
        document.getElementById("consultorio").value = "Acolhimento"; // Define o valor como "Acolhimento"
    }
});

document.getElementById("btnChamar").addEventListener("click", async () => {
    const paciente = document.getElementById("paciente").value.trim();
    const consultorio = document.getElementById("consultorio").value.trim();

    if (!paciente || (!consultorio && setorAtual === "Ambulatorio")) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Por favor preencha todos os campos.',
            timer: 2000,
            showConfirmButton: false,
        });
        return;
    }

    const chamada = {
        paciente,
        consultorio,
        setor: setorAtual,
        hora: new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }),
    };

    try {
        const response = await fetch("http://localhost:3000/chamada", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(chamada),
        });

        if (response.ok) {
            const result = await response.json();
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: result.message,
                timer: 2000,
                showConfirmButton: false,
            });

            document.getElementById("paciente").value = "";
            if (setorAtual === "Ambulatorio") {
                document.getElementById("consultorio").value = "";
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Erro ao registrar chamada.',
                timer: 2000,
                showConfirmButton: false,
            });
        }
    } catch (error) {
        console.error("Erro ao enviar chamada:", error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro ao conectar com o servidor.',
            timer: 2000,
            showConfirmButton: false,
        });
    }
});