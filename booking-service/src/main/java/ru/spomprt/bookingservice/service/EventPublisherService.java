package ru.spomprt.bookingservice.service;

import ru.spomprt.bookingservice.dto.BookingCreatedEvent;

public interface EventPublisherService {
    void publishBookingCreatedEvent(BookingCreatedEvent event);
}
