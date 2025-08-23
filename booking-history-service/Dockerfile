FROM openjdk:17-jdk-slim

# Добавляем аргумент для принудительной пересборки
ARG BUILD_DATE
ARG BUILD_DATE

WORKDIR /app

# Копируем Maven wrapper и pom.xml
COPY mvnw .
COPY mvnw.cmd .
COPY pom.xml .
COPY .mvn ./.mvn

# Устанавливаем права на выполнение для Maven wrapper
RUN chmod +x mvnw

# Скачиваем зависимости (этот слой будет кэшироваться, если pom.xml не изменился)
RUN ./mvnw dependency:go-offline -B

# Копируем исходный код
COPY src ./src

# Собираем приложение
RUN ./mvnw clean package -DskipTests

# Создаем директорию для приложения
RUN mkdir -p /app/target

# Копируем собранный JAR
RUN cp target/*.jar app.jar

# Открываем порт
EXPOSE 8081

# Запускаем приложение
ENTRYPOINT ["java", "-jar", "app.jar"]
