const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(cors());

// Banco de dados SQLite
const db = new sqlite3.Database('./hospital.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

//criação das tabelas se não existirem
db.run(
    `CREATE TABLE IF NOT EXISTS chamados(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente TEXT NOT NULL,
        consultorio TEXT NOT NULL,
        hora TEXT NOT NULL
    )`
);

//rotas para receber chamadas
app.post("/chamada", (req, res) => {
    const { paciente, consultorio, hora } = req.body;

    if (!paciente || !consultorio || !hora) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    const query = `INSERT INTO chamados (paciente, consultorio, hora) VALUES (?, ?, ?)`;
    db.run(query, [paciente, consultorio, hora], function(err) {
        if (err) {
            console.error("Erro ao inserir chamada:", err.message);
            return res.status(500).json({ error: "Erro ao registrar a chamada." });
        }

        res.status(201).json({ message: "Chamada registrada com sucesso."});
    });
});

// iniciar o servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//rota pra buscar as chamadas
app.get("/chamadas", (req, res) => {
    const query = "SELECT * FROM chamados ORDER BY id DESC";
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar chamadas:", err.message);
            return res.status(500).json({ error: "Erro ao buscar chamadas." });
        }
        res.json(rows);
    });
});