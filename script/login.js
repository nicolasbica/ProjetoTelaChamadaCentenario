// Sistema de login isolado - Não interfere com outros scripts
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const btnLogin = document.getElementById("btnLogin");

    // Verifica se já está autenticado
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (isAuthenticated === "true") {
        window.location.href = "painel-admin.html";
    }

    // Função de login
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Atenção',
                text: 'Por favor, preencha todos os campos.',
                confirmButtonColor: '#007bff',
            });
            return;
        }

        // Desabilita o botão durante a requisição
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Armazena autenticação e informações do médico na sessão
                sessionStorage.setItem("adminAuthenticated", "true");
                sessionStorage.setItem("adminUsername", username);
                sessionStorage.setItem("userSetor", result.setor);

                Swal.fire({
                    icon: 'success',
                    title: 'Bem-vindo!',
                    text: 'Login realizado com sucesso.',
                    timer: 1500,
                    showConfirmButton: false,
                });

                // Redireciona após 1.5 segundos
                setTimeout(() => {
                    window.location.href = "painel-admin.html";
                }, 1500);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro de Autenticação',
                    text: result.message || 'Usuário ou senha incorretos.',
                    confirmButtonColor: '#007bff',
                });

                // Reabilita o botão
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
            }
        } catch (error) {
            console.error("Erro ao conectar com o servidor:", error);
            Swal.fire({
                icon: 'error',
                title: 'Erro de Conexão',
                text: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
                confirmButtonColor: '#007bff',
            });

            // Reabilita o botão
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    });

    // Adiciona funcionalidade Enter nos inputs
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                loginForm.dispatchEvent(new Event("submit"));
            }
        });
    });
});
