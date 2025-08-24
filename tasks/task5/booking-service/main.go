package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	enableFeatureX := os.Getenv("ENABLE_FEATURE_X") == "true"
	version := os.Getenv("VERSION")
	if version == "" {
		version = "v1"
	}

	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		// Проверяем заголовок X-Feature-Enabled
		featureEnabled := r.Header.Get("X-Feature-Enabled") == "true"

		if featureEnabled && enableFeatureX {
			fmt.Fprintf(w, "pong from %s with feature X enabled!", version)
		} else {
			fmt.Fprintf(w, "pong from %s", version)
		}
	})

	http.HandleFunc("/version", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Version: %s", version)
	})

	http.HandleFunc("/feature", func(w http.ResponseWriter, r *http.Request) {
		if enableFeatureX {
			fmt.Fprintf(w, "Feature X is enabled in %s!", version)
		} else {
			http.Error(w, "Feature X is not available", http.StatusNotFound)
		}
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "OK")
	})

	log.Printf("Server running on :8080, version: %s, feature X: %v", version, enableFeatureX)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
