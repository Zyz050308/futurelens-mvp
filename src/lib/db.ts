import mysql, { type Pool } from 'mysql2/promise';

let pool: Pool | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDbPool(): Pool {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: requireEnv('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT || '3306'),
    user: requireEnv('MYSQL_USER'),
    password: requireEnv('MYSQL_PASSWORD'),
    database: requireEnv('MYSQL_DATABASE'),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || '10'),
    queueLimit: 0,
    charset: 'utf8mb4',
  });

  return pool;
}

export async function queryRows<T>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = getDbPool();
  const [rows] = await db.query(sql, params);
  return rows as T[];
}

export async function execute(sql: string, params: any[] = []) {
  const db = getDbPool();
  return db.execute(sql, params);
}
