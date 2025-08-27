package ru.spomprt.bookinghistoryservice.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "booking_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "hotel_id", nullable = false)
    private String hotelId;

    @Column(name = "promo_code")
    private String promoCode;

    @Column(name = "discount_percent")
    private Double discountPercent;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "event_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private EventType eventType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "event_timestamp", nullable = false)
    private LocalDateTime eventTimestamp;

    @Column(name = "processed_at")
    @CreationTimestamp
    private LocalDateTime processedAt;

    public enum EventType {
        BOOKING_CREATED,
        BOOKING_UPDATED,
        BOOKING_CANCELLED
    }
}
