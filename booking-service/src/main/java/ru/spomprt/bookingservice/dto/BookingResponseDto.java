package ru.spomprt.bookingservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingResponseDto {
    private Long id;
    private String userId;
    private String hotelId;
    private String promoCode;
    private Double discountPercent;
    private Double price;
    private LocalDateTime createdAt;
}
