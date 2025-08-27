package ru.spomprt.bookingservice.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.spomprt.bookingservice.dto.BookingCreatedEvent;
import ru.spomprt.bookingservice.dto.BookingListRequestDto;
import ru.spomprt.bookingservice.dto.BookingListResponseDto;
import ru.spomprt.bookingservice.dto.BookingRequestDto;
import ru.spomprt.bookingservice.dto.BookingResponseDto;
import ru.spomprt.bookingservice.entity.Booking;
import ru.spomprt.bookingservice.repository.BookingRepository;
import ru.spomprt.bookingservice.service.BookingService;
import ru.spomprt.bookingservice.service.EventPublisherService;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final EventPublisherService eventPublisherService;

    @Override
    public BookingResponseDto createBooking(BookingRequestDto request) {
        // Создаем новое бронирование
        Booking booking = new Booking();
        booking.setUserId(request.getUserId());
        booking.setHotelId(request.getHotelId());
        booking.setPromoCode(request.getPromoCode());
        booking.setCreatedAt(LocalDateTime.now());

        // Простая логика расчета скидки (можно расширить)
        double discountPercent = 0.0;
        if (request.getPromoCode() != null && !request.getPromoCode().isEmpty()) {
            discountPercent = 10.0; // 10% скидка при использовании промокода
        }

        // Базовая цена (можно получать из сервиса отелей)
        double basePrice = 100.0; // Заглушка
        double finalPrice = basePrice * (1 - discountPercent / 100);

        booking.setDiscountPercent(discountPercent);
        booking.setPrice(finalPrice);

        // Сохраняем в базу данных
        Booking savedBooking = bookingRepository.save(booking);

        // Отправляем событие в Kafka
        BookingCreatedEvent event = new BookingCreatedEvent(
                savedBooking.getId(),
                savedBooking.getUserId(),
                savedBooking.getHotelId(),
                savedBooking.getPromoCode(),
                savedBooking.getDiscountPercent(),
                savedBooking.getPrice(),
                savedBooking.getCreatedAt(),
                LocalDateTime.now()
        );
        eventPublisherService.publishBookingCreatedEvent(event);

        // Возвращаем DTO
        return mapToResponseDto(savedBooking);
    }

    @Override
    public BookingListResponseDto getUserBookings(BookingListRequestDto request) {
        List<Booking> bookings;
        if (request.getUserId() == null) {
            bookings = bookingRepository.findAll();
        } else {
            bookings = bookingRepository.findByUserId(request.getUserId());
        }

        List<BookingResponseDto> bookingDtos = bookings.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());

        BookingListResponseDto response = new BookingListResponseDto();
        response.setBookings(bookingDtos);
        return response;
    }

    @Override
    public BookingResponseDto getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

        return mapToResponseDto(booking);
    }

    private BookingResponseDto mapToResponseDto(Booking booking) {
        BookingResponseDto dto = new BookingResponseDto();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUserId());
        dto.setHotelId(booking.getHotelId());
        dto.setPromoCode(booking.getPromoCode());
        dto.setDiscountPercent(booking.getDiscountPercent());
        dto.setPrice(booking.getPrice());
        dto.setCreatedAt(booking.getCreatedAt());
        return dto;
    }
}
