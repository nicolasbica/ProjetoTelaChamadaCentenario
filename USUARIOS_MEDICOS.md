# 👨‍⚕️ Usuários Médicos - Hospital Centenário

## 🔐 Credenciais de Acesso

### 🚑 Pronto Socorro
| Usuário | Senha | Setor |
|---------|-------|-------|
| ps01 | cpd@2008 | Pronto Socorro |

**Comportamento:**
- Campo "Consultório" bloqueado automaticamente
- Valor fixo: "Acolhimento"
- Slider começa na posição "Pronto Socorro"

---

### 🏥 Ambulatório
| Usuário | Senha | Setor |
|---------|-------|-------|
| ambu01 | cpd@2008 | Ambulatório |
| ambu02 | cpd@2008 | Ambulatório |
| ambu03 | cpd@2008 | Ambulatório |
| ambu04 | cpd@2008 | Ambulatório |
| ambu05 | cpd@2008 | Ambulatório |

**Comportamento:**
- Campo "Consultório" habilitado automaticamente
- Médico digita o número do consultório
- Slider começa na posição "Ambulatório"

---

## 🎯 Recursos Implementados

### 1. **Login Automático por Setor**
- Sistema detecta automaticamente o setor do médico
- Configura o painel conforme o setor (Pronto Socorro ou Ambulatório)
- Não é necessário ajustar o slider manualmente

### 2. **Sessão Individual**
- Cada médico tem sua própria sessão
- Logout não afeta outros médicos logados em outros computadores
- Usa `sessionStorage` (não persiste entre abas)

### 3. **Segurança**
- Painel administrativo protegido por login
- Redirecionamento automático se não autenticado
- Botão de logout seguro com confirmação

---

## 🔧 Modificar Usuários

Para adicionar/remover usuários, edite o arquivo:
**`server/server.js`**

```javascript
const USUARIOS_MEDICOS = [
    { username: "ps01", password: "cpd@2008", setor: "ProntoSocorro" },
    { username: "ambu01", password: "cpd@2008", setor: "Ambulatorio" },
    // ... adicione mais usuários aqui
];
```

**Campos:**
- `username`: Login do médico
- `password`: Senha de acesso
- `setor`: "ProntoSocorro" ou "Ambulatorio"

---

## 📱 Como os Médicos Usam

1. **Acesso:** `http://localhost:3000/painel-centenario/login.html`
2. **Login:** Digite usuário e senha
3. **Painel:** Sistema abre configurado para o setor correto
4. **Chamar Paciente:** 
   - Digite nome do paciente
   - Digite consultório (se Ambulatório)
   - Clique em "Chamar Paciente"
5. **Sair:** Clique no botão "Sair" no canto superior direito

---

## 🚀 Testando

```bash
# 1. Inicie o servidor
cd server
node server.js

# 2. Abra o navegador
# http://localhost:3000/painel-centenario/login.html

# 3. Teste com diferentes usuários:
# - ps01 (Pronto Socorro)
# - ambu01 (Ambulatório)
```

---

## 📝 Observações

- Todos os médicos compartilham a mesma senha: **cpd@2008**
- Em produção, considere senhas individuais
- Para uso na VM, trocar `localhost:3000` pelo IP da máquina virtual
- Sistema continua funcionando sem afetar o painel de exibição (painel.html)

---

**Desenvolvido por:** Nicolas Bica  
**Ano:** 2025
