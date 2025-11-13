import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: `.env.development` });

// Configurazione della connessione
// console.log('Connecting to:', process.env.DB_HOST);

let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
} catch (err) {
  console.log(err);
}

// Funzione per eseguire query comodamente
export async function test(sql) {
  const connection = await pool.getConnection();
  const [rows, fields] = await connection.query(sql);
  console.log(rows);
  console.log(fields);
  connection.release();
  return rows;
}

const sql = "SELECT DATABASE();";
await test(sql);

// Funzione per ottenere una connessione dal pool
export async function getConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connessione al database stabilita');
    return connection;
  } catch (err) {
    console.error('Errore di connessione al database:', err);
    throw err;
  }
}

// Funzione per eseguire query comodamente
export async function query(sql) {
  const [rows] = await getConnection().query(sql);
  return rows;
}

export async function execute(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
