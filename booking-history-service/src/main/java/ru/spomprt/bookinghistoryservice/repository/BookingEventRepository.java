package ru.spomprt.bookinghistoryservice.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.spomprt.bookinghistoryservice.entity.BookingEvent;

@Repository
public interface BookingEventRepository extends JpaRepository<BookingEvent, Long> {

    List<BookingEvent> findByUserIdOrderByEventTimestampDesc(String userId);

    List<BookingEvent> findByHotelIdOrderByEventTimestampDesc(String hotelId);

    @Query("SELECT be FROM BookingEvent be WHERE be.eventTimestamp BETWEEN :startDate AND :endDate ORDER BY be.eventTimestamp DESC")
    List<BookingEvent> findByEventTimestampBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT be FROM BookingEvent be WHERE be.eventType = :eventType ORDER BY be.eventTimestamp DESC")
    List<BookingEvent> findByEventType(@Param("eventType") BookingEvent.EventType eventType);
}
