#!/bin/bash

echo "=== Istio Status Check ==="
echo "Date: $(date)"
echo

echo "1. Istio Pods Status:"
kubectl get pods -n istio-system
echo

echo "2. Booking Service Pods:"
kubectl get pods -l app=booking-service
echo

echo "3. Services:"
kubectl get svc -l app=booking-service
echo

echo "4. Istio Resources:"
echo "VirtualService:"
kubectl get virtualservice
echo

echo "DestinationRule:"
kubectl get destinationrule
echo

echo "=== Status Check Complete ==="
