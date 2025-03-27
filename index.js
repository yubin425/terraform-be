const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());


// 간단한 GET 엔드포인트 (헬스 체크)
app.get('/', (req, res) => {
  res.send('끝말잇기 백엔드입니다!');
});

// 간단한 끝말잇기 게임 API
app.post('/play', (req, res) => {
  const { previousWord, newWord } = req.body;
  if (!previousWord || !newWord) {
    return res.status(400).json({ error: '이전 단어와 새로운 단어가 필요합니다.' });
  }
  const lastChar = previousWord.slice(-1);
  const firstChar = newWord[0];
  if (lastChar === firstChar) {
    return res.json({ result: '성공: 올바른 끝말잇기!' });
  }
  return res.json({ result: '실패: 끝말잇기 규칙 위반' });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
