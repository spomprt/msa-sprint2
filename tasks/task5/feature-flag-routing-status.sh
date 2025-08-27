echo "Test Feature Flag Routing (100 requests):"
feature_flag_v1=0
feature_flag_v2=0
feature_flag_main=0

for i in {1..100}; do
    response=$(kubectl exec -it $(kubectl get pods -l app=booking-service,version=v1 -o jsonpath='{.items[0].metadata.name}') -c istio-proxy -- curl -s -H "X-Feature-Enabled: true" http://booking-service/ping)

    if [[ $response == *"v1"* ]]; then
        ((feature_flag_v1++))
    elif [[ $response == *"v2"* ]]; then
        ((feature_flag_v2++))
    elif [[ $response == *"main"* ]]; then
        ((feature_flag_main++))
    fi

    if ((i % 10 == 0)); then
        echo "Processed $i requests..."
    fi
done

echo
echo "Feature Flag Routing Results (100 requests):"
echo "  v1: $feature_flag_v1 requests (${feature_flag_v1}%)"
echo "  v2: $feature_flag_v2 requests (${feature_flag_v2}%)"
echo "  main: $feature_flag_main requests (${feature_flag_main}%)"
echo
