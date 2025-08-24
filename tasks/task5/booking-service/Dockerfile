# Используем официальный минимальный образ Go
FROM golang:1.21-alpine

# Добавляем необходимые пакеты (например, curl)
RUN apk add --no-cache curl

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем Go-файл
COPY main.go .

# Собираем бинарник из main.go
RUN go build -o booking-service main.go

# Задаем команду запуска
CMD ["./booking-service"]
