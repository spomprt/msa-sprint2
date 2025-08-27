package ru.spomprt.bookingservice.service;

import ru.spomprt.bookingservice.dto.BookingRequestDto;
import ru.spomprt.bookingservice.dto.BookingResponseDto;
import ru.spomprt.bookingservice.dto.BookingListRequestDto;
import ru.spomprt.bookingservice.dto.BookingListResponseDto;

public interface BookingService {
    BookingResponseDto createBooking(BookingRequestDto request);
    BookingListResponseDto getUserBookings(BookingListRequestDto request);
    BookingResponseDto getBookingById(Long id);
}
