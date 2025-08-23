package com.hotelio.monolith.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.hotelio.monolith.entity.Booking;
import com.hotelio.monolith.entity.PromoCode;
import com.hotelio.monolith.grpc.BookingGrpcClient;
import com.hotelio.monolith.repository.BookingRepository;
import com.hotelio.proto.booking.BookingListResponse;
import com.hotelio.proto.booking.BookingResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final PromoCodeService promoCodeService;
    private final ReviewService reviewService;
    private final AppUserService userService;
    private final HotelService hotelService;
    private final BookingGrpcClient grpcClient;

    public BookingService(
            BookingRepository bookingRepository,
            PromoCodeService promoCodeService,
            ReviewService reviewService,
            AppUserService userService,
            HotelService hotelService,
            BookingGrpcClient grpcClient
    ) {
        this.bookingRepository = bookingRepository;
        this.promoCodeService = promoCodeService;
        this.reviewService = reviewService;
        this.userService = userService;
        this.hotelService = hotelService;
        this.grpcClient = grpcClient;
    }

    public List<Booking> listAll(String userId) {
        log.info("Listing bookings with userId={}", userId);
        BookingListResponse response = grpcClient.listBookings(userId);
        return response.getBookingsList().stream()
                .map(grpcResponse -> {
                    Booking booking = new Booking();
                    booking.setUserId(grpcResponse.getUserId());
                    booking.setHotelId(grpcResponse.getHotelId());
                    // Обрабатываем nullable promoCode
                    if (grpcResponse.hasPromoCode()) {
                        booking.setPromoCode(grpcResponse.getPromoCode().getValue());
                    } else {
                        booking.setPromoCode(null);
                    }
                    booking.setDiscountPercent(grpcResponse.getDiscountPercent());
                    booking.setPrice(grpcResponse.getPrice());
                    try {
                        booking.setCreatedAt(Instant.parse(grpcResponse.getCreatedAt()));
                    } catch (Exception e) {
                        booking.setCreatedAt(null);
                    }
                    return booking;
                })
                .toList();
    }

    public Booking createBooking(String userId, String hotelId, String promoCode) {
        log.info("Creating booking via gRPC: userId={}, hotelId={}, promoCode={}", userId, hotelId, promoCode);

        // Perform validation before calling gRPC
        validateUser(userId);
        validateHotel(hotelId);

        try {
            // Вызываем микросервис через gRPC
            BookingResponse grpcResponse = grpcClient.createBooking(userId, hotelId, promoCode);

            // Создаем локальную сущность для совместимости
            Booking booking = new Booking();
            // ID будет сгенерирован автоматически
            booking.setUserId(grpcResponse.getUserId());
            booking.setHotelId(grpcResponse.getHotelId());
            // Обрабатываем nullable promoCode
            if (grpcResponse.hasPromoCode()) {
                booking.setPromoCode(grpcResponse.getPromoCode().getValue());
            } else {
                booking.setPromoCode(null);
            }
            booking.setDiscountPercent(grpcResponse.getDiscountPercent());
            booking.setPrice(grpcResponse.getPrice());
            booking.setCreatedAt(Instant.now());

            // Сохраняем в локальную БД для совместимости
            return bookingRepository.save(booking);

        } catch (Exception e) {
            log.error("Failed to create booking via gRPC, falling back to local logic", e);

            // Fallback на локальную логику при ошибке gRPC
            return createBookingLocal(userId, hotelId, promoCode);
        }
    }

    private Booking createBookingLocal(String userId, String hotelId, String promoCode) {
        log.info("Creating booking locally: userId={}, hotelId={}, promoCode={}", userId, hotelId, promoCode);

        validateUser(userId);
        validateHotel(hotelId);

        double basePrice = resolveBasePrice(userId);
        double discount = resolvePromoDiscount(promoCode, userId);

        double finalPrice = basePrice - discount;
        log.info("Final price calculated: base={}, discount={}, final={}", basePrice, discount, finalPrice);

        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setHotelId(hotelId);
        booking.setPromoCode(promoCode);
        booking.setDiscountPercent(discount);
        booking.setPrice(finalPrice);

        return bookingRepository.save(booking);
    }

    private void validateUser(String userId) {
        if (!userService.isUserActive(userId)) {
            log.warn("User {} is inactive", userId);
            throw new IllegalArgumentException("User is inactive");
        }
        if (userService.isUserBlacklisted(userId)) {
            log.warn("User {} is blacklisted", userId);
            throw new IllegalArgumentException("User is blacklisted");
        }
    }

    private void validateHotel(String hotelId) {
        if (!hotelService.isHotelOperational(hotelId)) {
            log.warn("Hotel {} is not operational", hotelId);
            throw new IllegalArgumentException("Hotel is not operational");
        }
        if (!reviewService.isTrustedHotel(hotelId)) {
            log.warn("Hotel {} is not trusted", hotelId);
            throw new IllegalArgumentException("Hotel is not trusted based on reviews");
        }
        if (hotelService.isHotelFullyBooked(hotelId)) {
            log.warn("Hotel {} is fully booked", hotelId);
            throw new IllegalArgumentException("Hotel is fully booked");
        }
    }

    private double resolveBasePrice(String userId) {
        Optional<String> statusOpt = userService.getUserStatus(userId);
        return statusOpt.map(status -> {
            boolean isVip = status.equalsIgnoreCase("VIP");
            log.debug("User {} has status '{}', base price is {}", userId, status, isVip ? 80.0 : 100.0);
            return isVip ? 80.0 : 100.0;
        }).orElseGet(() -> {
            log.debug("User {} has unknown status, default base price 100.0", userId);
            return 100.0;
        });
    }

    private double resolvePromoDiscount(String promoCode, String userId) {
        if (promoCode == null) {
            return 0.0;
        }

        PromoCode promo = promoCodeService.validate(promoCode, userId);
        if (promo == null) {
            log.info("Promo code '{}' is invalid or not applicable for user {}", promoCode, userId);
            return 0.0;
        }

        log.debug("Promo code '{}' applied with discount {}", promoCode, promo.getDiscount());
        return promo.getDiscount();
    }
}
