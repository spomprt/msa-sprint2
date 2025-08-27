package ru.spomprt.bookinghistoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingCreatedEvent {
    private Long id;
    private String userId;
    private String hotelId;
    private String promoCode;
    private Double discountPercent;
    private Double price;
    private LocalDateTime createdAt;
    private LocalDateTime eventTimestamp;
}
