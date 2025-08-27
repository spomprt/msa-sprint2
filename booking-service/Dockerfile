FROM openjdk:17-jdk-slim

# Добавляем аргумент для принудительной пересборки
ARG BUILD_DATE
ARG BUILD_DATE

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Make mvnw executable
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose gRPC port
EXPOSE 9090

# Run the application
CMD ["java", "-jar", "target/booking-service-0.0.1-SNAPSHOT.jar"]
