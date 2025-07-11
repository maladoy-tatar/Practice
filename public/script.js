document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
});

// Загрузка мероприятий
async function loadEvents() {
  try {
    const response = await fetch('/api/events');
    const events = await response.json();
    
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;
    
    eventsList.innerHTML = '';
    
    events.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'event-card';
      eventElement.innerHTML = `
        <h3>${event.name}</h3>
        <p><strong>Дата:</strong> ${new Date(event.date).toLocaleDateString()}</p>
        <p><strong>Место:</strong> ${event.location}</p>
        <p><strong>Описание:</strong> ${event.description}</p>
        <p><strong>Свободных мест:</strong> ${event.capacity - event.participants.length}</p>
        <form class="event-reg-form" data-event-id="${event.id}">
          <input type="email" placeholder="Ваш email" required>
          <button type="submit">Записаться</button>
        </form>
      `;
      eventsList.appendChild(eventElement);
    });

    // Добавляем обработчики для форм регистрации
    document.querySelectorAll('.event-reg-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = form.dataset.eventId;
        const email = form.querySelector('input').value;
        
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
            alert('Вы успешно записаны на мероприятие!');
            form.reset();
            loadEvents();
          } else {
            const error = await response.text();
            alert(`Ошибка: ${error}`);
          }
        } catch (error) {
          console.error('Registration error:', error);
          alert('Ошибка сети. Попробуйте позже.');
        }
      });
    });
  } catch (error) {
    console.error('Error loading events:', error);
  }
}