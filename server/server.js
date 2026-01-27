const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Credenciais dos médicos
const USUARIOS_MEDICOS = [
    { username: "ps01", password: "cpd@2008", setor: "pronto-socorro" },
    { username: "ambu01", password: "cpd@2008", setor: "ambulatorio" },
    { username: "ambu02", password: "cpd@2008", setor: "ambulatorio" },
    { username: "ambu03", password: "cpd@2008", setor: "ambulatorio" },
    { username: "ambu04", password: "cpd@2008", setor: "ambulatorio" },
    { username: "ambu05", password: "cpd@2008", setor: "ambulatorio" }
];

// Middleware
app.use(express.json({ limit: '1mb' })); // Limita tamanho do payload
app.use(cors());

// Servir arquivos estáticos da pasta raiz do projeto
app.use(express.static(path.join(__dirname, '..')));

// Banco de dados SQLite
const db = new sqlite3.Database('./hospital.db', (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite.');
        inicializarBanco();
    }
});

// Função para inicializar/atualizar estrutura do banco
function inicializarBanco() {
    console.log('🔧 Verificando estrutura do banco...');
    
    // Criar tabela principal com todas as colunas necessárias
    db.run(`CREATE TABLE IF NOT EXISTS chamados(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente TEXT NOT NULL,
        consultorio TEXT NOT NULL,
        setor TEXT NOT NULL DEFAULT 'ambulatorio',
        hora TEXT NOT NULL,
        exibida INTEGER DEFAULT 0,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela:', err.message);
            return;
        }
        
        console.log('✅ Tabela verificada');
        
        // Verificar e adicionar colunas se necessário
        db.all("PRAGMA table_info(chamados)", [], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao verificar colunas:', err.message);
                return;
            }
            
            const colunas = rows.map(r => r.name);
            let pendentes = 0;
            
            // Função para finalizar após todas as alterações
            const finalizarMigracao = () => {
                if (pendentes === 0) {
                    // Criar índice apenas após todas as colunas estarem prontas
                    db.run('CREATE INDEX IF NOT EXISTS idx_exibida_setor ON chamados(exibida, setor, id)', (err) => {
                        if (err) console.error('❌ Erro ao criar índice:', err.message);
                        else console.log('✅ Índice criado/verificado');
                        console.log('🎉 Estrutura do banco atualizada com sucesso!');
                    });
                }
            };
            
            // Adicionar coluna 'setor' se não existir
            if (!colunas.includes('setor')) {
                pendentes++;
                console.log('➕ Adicionando coluna "setor"...');
                db.run('ALTER TABLE chamados ADD COLUMN setor TEXT NOT NULL DEFAULT "ambulatorio"', (err) => {
                    if (err) console.error('❌ Erro ao adicionar coluna setor:', err.message);
                    else console.log('✅ Coluna "setor" adicionada');
                    pendentes--;
                    finalizarMigracao();
                });
            }
            
            // Adicionar coluna 'exibida' se não existir
            if (!colunas.includes('exibida')) {
                pendentes++;
                console.log('➕ Adicionando coluna "exibida"...');
                db.run('ALTER TABLE chamados ADD COLUMN exibida INTEGER DEFAULT 0', (err) => {
                    if (err) console.error('❌ Erro ao adicionar coluna exibida:', err.message);
                    else console.log('✅ Coluna "exibida" adicionada');
                    pendentes--;
                    finalizarMigracao();
                });
            }
            
            // Adicionar coluna 'data_criacao' se não existir
            if (!colunas.includes('data_criacao')) {
                pendentes++;
                console.log('➕ Adicionando coluna "data_criacao"...');
                db.run('ALTER TABLE chamados ADD COLUMN data_criacao TEXT', (err) => {
                    if (err) {
                        console.error('❌ Erro ao adicionar coluna data_criacao:', err.message);
                    } else {
                        console.log('✅ Coluna "data_criacao" adicionada');
                        // Marcar TODAS as chamadas antigas como exibidas para evitar tocar chamadas antigas
                        db.run("UPDATE chamados SET exibida = 1 WHERE data_criacao IS NULL", (updateErr) => {
                            if (updateErr) {
                                console.warn('⚠️ Erro ao marcar chamadas antigas:', updateErr.message);
                            } else {
                                console.log('🧹 Chamadas antigas marcadas como exibidas');
                            }
                        });
                    }
                    pendentes--;
                    finalizarMigracao();
                });
            }
            
            // Se não há colunas pendentes, finalizar imediatamente
            if (pendentes === 0) {
                finalizarMigracao();
            }
        });
    });
}

// Rota de login
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Validação de entrada
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ 
            success: false, 
            message: "Usuário e senha são obrigatórios e devem ser texto." 
        });
    }

    // Limita tamanho para prevenir ataques
    if (username.length > 50 || password.length > 50) {
        return res.status(400).json({ 
            success: false, 
            message: "Credenciais inválidas." 
        });
    }

    // Busca o usuário no array
    const usuario = USUARIOS_MEDICOS.find(
        u => u.username === username && u.password === password
    );

    if (usuario) {
        console.log(`✅ Login bem-sucedido: ${username} (${usuario.setor})`);
        return res.status(200).json({ 
            success: true, 
            message: "Login realizado com sucesso.",
            setor: usuario.setor,
            username: usuario.username
        });
    } else {
        console.log(`❌ Tentativa de login falhou: ${username}`);
        return res.status(401).json({ 
            success: false, 
            message: "Usuário ou senha incorretos." 
        });
    }
});

// Rota para receber chamadas (com setor e validação)
app.post("/chamada", (req, res) => {
    const { paciente, consultorio, setor } = req.body;

    // Validação robusta
    if (!paciente || !consultorio || !setor) {
        return res.status(400).json({ 
            success: false,
            error: "Todos os campos são obrigatórios (paciente, consultorio, setor)." 
        });
    }

    // Validação de tipos
    if (typeof paciente !== 'string' || typeof consultorio !== 'string' || typeof setor !== 'string') {
        return res.status(400).json({ 
            success: false,
            error: "Todos os campos devem ser texto." 
        });
    }

    // Validação de tamanho (previne SQL injection e overflow)
    if (paciente.length > 200 || consultorio.length > 100 || setor.length > 50) {
        return res.status(400).json({ 
            success: false,
            error: "Dados excedem tamanho máximo permitido." 
        });
    }

    // Validação do setor
    const setoresValidos = ['pronto-socorro', 'ambulatorio'];
    if (!setoresValidos.includes(setor)) {
        return res.status(400).json({ 
            success: false,
            error: "Setor inválido. Use 'pronto-socorro' ou 'ambulatorio'." 
        });
    }
    
    // Gerar hora no servidor com timezone do Brasil
    const agora = new Date();
    const hora = agora.toLocaleTimeString("pt-BR", { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
    });

    const query = `INSERT INTO chamados (paciente, consultorio, hora, setor, exibida, data_criacao) VALUES (?, ?, ?, ?, 0, datetime('now'))`;
    
    db.run(query, [paciente.trim(), consultorio.trim(), hora, setor], function(err) {
        if (err) {
            console.error("❌ Erro ao inserir chamada:", err.message);
            return res.status(500).json({ 
                success: false,
                error: "Erro ao registrar a chamada." 
            });
        }

        console.log(`🔔 Nova chamada registrada: ID ${this.lastID} - ${paciente} - ${consultorio} (${setor})`);
        
        res.status(201).json({ 
            success: true,
            message: "Chamada registrada com sucesso.",
            id: this.lastID
        });
    });
});

// Rota para inicializar painel (marca chamadas antigas como exibidas)
app.post("/chamadas/inicializar/:setor", (req, res) => {
    const setor = req.params.setor;
    
    // Validação do setor
    const setoresValidos = ['pronto-socorro', 'ambulatorio'];
    if (!setoresValidos.includes(setor)) {
        return res.status(400).json({ error: "Setor inválido." });
    }

    // Marcar todas as chamadas não exibidas como exibidas (limpeza inicial)
    const query = 'UPDATE chamados SET exibida = 1 WHERE exibida = 0 AND setor = ?';
    
    db.run(query, [setor], function(err) {
        if (err) {
            console.error("❌ Erro ao inicializar painel:", err.message);
            return res.status(500).json({ error: "Erro ao inicializar painel." });
        }
        
        console.log(`🧹 Painel inicializado para ${setor}: ${this.changes} chamadas antigas limpas`);
        res.json({ success: true, chamadas_limpas: this.changes });
    });
});

// Rota para buscar próxima chamada NÃO EXIBIDA por setor (sistema de fila)
app.get("/chamadas/proxima/:setor", (req, res) => {
    const setor = req.params.setor;
    
    // Validação do setor
    const setoresValidos = ['pronto-socorro', 'ambulatorio'];
    if (!setoresValidos.includes(setor)) {
        return res.status(400).json({ error: "Setor inválido." });
    }

    // Buscar apenas chamadas recentes (últimos 5 minutos) para evitar tocar chamadas antigas
    const query = `
        SELECT * FROM chamados 
        WHERE exibida = 0 
          AND setor = ?
          AND data_criacao IS NOT NULL
          AND datetime(data_criacao) >= datetime('now', '-5 minutes')
        ORDER BY id ASC 
        LIMIT 1
    `;
    
    db.get(query, [setor], (err, row) => {
        if (err) {
            console.error("❌ Erro ao buscar próxima chamada:", err.message);
            return res.status(500).json({ error: "Erro ao buscar chamadas." });
        }
        
        // Log para debug
        if (row) {
            console.log(`📋 Chamada encontrada: ID ${row.id} - ${row.paciente} - ${row.consultorio} - Data: ${row.data_criacao || 'NULL'}`);
        }
        
        // Retorna null se não houver chamadas pendentes
        res.json(row || null);
    });
});

// Rota para marcar chamada como exibida
app.post("/chamadas/marcar-exibida/:id", (req, res) => {
    const id = parseInt(req.params.id);
    
    // Validação do ID
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ 
            success: false,
            error: "ID inválido." 
        });
    }

    const query = 'UPDATE chamados SET exibida = 1 WHERE id = ?';
    
    db.run(query, [id], function(err) {
        if (err) {
            console.error("❌ Erro ao marcar chamada como exibida:", err.message);
            return res.status(500).json({ 
                success: false,
                error: "Erro no servidor." 
            });
        }
        
        if (this.changes > 0) {
            console.log(`✅ Chamada ${id} marcada como exibida`);
        }
        
        res.json({ success: true, changes: this.changes });
    });
});

// Rota para buscar últimas chamadas por setor (histórico)
app.get("/chamadas/historico/:setor", (req, res) => {
    const setor = req.params.setor;
    
    // Validação do setor
    const setoresValidos = ['pronto-socorro', 'ambulatorio'];
    if (!setoresValidos.includes(setor)) {
        return res.status(400).json({ error: "Setor inválido." });
    }

    const query = `
        SELECT * FROM chamados 
        WHERE setor = ? AND exibida = 1
        ORDER BY id DESC 
        LIMIT 10
    `;
    
    db.all(query, [setor], (err, rows) => {
        if (err) {
            console.error("❌ Erro ao buscar histórico:", err.message);
            return res.status(500).json({ error: "Erro ao buscar histórico." });
        }
        res.json(rows || []);
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Sistema de Fila: ATIVO`);
    console.log(`👥 ${USUARIOS_MEDICOS.length} médicos cadastrados`);
});

// Rota legacy para compatibilidade (ainda usada pelo painel antigo)
app.get("/chamadas", (req, res) => {
    const query = "SELECT * FROM chamados ORDER BY id DESC LIMIT 10";
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("❌ Erro ao buscar chamadas:", err.message);
            return res.status(500).json({ error: "Erro ao buscar chamadas." });
        }
        res.json(rows || []);
    });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err);
    res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor' 
    });
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Rota não encontrada' 
    });
});