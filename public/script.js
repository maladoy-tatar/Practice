let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  const savedUser = sessionStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateAuthUI();
  }
  
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (loginBtn) loginBtn.addEventListener('click', () => window.location.href = 'login.html');
  if (registerBtn) registerBtn.addEventListener('click', showUserRegistration);
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  
  if (document.getElementById('eventsList')) {
    loadEvents();
    
    const userRegForm = document.getElementById('userRegistrationForm');
    if (userRegForm) userRegForm.addEventListener('submit', (e) => {
      e.preventDefault();
      registerUser();
    });
    
    const eventRegForm = document.getElementById('registrationForm');
    if (eventRegForm) eventRegForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const eventId = document.getElementById('registrationSection').dataset.eventId;
      if (eventId) registerForEvent(parseInt(eventId));
    });
  }
  
  if (document.getElementById('createEventForm')) {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      dateInputs.forEach(input => {
        input.min = tomorrowStr;
      });
    }
    
    loadAdminEvents();
    
    document.getElementById('createEventForm').addEventListener('submit', (e) => {
      e.preventDefault();
      createEvent();
    });
  }
  
  if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      loginUser();
    });
  }
});

function updateAuthUI() {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const userInfo = document.getElementById('userInfo');
  const userEmailDisplay = document.getElementById('userEmailDisplay');
  
  if (currentUser) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (userEmailDisplay) userEmailDisplay.textContent = currentUser.email;
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
  }
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  updateAuthUI();
  
  if (window.location.pathname.includes('admin.html')) {
    window.location.href = 'index.html';
  } else {
    window.location.reload();
  }
}

//ФУНКЦИИ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ

