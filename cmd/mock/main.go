package main

import (
	"log"
	"net/http"
	"net/http/httputil"
)

func main() {
	// create mock http server listening on localhost:8080
	log.Fatal(http.ListenAndServe(":8080", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		dump, err := httputil.DumpRequest(r, true)
		if err != nil {
			log.Fatal(err)
		}
		log.Println(string(dump))
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`"A"`))
	})))
}
