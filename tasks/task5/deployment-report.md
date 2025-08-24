# Отчет о развертывании booking-service в minikube с Istio

## Обзор

Успешно развернут booking-service версий v1 и v2 в minikube с настройкой продвинутой маршрутизации через Istio.

## Архитектура развертывания

### Компоненты
- **booking-service-v1**: 2 реплики, версия v1 без feature X
- **booking-service-v2**: 1 реплика, версия v2 с feature X включен
- **Istio Gateway**: Входящий трафик на порту 80
- **VirtualService**: Маршрутизация с feature flag и canary логикой
- **DestinationRule**: Настройки subsets и traffic policy
- **EnvoyFilter**: Дополнительная настройка retry политики

### Схема маршрутизации
```
Client → Istio Gateway → VirtualService → DestinationRule → Pods
                                    ↓
                            Feature Flag: X-Feature-Enabled: true → v2 (100%)
                            Canary: без заголовка → v1 (90%) + v2 (10%)
```

## Результаты развертывания

### Статус подов
- ✅ `booking-service-v1`: 2/2 Running
- ✅ `booking-service-v2`: 1/1 Running
- ✅ Все поды имеют Istio sidecar (2/2 Ready)

### Статус сервисов
- ✅ `booking-service`: Основной сервис для маршрутизации
- ✅ `booking-service-v1`: Сервис для версии v1
- ✅ `booking-service-v2`: Сервис для версии v2

### Статус Istio ресурсов
- ✅ `Gateway`: booking-service-gateway
- ✅ `VirtualService`: booking-service-canary
- ✅ `DestinationRule`: booking-service-canary
- ✅ `EnvoyFilter`: booking-service-canary-filter

## Тестирование маршрутизации

### Feature Flag маршрутизация
- **Без заголовка**: Трафик распределяется по canary логике
- **С заголовком X-Feature-Enabled: true**: 100% трафика идет на v2

### Canary маршрутизация
- **v1**: ~90% трафика (как ожидалось)
- **v2**: ~10% трафика (как ожидалось)

### Endpoints
- `/ping`: Основной endpoint с версией
- `/health`: Health check для Kubernetes probes
- `/version`: Информация о версии
- `/feature`: Проверка доступности feature X

## Конфигурация Istio

### VirtualService
```yaml
# Feature flag маршрутизация
- match:
  - headers:
      X-Feature-Enabled:
        exact: "true"
  route:
  - destination:
      host: booking-service
      subset: v2
      weight: 100

# Canary маршрутизация
- route:
  - destination:
      host: booking-service
      subset: v1
      weight: 90
  - destination:
      host: booking-service
      subset: v2
      weight: 10
```

### DestinationRule
- **v1 subset**: Более консервативные настройки (consecutive5xxErrors: 2)
- **v2 subset**: Более агрессивные настройки (consecutive5xxErrors: 1)
- **Connection Pool**: Настроены для обеих версий
- **Outlier Detection**: Автоматическое исключение нестабильных endpoints

## Мониторинг и логи

### Istio Proxy логи
- Все HTTP запросы логируются
- Маршрутизация работает корректно
- Sidecar injection функционирует

### Health Checks
- Liveness probe: `/health` каждые 10s
- Readiness probe: `/health` каждые 5s
- Все поды готовы к приему трафика

## Преимущества развертывания

1. **Постепенный Rollout**: Безопасное развертывание новых версий
2. **Feature Flag поддержка**: Гибкое управление функциональностью
3. **Автоматический Fallback**: Отказоустойчивость при ошибках
4. **Мониторинг**: Детальное отслеживание маршрутизации
5. **Масштабируемость**: Легко изменить распределение трафика

## Команды для управления

### Проверка статуса
```bash
kubectl get pods
kubectl get services
kubectl get virtualservice
kubectl get destinationrule
```

### Тестирование
```bash
# Canary маршрутизация
curl http://localhost:8080/ping

# Feature flag маршрутизация
curl -H "X-Feature-Enabled: true" http://localhost:8080/ping

# Запуск полного теста
./tasks/task5/test-routing.sh
```

### Логи
```bash
# Логи Istio proxy
kubectl logs -l app=booking-service -c istio-proxy

# Логи приложения
kubectl logs -l app=booking-service -c booking-service
```

## Заключение

Развертывание прошло успешно. Все компоненты работают корректно:
- ✅ Маршрутизация по feature flag
- ✅ Canary маршрутизация с правильным распределением
- ✅ Istio sidecar injection
- ✅ Health checks и monitoring
- ✅ Отказоустойчивость и fallback логика

Система готова к production использованию с возможностью постепенного rollout новых версий.
