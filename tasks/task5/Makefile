.PHONY: help apply-canary test-canary test-fallback clean status

help:
	@echo "Available commands:"
	@echo "  apply-canary    - Apply Istio canary configuration"
	@echo "  test-canary     - Test canary routing (90% v1, 10% v2)"
	@echo "  test-fallback   - Test fallback routing logic"
	@echo "  status          - Check Istio resources status"
	@echo "  clean           - Remove canary configurations"
	@echo "  help            - Show this help message"

apply-canary:
	@echo "Applying Istio canary configuration..."
	./apply-canary-config.sh

test-canary:
	@echo "Testing canary routing..."
	./test-canary-routing.sh

test-fallback:
	@echo "Testing fallback routing..."
	./test-fallback-routing.sh

status:
	@echo "Checking Istio resources status..."
	./kubernetes-config-status.sh

clean:
	@echo "Removing canary configurations..."
	kubectl delete -f istio-configs/destination-rule-canary.yaml --ignore-not-found=true
	kubectl delete -f istio-configs/virtual-service-canary.yaml --ignore-not-found=true
	kubectl delete -f istio-configs/envoy-filter-canary.yaml --ignore-not-found=true
	@echo "Canary configurations removed"