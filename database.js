// ============================================================
// DATABASE — SQL Server Connection & Table Setup
// ============================================================
require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

const config = {
 connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=StudentTaskDB;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

let pool = null;

async function connect() {
  pool = await sql.connect(config);
  console.log('✅ SQL Server Connected!');
  await setupDatabase();
  return pool;
}

async function setupDatabase() {
  // Students table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Students' AND xtype='U')
    CREATE TABLE Students (
      Id        INT IDENTITY(1,1) PRIMARY KEY,
      Name      NVARCHAR(100) NOT NULL,
      Email     NVARCHAR(150) NOT NULL UNIQUE,
      Course    NVARCHAR(100) NOT NULL,
      Grade     NVARCHAR(5)   DEFAULT 'N/A',
      Status    NVARCHAR(20)  DEFAULT 'Active'
                CHECK (Status IN ('Active','Inactive','Graduated')),
      CreatedAt DATETIME      DEFAULT GETDATE()
    )
  `);

  // Tasks table (linked to students)
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tasks' AND xtype='U')
    CREATE TABLE Tasks (
      Id          INT IDENTITY(1,1) PRIMARY KEY,
      Title       NVARCHAR(200) NOT NULL,
      Description NVARCHAR(500) DEFAULT '',
      Priority    NVARCHAR(20)  DEFAULT 'Medium'
                  CHECK (Priority IN ('Low','Medium','High')),
      Completed   BIT           DEFAULT 0,
      StudentId   INT           FOREIGN KEY REFERENCES Students(Id) ON DELETE SET NULL,
      CreatedAt   DATETIME      DEFAULT GETDATE()
    )
  `);

  console.log('✅ Tables ready: Students, Tasks');
}

function getPool() { return pool; }
module.exports = { connect, getPool, sql };