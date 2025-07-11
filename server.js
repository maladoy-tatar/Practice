const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Временное хранилище данных
let events = [
  {
    id: 1,
    name: "Конференция по веб-разработке",
    date: "2024-06-15",
    location: "Москва, ул. Пушкина, д.10",
    capacity: 100,
    description: "Ежегодная конференция для веб-разработчиков",
    participants: []
  },
  {
    id: 2,
    name: "Воркшоп по JavaScript",
    date: "2024-07-20",
    location: "Онлайн",
    capacity: 50,
    description: "Практический воркшоп по современному JavaScript",
    participants: []
  }
];

app.use(bodyParser.json());
app.use(express.static('public'));

// API для мероприятий
app.get('/api/events', (req, res) => {
  res.json(events);
});

// API для регистрации на событие
app.post('/api/events/:id/register', (req, res) => {
  const eventId = parseInt(req.params.id);
  const { email } = req.body;
  
  const event = events.find(e => e.id === eventId);
  if (!event) return res.status(404).send('Мероприятие не найдено');

  if (event.participants.includes(email)) {
    return res.status(400).send('Вы уже зарегистрированы на это мероприятие');
  }
  
  if (event.participants.length >= event.capacity) {
    return res.status(400).send('Нет свободных мест');
  }
  
  event.participants.push(email);
  res.json({ message: 'Регистрация успешна' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});