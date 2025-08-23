package ru.spomprt.bookinghistoryservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import ru.spomprt.bookinghistoryservice.dto.BookingCreatedEvent;
import ru.spomprt.bookinghistoryservice.service.BookingEventService;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingEventConsumer {

    private final BookingEventService bookingEventService;

    @KafkaListener(
        topics = "${kafka.topic.booking-created:booking-created}",
        groupId = "${spring.application.name:booking-history-service}"
    )
    public void consumeBookingCreatedEvent(BookingCreatedEvent event) {
        log.info("Consuming booking created event: {}", event);
        try {
            bookingEventService.handleBookingCreatedEvent(event);
        } catch (Exception e) {
            log.error("Error processing booking created event: {}", e.getMessage(), e);
            // Здесь можно добавить логику для retry или dead letter queue
        }
    }
}
