package ru.spomprt.bookingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.spomprt.bookingservice.dto.BookingListRequestDto;
import ru.spomprt.bookingservice.dto.BookingListResponseDto;
import ru.spomprt.bookingservice.dto.BookingRequestDto;
import ru.spomprt.bookingservice.dto.BookingResponseDto;
import ru.spomprt.bookingservice.service.BookingService;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingRestController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponseDto> createBooking(@Valid @RequestBody BookingRequestDto request) {
        BookingResponseDto response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/user")
    public ResponseEntity<BookingListResponseDto> getUserBookings(@RequestParam String userId) {
        BookingListRequestDto request = new BookingListRequestDto();
        request.setUserId(userId);
        BookingListResponseDto response = bookingService.getUserBookings(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDto> getBooking(@PathVariable Long id) {
        BookingResponseDto response = bookingService.getBookingById(id);
        return ResponseEntity.ok(response);
    }
}
