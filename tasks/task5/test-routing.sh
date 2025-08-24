#!/bin/bash

echo "=== Тестирование маршрутизации booking-service ==="
echo

echo "1. Тест feature flag маршрутизации:"
echo "   Без заголовка X-Feature-Enabled:"
for i in {1..5}; do
    response=$(curl -s http://localhost:8080/ping)
    echo "   Request $i: $response"
done

echo
echo "   С заголовком X-Feature-Enabled: true:"
for i in {1..5}; do
    response=$(curl -s -H "X-Feature-Enabled: true" http://localhost:8080/ping)
    echo "   Request $i: $response"
done

echo
echo "2. Тест canary маршрутизации (20 запросов):"
v1_count=0
v2_count=0

for i in {1..20}; do
    response=$(curl -s http://localhost:8080/ping)
    if [[ $response == *"v1"* ]]; then
        v1_count=$((v1_count + 1))
    elif [[ $response == *"v2"* ]]; then
        v2_count=$((v2_count + 1))
    fi
    echo "   Request $i: $response"
done

echo
echo "3. Статистика распределения трафика:"
echo "   v1: $v1_count запросов"
echo "   v2: $v2_count запросов"
echo "   Ожидаемое распределение: v1 (90%), v2 (10%)"

echo
echo "4. Тест health check:"
curl -s http://localhost:8080/health
echo

echo "5. Тест версии:"
curl -s http://localhost:8080/version
echo

echo
echo "=== Тестирование завершено ==="
