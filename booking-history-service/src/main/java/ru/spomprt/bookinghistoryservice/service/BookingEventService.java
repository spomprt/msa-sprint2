package ru.spomprt.bookinghistoryservice.service;

import ru.spomprt.bookinghistoryservice.dto.BookingCreatedEvent;

public interface BookingEventService {
    void handleBookingCreatedEvent(BookingCreatedEvent event);
}
