# Istio Canary Configuration для Task 5

## Описание

Эта конфигурация реализует продвинутую канареечную маршрутизацию с fallback-логикой для booking-service.

## Архитектура

```
┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   Istio Proxy   │
│                 │───▶│   (Sidecar)     │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │ VirtualService  │
                    │ (Canary + FF)   │
                    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │ DestinationRule │
                    │ (Subsets v1/v2) │
                    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   Services      │
                    │ v1 (90%) v2(10%)│
                    └─────────────────┘
```

## Компоненты

### 1. VirtualService (`virtual-service-canary.yaml`)
- **Feature Flag маршрутизация**: запросы с `X-Feature-Enabled: true` идут на v2
- **Canary маршрутизация**: 90% трафика на v1, 10% на v2
- **Retry политика**: 3 попытки с таймаутом 2s
- **Fallback логика**: автоматический retry при ошибках

### 2. DestinationRule (`destination-rule-canary.yaml`)
- **Subset v1**: версия v1 с настройками connection pool
- **Subset v2**: версия v2 с настройками connection pool
- **Outlier Detection**: автоматическое исключение нестабильных endpoints
- **Connection Pool**: настройки TCP и HTTP соединений

### 3. EnvoyFilter (`envoy-filter-canary.yaml`)
- **Retry политика**: настройка retry логики для fallback
- **Fault injection**: возможность симуляции ошибок для тестирования
- **Enhanced routing**: улучшенная обработка маршрутизации

## Применение

```bash
# Применить все конфигурации
./apply-canary-config.sh

# Или по отдельности
kubectl apply -f istio-configs/destination-rule.yaml
kubectl apply -f istio-configs/virtual-service.yaml
kubectl apply -f istio-configs/envoy-filter.yaml
```

## Тестирование

### Канареечная маршрутизация
```bash
# Тест распределения трафика
./test-canary-routing.sh

# Тест fallback логики
./test-fallback-routing.sh
```

### Feature Flag маршрутизация
```bash
# Без заголовка - идет на v1 (90%) или v2 (10%)
curl http://booking-service/ping

# С заголовком - всегда идет на v2
curl -H "X-Feature-Enabled: true" http://booking-service/ping
```

## Fallback Логика

### Retry Политика
- **Max attempts**: 3
- **Per-try timeout**: 2s
- **Retry conditions**: connect-failure, refused-stream, unavailable, cancelled, retriable-status-codes

### Outlier Detection
- **v1 subset**: consecutive5xxErrors=2, interval=5s, baseEjectionTime=15s
- **v2 subset**: consecutive5xxErrors=1, interval=3s, baseEjectionTime=10s

### Автоматический Fallback
1. При ошибке v1, Istio автоматически retry запрос
2. Если v1 продолжает возвращать ошибки, трафик перенаправляется на v2
3. Outlier detection исключает нестабильные endpoints

## Мониторинг

### Istio Metrics
```bash
# Проверить статус ресурсов
kubectl get virtualservice
kubectl get destinationrule
kubectl get envoyfilter

# Логи Istio proxy
kubectl logs <pod-name> -c istio-proxy
```

### Health Checks
- **Endpoint**: `/ping`
- **Expected response**: версия сервиса (v1 или v2)
- **Health check**: `/health` (для Kubernetes probes)

## Преимущества

1. **Постепенный Rollout**: безопасное развертывание новых версий
2. **Автоматический Fallback**: отказоустойчивость при ошибках
3. **Feature Flag поддержка**: гибкое управление функциональностью
4. **Мониторинг**: детальное отслеживание маршрутизации
5. **Масштабируемость**: легко изменить распределение трафика

## Troubleshooting

### Проблемы с маршрутизацией
```bash
# Проверить статус VirtualService
kubectl describe virtualservice booking-service-canary

# Проверить логи Istio proxy
kubectl logs <pod-name> -c istio-proxy | grep -E "(route|retry|fallback)"
```

### Проблемы с fallback
```bash
# Проверить DestinationRule
kubectl describe destinationrule booking-service-canary

# Проверить EnvoyFilter
kubectl describe envoyfilter booking-service-canary-filter
```
