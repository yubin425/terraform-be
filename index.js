const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

let pool;

// DB 초기화: RDS 연결 및 테이블 생성
async function initDB() {
  pool = await mysql.createPool({
    host: "mysql-db.cviok2uyejnl.us-east-1.rds.amazonaws.com",          // 예: rds-endpoint.amazonaws.com
    port: 3306,    // 기본 MySQL 포트
    user: "nilla",            // DB 사용자 (예: admin)
    password: "nilla0425",        // DB 비밀번호
    database: "wordpress",        // 사용할 데이터베이스 이름
    connectionLimit: 10,
  });
  console.log("Connected to RDS");

  // 게임 로그를 저장할 테이블 생성
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      previous_word VARCHAR(255),
      new_word VARCHAR(255),
      result VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Table game_logs is ready");
}

// 헬스 체크 엔드포인트
app.get('/', (req, res) => {
  res.send('끝말잇기 백엔드와 RDS 연결 성공!');
});

// 게임 결과 로그 조회 (최근 로그부터)
app.get('/logs', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM game_logs ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 끝말잇기 게임 API: 결과를 DB에 저장하고 응답
app.post('/play', async (req, res) => {
  const { previousWord, newWord } = req.body;
  if (!previousWord || !newWord) {
    return res.status(400).json({ error: '이전 단어와 새로운 단어가 필요합니다.' });
  }
  const lastChar = previousWord.slice(-1);
  const firstChar = newWord[0];
  const valid = (lastChar === firstChar);
  const resultMsg = valid ? '성공: 올바른 끝말잇기!' : '실패: 끝말잇기 규칙 위반';

  try {
    // 게임 결과를 DB에 저장
    await pool.execute(
      `INSERT INTO game_logs (previous_word, new_word, result) VALUES (?, ?, ?)`,
      [previousWord, newWord, resultMsg]
    );
  } catch (err) {
    console.error("Error inserting log:", err);
  }
  
  res.json({ result: resultMsg });
});

// DB 초기화 후 서버 시작
initDB().then(() => {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}).catch(err => {
  console.error("Failed to initialize DB:", err);
  process.exit(1);
});
