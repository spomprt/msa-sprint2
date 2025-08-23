package ru.spomprt.bookingservice.service.impl;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import ru.spomprt.bookingservice.dto.BookingCreatedEvent;
import ru.spomprt.bookingservice.service.EventPublisherService;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisherServiceImpl implements EventPublisherService {

    private final KafkaTemplate<String, BookingCreatedEvent> kafkaTemplate;

    @Value("${kafka.topic.booking-created:booking-created}")
    private String bookingCreatedTopic;

    @Override
    public void publishBookingCreatedEvent(BookingCreatedEvent event) {
        log.info("Publishing booking created event: {}", event);

        CompletableFuture<SendResult<String, BookingCreatedEvent>> future =
                kafkaTemplate.send(bookingCreatedTopic, Optional.ofNullable(event.getId())
                        .map(String::valueOf).orElse("default"), event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Booking created event sent successfully to topic: {}, partition: {}, offset: {}",
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Failed to send booking created event: {}", ex.getMessage(), ex);
            }
        });
    }
}
