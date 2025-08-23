package com.hotelio.monolith.grpc;

import com.google.protobuf.StringValue;
import com.hotelio.proto.booking.BookingListRequest;
import com.hotelio.proto.booking.BookingListResponse;
import com.hotelio.proto.booking.BookingRequest;
import com.hotelio.proto.booking.BookingResponse;
import com.hotelio.proto.booking.BookingServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BookingGrpcClient {

    private static final Logger log = LoggerFactory.getLogger(BookingGrpcClient.class);

    @Value("${booking.service.external-host:localhost}")
    private String host;

    @Value("${booking.service.external-port:9090}")
    private int port;

    private ManagedChannel channel;
    private BookingServiceGrpc.BookingServiceBlockingStub blockingStub;

    @PostConstruct
    public void init() {
        log.info("Initializing gRPC client to {}:{}", host, port);
        channel = ManagedChannelBuilder.forAddress(host, port)
                .usePlaintext()
                .build();
        blockingStub = BookingServiceGrpc.newBlockingStub(channel);
        log.info("gRPC client initialized successfully");
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null) {
            log.info("Shutting down gRPC client");
            channel.shutdown();
        }
    }

    public BookingResponse createBooking(String userId, String hotelId, String promoCode) {
        log.info("Calling gRPC createBooking: userId={}, hotelId={}, promoCode={}", userId, hotelId, promoCode);

        try {
            BookingRequest.Builder requestBuilder = BookingRequest.newBuilder()
                    .setUserId(userId)
                    .setHotelId(hotelId);

            // Устанавливаем promoCode только если он не null
            if (promoCode != null && !promoCode.trim().isEmpty()) {
                requestBuilder.setPromoCode(StringValue.of(promoCode));
            }

            BookingRequest request = requestBuilder.build();

            BookingResponse response = blockingStub.createBooking(request);
            log.info("Successfully created booking via gRPC: id={}", response.getId());
            return response;

        } catch (Exception e) {
            log.error("Error calling gRPC createBooking: ", e);
            throw new RuntimeException("Failed to create booking via gRPC", e);
        }
    }

    public BookingListResponse listBookings(String userId) {
        log.info("Calling gRPC listBookings: userId={}", userId);

        try {
            BookingListRequest.Builder requestBuilder = BookingListRequest.newBuilder();
            
            // Устанавливаем userId только если он не null
            if (userId != null && !userId.trim().isEmpty()) {
                requestBuilder.setUserId(StringValue.of(userId));
            }

            BookingListRequest request = requestBuilder.build();

            BookingListResponse response = blockingStub.listBookings(request);
            log.info("Successfully retrieved {} bookings via gRPC", response.getBookingsCount());
            return response;

        } catch (Exception e) {
            log.error("Error calling gRPC listBookings: ", e);
            throw new RuntimeException("Failed to list bookings via gRPC", e);
        }
    }
}
