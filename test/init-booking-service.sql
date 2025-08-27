-- Очистка таблицы booking
DELETE FROM booking;

-- Вставка тестовых бронирований для booking-service
INSERT INTO booking (user_id, hotel_id, promo_code, discount_percent, price, created_at)
VALUES
('test-user-1', 'test-hotel-1', 'TESTCODE1', 10.0, 90.0, NOW()),
('test-user-2', 'test-hotel-1', 'TESTCODE1', 10.0, 90.0, NOW()),
('test-user-3', 'test-hotel-1', null, 0.0, 100.0, NOW()),
('test-user-1', 'test-hotel-2', null, 0.0, 120.0, NOW()),
('test-user-2', 'test-hotel-2', 'TESTCODE-VIP', 20.0, 96.0, NOW()),
('test-user-3', 'test-hotel-3', null, 0.0, 80.0, NOW());
