#!/bin/bash

echo "=== Applying Istio Canary Configuration ==="
echo "Date: $(date)"
echo

# Проверяем, что Istio установлен
echo "1. Checking Istio installation:"
if ! kubectl get namespace istio-system >/dev/null 2>&1; then
    echo "ERROR: Istio namespace not found. Please install Istio first."
    exit 1
fi

echo "Istio namespace found ✓"
echo

# Применяем новые конфигурации
echo "2. Applying DestinationRule:"
kubectl apply -f istio-configs/destination-rule-canary.yaml
if [ $? -eq 0 ]; then
    echo "DestinationRule applied successfully ✓"
else
    echo "ERROR: Failed to apply DestinationRule"
    exit 1
fi
echo

echo "3. Applying VirtualService:"
kubectl apply -f istio-configs/virtual-service-canary.yaml
if [ $? -eq 0 ]; then
    echo "VirtualService applied successfully ✓"
else
    echo "ERROR: Failed to apply VirtualService"
    exit 1
fi
echo

echo "4. Applying EnvoyFilter:"
kubectl apply -f istio-configs/envoy-filter-canary.yaml
if [ $? -eq 0 ]; then
    echo "EnvoyFilter applied successfully ✓"
else
    echo "ERROR: Failed to apply EnvoyFilter"
    exit 1
fi
echo

# Ждем применения конфигураций
echo "5. Waiting for configuration to take effect..."
sleep 10

# Проверяем статус ресурсов
echo "6. Verifying resources status:"
echo "VirtualService:"
kubectl get virtualservice
echo

echo "DestinationRule:"
kubectl get destinationrule
echo

echo "EnvoyFilter:"
kubectl get envoyfilter
echo

# Проверяем, что поды готовы
echo "7. Checking pods readiness:"
kubectl get pods -l app=booking-service -o wide
echo

echo "=== Canary Configuration Applied Successfully ==="
echo "You can now test the configuration using: ./test-canary-routing.sh"
