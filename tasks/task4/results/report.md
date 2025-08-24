# Task 4 - Kubernetes Deployment Report

## Описание изменений и решений

### 1. Структура проекта
Создана микросервисная архитектура с использованием:
- **Go-сервис** (`booking-service/`) - основной сервис бронирования
- **Helm charts** для управления Kubernetes ресурсами
- **Docker** для контейнеризации
- **Minikube** для локальной разработки

### 2. Основные компоненты

#### 2.1 Go-сервис (booking-service/)
- **Язык**: Go 1.21
- **Фреймворк**: стандартная библиотека net/http
- **Эндпоинты**:
  - `GET /ping` - health check
  - `GET /health` - детальная информация о состоянии
  - `POST /booking` - создание бронирования
  - `GET /booking/{id}` - получение бронирования по ID

#### 2.2 Helm Chart (helm/booking-service/)
- **Deployment**: 1 реплика с ресурсами CPU: 250m-500m, Memory: 256Mi-512Mi
- **Service**: ClusterIP на порту 80
- **Health Checks**: liveness и readiness пробы на `/ping`
- **Feature Flags**: поддержка конфигурируемых флагов

#### 2.3 Docker
- **Базовый образ**: `golang:1.21-alpine`
- **Многоэтапная сборка**: компиляция + минимальный runtime образ
- **Размер образа**: ~15MB

### 3. Конфигурация окружений

#### 3.1 Staging (values-staging.yaml)
- Реплики: 2
- Ресурсы: увеличенные лимиты
- Feature flags: включены для тестирования

#### 3.2 Production (values-prod.yaml)
- Реплики: 3
- Ресурсы: максимальные лимиты
- Feature flags: отключены для стабильности
- HPA: включен для автоматического масштабирования

### 4. CI/CD Pipeline (.gitlab-ci.yml)
- **Stages**: build, test, deploy
- **Build**: сборка Docker образа
- **Test**: запуск unit тестов
- **Deploy**: развертывание в staging/production

### 5. Скрипты проверки
- **check-dns.sh**: проверка DNS резолвинга внутри кластера
- **check-status.sh**: проверка состояния развертывания

### 6. Результаты тестирования
- ✅ DNS резолвинг работает корректно
- ✅ Сервис отвечает на health checks
- ✅ Kubernetes ресурсы созданы успешно
- ✅ Docker образ собран и загружен в Minikube

### 7. Команды для развертывания
```bash
# Сборка и загрузка образа
make build
make load

# Развертывание через Helm
helm install booking-service ./helm/booking-service -f values-staging.yaml
helm upgrade booking-service ./helm/booking-service -f values-prod.yaml

# Проверка состояния
./check-status.sh
./check-dns.sh
```

### 8. Архитектурные решения
- **Микросервисный подход**: изоляция логики бронирования
- **Helm для управления**: версионирование и шаблонизация
- **Health checks**: обеспечение надежности развертывания
- **Feature flags**: гибкое управление функциональностью
- **Многоэтапная Docker сборка**: оптимизация размера образа
