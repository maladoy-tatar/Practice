const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

let events = [];
let users = [];
const adminUser = { id: 1, email: 'admin@example.com', password: 'admin123', role: 'admin' };
users.push(adminUser);

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/api/events', (req, res) => {
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const event = req.body;
  const eventStart = new Date(event.date);
  const eventEnd = new Date(event.endDate);
  const now = new Date();
  
  if (eventStart <= now) {
    return res.status(400).json({ error: 'Дата начала мероприятия должна быть в будущем' });
  }

  if (eventEnd <= eventStart) {
    return res.status(400).json({ error: 'Время окончания должно быть после времени начала' });
  }

  const sameTimePlaceEvent = events.find(e => 
    e.location === event.location && 
    new Date(e.date).getTime() === eventStart.getTime()
  );
  if (sameTimePlaceEvent) {
    return res.status(400).json({ error: 'Мероприятие в этом месте и в это время уже существует' });
  }

  const oneHour = 60 * 60 * 1000;
  const conflictingEvent = events.find(e => {
    if (e.location !== event.location) return false;
    
    const eStart = new Date(e.date);
    const eEnd = new Date(e.endDate);
  
    return (
      (eventStart >= eStart && eventStart < eEnd) ||
      
      (eventEnd > eStart && eventEnd <= eEnd) ||
      
      (eventStart <= eStart && eventEnd >= eEnd) ||
      
      (Math.abs(eventStart - eEnd) < oneHour) ||
      (Math.abs(eStart - eventEnd) < oneHour)
    );
  });

  if (conflictingEvent) {
    return res.status(400).json({ 
      error: 'Между окончанием и началом мероприятий должен быть промежуток не менее 1 часа' 
    });
  }
  event.id = Date.now();
  event.participants = [];
  events.push(event);
  res.status(201).json(event);
});


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
  res.json({ 
    message: 'Регистрация успешна' ,
    event: {
      id: event.id,
      name: event.name,
      date: event.date,
      endDate: event.endDate,
      location: event.location,
      description: event.description || ''
    }
  });
});


app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({ 
      id: user.id,
      email: user.email,
      role: user.role 
    });
  } else {
    res.status(401).send('Неверные учетные данные');
  }
});


app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  
  if (users.some(u => u.email === email)) {
    return res.status(400).send('Пользователь уже существует');
  }
  
  const newUser = { 
    id: Date.now(), 
    email, 
    password, 
    role: 'user' 
  };
  
  users.push(newUser);
  res.status(201).json({ id: newUser.id, email: newUser.email });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});