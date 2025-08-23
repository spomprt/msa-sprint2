package ru.spomprt.bookingservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookingRequestDto {
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @NotBlank(message = "Hotel ID is required")
    private String hotelId;
    
    private String promoCode; // optional
}
