## Внесённые изменения

- В hotel-subgraph добавлено обращение в API hotelio-monolith "/api/hotels"
- В booking-subgraph добавлено обращение в API booking-service "/api/v1/bookings"
- Проверка наличия header "X-User-ID"
- Проверка на то, что пользователь авторизован
- Пользователь может просматривать только свои бронирования