echo "Test Canary Routing (100 requests):"
canary_v1=0
canary_v2=0
canary_main=0

for i in {1..100}; do
    response=$(kubectl exec -it $(kubectl get pods -l app=booking-service,version=v1 -o jsonpath='{.items[0].metadata.name}') -c istio-proxy -- curl -s http://booking-service/ping)

    if [[ $response == *"v1"* ]]; then
        ((canary_v1++))
    elif [[ $response == *"v2"* ]]; then
        ((canary_v2++))
    elif [[ $response == *"main"* ]]; then
        ((canary_main++))
    fi

    if ((i % 10 == 0)); then
        echo "Processed $i requests..."
    fi
done

echo
echo "Canary Routing Results (100 requests):"
echo "  v1: $canary_v1 requests (${canary_v1}%)"
echo "  v2: $canary_v2 requests (${canary_v2}%)"
echo "  main: $canary_main requests (${canary_main}%)"
echo
