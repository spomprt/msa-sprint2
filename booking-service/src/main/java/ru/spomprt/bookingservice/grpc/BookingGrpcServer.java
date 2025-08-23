package ru.spomprt.bookingservice.grpc;

import java.time.format.DateTimeFormatter;
import java.util.Optional;

import com.google.protobuf.StringValue;
import com.hotelio.proto.booking.BookingListRequest;
import com.hotelio.proto.booking.BookingListResponse;
import com.hotelio.proto.booking.BookingRequest;
import com.hotelio.proto.booking.BookingResponse;
import com.hotelio.proto.booking.BookingServiceGrpc;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import ru.spomprt.bookingservice.service.BookingService;

@GrpcService
public class BookingGrpcServer extends BookingServiceGrpc.BookingServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(BookingGrpcServer.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final BookingService bookingService;

    @Autowired
    public BookingGrpcServer(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Override
    public void createBooking(BookingRequest request, StreamObserver<BookingResponse> responseObserver) {
        log.info("Received gRPC createBooking request: userId={}, hotelId={}, promoCode={}",
                request.getUserId(), request.getHotelId(), 
                request.hasPromoCode() ? request.getPromoCode().getValue() : "null");

        try {
            ru.spomprt.bookingservice.dto.BookingRequestDto dto = new ru.spomprt.bookingservice.dto.BookingRequestDto();
            dto.setUserId(request.getUserId());
            dto.setHotelId(request.getHotelId());
            dto.setPromoCode(request.hasPromoCode() ? request.getPromoCode().getValue() : null);

            ru.spomprt.bookingservice.dto.BookingResponseDto response = bookingService.createBooking(dto);

            BookingResponse.Builder grpcResponseBuilder = BookingResponse.newBuilder()
                    .setId(Optional.ofNullable(response.getId())
                            .map(String::valueOf)
                            .orElse(""))
                    .setUserId(response.getUserId())
                    .setHotelId(response.getHotelId())
                    .setDiscountPercent(response.getDiscountPercent())
                    .setPrice(response.getPrice())
                    .setCreatedAt(response.getCreatedAt().format(formatter));

            // Устанавливаем promoCode только если он не null
            if (response.getPromoCode() != null) {
                grpcResponseBuilder.setPromoCode(StringValue.of(response.getPromoCode()));
            }

            BookingResponse grpcResponse = grpcResponseBuilder.build();

            responseObserver.onNext(grpcResponse);
            responseObserver.onCompleted();
            log.info("Successfully created booking with id: {}", response.getId());

        } catch (Exception e) {
            log.error("Error creating booking: ", e);
            responseObserver.onError(e);
        }
    }

    @Override
    public void listBookings(BookingListRequest request, StreamObserver<BookingListResponse> responseObserver) {
        String userId = request.hasUserId() ? request.getUserId().getValue() : null;
        log.info("Received gRPC listBookings request: userId={}", userId);

        try {
            ru.spomprt.bookingservice.dto.BookingListRequestDto dto = new ru.spomprt.bookingservice.dto.BookingListRequestDto();
            dto.setUserId(userId);

            ru.spomprt.bookingservice.dto.BookingListResponseDto response = bookingService.getUserBookings(dto);

            BookingListResponse.Builder grpcResponseBuilder = BookingListResponse.newBuilder();

            for (ru.spomprt.bookingservice.dto.BookingResponseDto booking : response.getBookings()) {
                BookingResponse.Builder grpcBookingBuilder = BookingResponse.newBuilder()
                        .setId(Optional.ofNullable(booking.getId())
                                .map(String::valueOf)
                                .orElse(""))
                        .setUserId(booking.getUserId())
                        .setHotelId(booking.getHotelId())
                        .setDiscountPercent(booking.getDiscountPercent())
                        .setPrice(booking.getPrice())
                        .setCreatedAt(booking.getCreatedAt().format(formatter));

                // Устанавливаем promoCode только если он не null
                if (booking.getPromoCode() != null) {
                    grpcBookingBuilder.setPromoCode(StringValue.of(booking.getPromoCode()));
                }

                BookingResponse grpcBooking = grpcBookingBuilder.build();
                grpcResponseBuilder.addBookings(grpcBooking);
            }

            responseObserver.onNext(grpcResponseBuilder.build());
            responseObserver.onCompleted();
            log.info("Successfully returned {} bookings", response.getBookings().size());

        } catch (Exception e) {
            log.error("Error listing bookings: ", e);
            responseObserver.onError(e);
        }
    }
}
