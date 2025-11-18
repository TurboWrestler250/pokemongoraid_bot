import mysql from 'mysql2/promise';
import { Sequelize } from '@sequelize/core';
import { MySqlDialect } from '@sequelize/mysql';

// import dotenv from 'dotenv';
// const cfg = dotenv.config({ path: `.env.development` });
// console.log("INFO del processo ", cfg);

// Configurazione della connessione
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
  console.log("dentro la funzione query");
  const connection = await pool.getConnection();
  const [rows, fields] = await connection.query(sql);
  console.log(rows);
  console.log(fields);
  console.log("dentro la funzione query parte 2");
  return rows;
}

export async function execute(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ------------------------------------------------------------
// class User extends Model {
//   @Attribute(DataTypes.STRING)
//   username;

//   @Attribute(DataTypes.DATE)
//   birthday;
// }

const sequelize = new Sequelize({
  dialect: MySqlDialect,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
});
  
try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export default sequelize;