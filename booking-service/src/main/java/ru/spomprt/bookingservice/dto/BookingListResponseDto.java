package ru.spomprt.bookingservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class BookingListResponseDto {
    private List<BookingResponseDto> bookings;
}