async function loadEvents() {
  try {
    const response = await fetch('/api/events');
    const events = await response.json();
    
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;
    
    eventsList.innerHTML = '';
    
    events.forEach(event => {
      const startDate = new Date(event.date);
      const endDate = new Date(event.endDate);
      
      const formattedStartDate = startDate.toLocaleDateString();
      const formattedEndDate = endDate.toLocaleDateString();
      const formattedStartTime = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const formattedEndTime = endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const eventElement = document.createElement('div');
      eventElement.className = 'event-card';
      eventElement.innerHTML = `
        <h3>${event.name}</h3>
        <p><strong>Начало:</strong> ${formattedStartDate} в ${formattedStartTime}</p>
        <p><strong>Окончание:</strong> ${formattedEndDate} в ${formattedEndTime}</p>
        <p><strong>Место:</strong> ${event.location}</p>
        <p><strong>Описание:</strong> ${event.description}</p>
        <p><strong>Свободных мест:</strong> ${event.capacity - event.participants.length}</p>
        <button onclick="showRegistration(${event.id})">Записаться на мероприятие</button>
      `;
      eventsList.appendChild(eventElement);
    });
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

function showRegistration(eventId) {
  if (currentUser) {
    registerForEvent(eventId);
    return;
  }
  
  const regSection = document.getElementById('registrationSection');
  if (!regSection) return;
  
  regSection.style.display = 'block';
  regSection.dataset.eventId = eventId;
  
  window.scrollTo({
    top: regSection.offsetTop,
    behavior: 'smooth'
  });
}

async function registerForEvent(eventId) {
  let email = '';
  
  if (currentUser) {
    email = currentUser.email;
  } else {
    email = document.getElementById('regEmail').value;
  }
  
  if (!email) {
    alert('Пожалуйста, введите email');
    return;
  }
  
  try {
    const response = await fetch(`/api/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (response.ok) {
      const result = await response.json();

      try {
        const eventDetails = result.event;
        const eventStartDate = new Date(eventDetails.date);
        const formattedStartDate = eventStartDate.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const eventEndDate = new Date(eventDetails.endDate);
        const formattedEndDate = eventEndDate.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        await emailjs.send(
          'service_tapl1t8',
          'template_cvlqxhs',  
          {
            to_email: email,
            event_name: eventDetails.name,
            event_start_date: formattedStartDate,
            event_end_date: formattedEndDate,
            event_location: eventDetails.location,
            event_description: eventDetails.description
          });
        alert(`Вы успешно записаны на мероприятие "${eventDetails.name}"!\nПисьмо с подтверждением отправлено на ${email}`);
      } catch(emailError){
        console.error('Ошибка отправки письма:', emailError);
        alert(`Вы записаны на мероприятие, но не получили письмо: ${emailError.text}`)
      }
      
      const regSection = document.getElementById('registrationSection');
      if (regSection) regSection.style.display = 'none';
      
      loadEvents();
    } else {
      const error = await response.text();
      alert(`Ошибка: ${error}`);
    }
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    alert('Ошибка сети. Попробуйте позже.');
  }
}


function showUserRegistration() {
  const userRegSection = document.getElementById('userRegistrationSection');
  if (userRegSection) {
    userRegSection.style.display = 'block';
    window.scrollTo({
      top: userRegSection.offsetTop,
      behavior: 'smooth'
    });
  }
}

async function registerUser() {
  const email = document.getElementById('userEmail').value;
  const password = document.getElementById('userPassword').value;
  
  if (!email || !password) {
    alert('Пожалуйста, заполните все поля');
    return;
  }
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      alert('Регистрация успешна! Теперь вы можете войти в систему.');
      document.getElementById('userRegistrationSection').style.display = 'none';
      document.getElementById('userEmail').value = '';
      document.getElementById('userPassword').value = '';
    } else {
      const error = await response.text();
      alert(`Ошибка: ${error}`);
    }
  } catch (error) {
    console.error('Ощибка регистрации:', error);
    alert('Ошибка сети. Попробуйте позже.');
  }
}


async function loginUser() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    alert('Пожалуйста, заполните все поля');
    return;
  }
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const user = await response.json();
      
      currentUser = user;
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    } else {
      const error = await response.text();
      alert(`Ошибка входа: ${error}`);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Ошибка сети. Попробуйте позже.');
  }
}

//ФУНКЦИИ ДЛЯ АДМИНИСТРАТОРА 

async function createEvent() {
  const startDate = document.getElementById('eventDate').value;
  const startTime = document.getElementById('eventTime').value;
  const endDate = document.getElementById('eventEndDate').value;
  const endTime = document.getElementById('eventEndTime').value;
  
  const startDateTime = `${startDate}T${startTime}:00`;
  const endDateTime = `${endDate}T${endTime}:00`;
  
  const eventData = {
    name: document.getElementById('eventName').value,
    date: startDateTime,
    endDate: endDateTime,
    location: document.getElementById('eventLocation').value,
    capacity: parseInt(document.getElementById('eventCapacity').value),
    description: document.getElementById('eventDescription').value
  };
  

  if (!eventData.name || !startDate || !startTime || !endDate || !endTime || !eventData.location || !eventData.capacity) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }
  
  if (new Date(endDateTime) <= new Date(startDateTime)) {
    alert('Время окончания должно быть после времени начала');
    return;
  }
  
  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    
    if (response.ok) {
      alert('Мероприятие создано!');
      document.getElementById('createEventForm').reset();
      loadAdminEvents();
    } else {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.error;
      } catch (e) {
        errorText = await response.text();
      }
      alert(`Ошибка: ${errorText}`);
    }
  } catch (error) {
    console.error('Event creation error:', error);
    alert('Ошибка сети. Попробуйте позже.');
  }
}

async function loadAdminEvents() {
  try {
    const response = await fetch('/api/events');
    const events = await response.json();
    
    const eventsList = document.getElementById('adminEventsList');
    if (!eventsList) return;
    
    eventsList.innerHTML = '';
    
    events.forEach(event => {
      const startDate = new Date(event.date);
      const endDate = new Date(event.endDate);
      
      const formattedStartDate = startDate.toLocaleDateString();
      const formattedEndDate = endDate.toLocaleDateString();
      const formattedStartTime = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const formattedEndTime = endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const eventElement = document.createElement('div');
      eventElement.className = 'event-card';
      eventElement.innerHTML = `
        <h3>${event.name}</h3>
        <p><strong>Начало:</strong> ${formattedStartDate} в ${formattedStartTime}</p>
        <p><strong>Окончание:</strong>${formattedEndDate} в ${formattedEndTime}</p>
        <p><strong>Место:</strong> ${event.location}</p>
        <p><strong>Участники:</strong> ${event.participants.length}/${event.capacity}</p>
        <button onclick="viewParticipants(${event.id})">Показать участников</button>
      `;
      eventsList.appendChild(eventElement);
    });
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

async function viewParticipants(eventId) {
  try {
    const response = await fetch('/api/events');
    const events = await response.json();
    const event = events.find(e => e.id === eventId);
    
    if (event) {
      const participants = event.participants.length > 0 
        ? event.participants.join('\n') 
        : 'Участников пока нет';
      alert(`Участники мероприятия "${event.name}":\n\n${participants}`);
    } else {
      alert('Мероприятие не найдено');
    }
  } catch (error) {
    console.error('Error loading participants:', error);
    alert('Ошибка загрузки участников');
  }
}