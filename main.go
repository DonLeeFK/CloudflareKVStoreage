package main

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/cloudflare/cloudflare-go"
	"github.com/gorilla/mux"
)

var (
	cfToken    = os.Getenv("ENV_TOKEN") // Cloudflare API Token
	kvNamespaceID = os.Getenv("ENV_KV") // Cloudflare KV Namespace ID
)

func uploadFile(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	fileBytes, err := ioutil.ReadAll(file)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	// Encode file to base64
	encodedFile := base64.StdEncoding.EncodeToString(fileBytes)

	// Generate a unique filename
	filename := generateUniqueFilename()

	// Store the encoded file in Cloudflare KV
	if err := storeFileInKV(filename, encodedFile); err != nil {
		http.Error(w, "Failed to store file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(fmt.Sprintf("File uploaded successfully with filename: %s", filename)))
}

func deleteFile(w http.ResponseWriter, r *http.Request) {
	filename := mux.Vars(r)["filename"]

	// Delete the file from Cloudflare KV
	if err := deleteFileFromKV(filename); err != nil {
		http.Error(w, "Failed to delete file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("File deleted successfully: %s", filename)))
}

func listFiles(w http.ResponseWriter, r *http.Request) {
	// Fetch all file keys from Cloudflare KV
	keys, err := getAllFileKeysFromKV()
	if err != nil {
		http.Error(w, "Failed to fetch file list", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("File list: %v", keys)))
}

func generateUniqueFilename() string {
	// Generate a unique filename using a suitable algorithm
	// For example: timestamp + random string
	// Modify this function as per your requirements
	return "example.txt"
}

func storeFileInKV(filename, fileContent string) error {
	api, err := cloudflare.NewWithAPIToken(cfToken)
	if err != nil {
		return err
	}

	_, err = api.PutKV(kvNamespaceID, filename, []byte(fileContent))
	return err
}

func deleteFileFromKV(filename string) error {
	api, err := cloudflare.NewWithAPIToken(cfToken)
	if err != nil {
		return err
	}

	return api.DeleteKV(kvNamespaceID, filename)
}

func getAllFileKeysFromKV() ([]string, error) {
	api, err := cloudflare.NewWithAPIToken(cfToken)
	if err != nil {
		return nil, err
	}

	return api.ListKV(kvNamespaceID, "", "", 1000)
}

func main() {
	router := mux.NewRouter()

	// Define routes
	router.HandleFunc("/upload", uploadFile).Methods("POST")
	router.HandleFunc("/delete/{filename}", deleteFile).Methods("DELETE")
	router.HandleFunc("/list", listFiles).Methods("GET")

	log.Fatal(http.ListenAndServe(":8080", router))
}
