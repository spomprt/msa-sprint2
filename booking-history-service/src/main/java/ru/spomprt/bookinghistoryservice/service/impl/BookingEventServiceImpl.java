package ru.spomprt.bookinghistoryservice.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ru.spomprt.bookinghistoryservice.dto.BookingCreatedEvent;
import ru.spomprt.bookinghistoryservice.entity.BookingEvent;
import ru.spomprt.bookinghistoryservice.repository.BookingEventRepository;
import ru.spomprt.bookinghistoryservice.service.BookingEventService;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingEventServiceImpl implements BookingEventService {

    private final BookingEventRepository bookingEventRepository;

    @Override
    public void handleBookingCreatedEvent(BookingCreatedEvent event) {
        log.info("Received booking created event: {}", event);
        
        try {
            // Создаем сущность для сохранения в базу данных
            BookingEvent bookingEvent = new BookingEvent();
            bookingEvent.setBookingId(event.getId());
            bookingEvent.setUserId(event.getUserId());
            bookingEvent.setHotelId(event.getHotelId());
            bookingEvent.setPromoCode(event.getPromoCode());
            bookingEvent.setDiscountPercent(event.getDiscountPercent());
            bookingEvent.setPrice(event.getPrice());
            bookingEvent.setCreatedAt(event.getCreatedAt());
            bookingEvent.setEventTimestamp(event.getEventTimestamp());
            bookingEvent.setEventType(BookingEvent.EventType.BOOKING_CREATED);
            
            // Сохраняем в базу данных
            BookingEvent savedEvent = bookingEventRepository.save(bookingEvent);
            log.info("Successfully saved booking event to database with ID: {}", savedEvent.getId());
            
        } catch (Exception e) {
            log.error("Failed to save booking event to database: {}", event, e);
            throw new RuntimeException("Failed to process booking event", e);
        }
        
        log.info("Successfully processed booking created event for booking ID: {}", event.getId());
    }
}
