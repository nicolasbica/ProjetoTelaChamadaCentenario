const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hospital.db');

console.log('🧹 Iniciando limpeza de chamadas antigas...');

db.run(
    `UPDATE chamados SET exibida = 1 
     WHERE data_criacao IS NULL 
        OR datetime(data_criacao) < datetime('now', '-1 hour')`,
    function(err) {
        if (err) {
            console.error('❌ Erro:', err.message);
        } else {
            console.log(`✅ ${this.changes} chamadas antigas marcadas como exibidas`);
        }
        db.close();
    }
);
