FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy the pre-built JAR file
COPY build/libs/hotelio-monolith-1.0.0.jar ./app.jar

# Expose Spring Boot port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
