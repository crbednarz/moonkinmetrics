package api

import (
	"net/url"
	"testing"
)

func TestRequestToString(t *testing.T) {
	request := BnetRequest{
		Path:      "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		Namespace: NamespaceDynamic,
		Region:    RegionUS,
	}
	expected := url.URL{
		Scheme:   "https",
		Host:     "us.api.blizzard.com",
		Path:     "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		RawQuery: "locale=en_US&namespace=dynamic-us",
	}
	actual := request.String()
	if actual != expected.String() {
		t.Errorf("Expected %s, got %s", expected.String(), actual)
	}
}

func TestRequestToUrl(t *testing.T) {
	request := BnetRequest{
		Path:      "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		Namespace: NamespaceDynamic,
		Region:    RegionUS,
	}
	expected := url.URL{
		Scheme:   "https",
		Host:     "us.api.blizzard.com",
		Path:     "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		RawQuery: "locale=en_US&namespace=dynamic-us",
	}
	actual := request.Url()
	if *actual != expected {
		t.Errorf("Expected %s, got %s", expected.String(), actual.String())
	}
}

func TestRequestToHttpRequest(t *testing.T) {
	request := BnetRequest{
		Path:      "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		Namespace: NamespaceDynamic,
		Region:    RegionUS,
	}
	actual, err := request.HttpRequest("TEST_TOKEN")
	if err != nil {
		t.Errorf("Expected no error, got %s", err.Error())
	}
	if actual.Method != "GET" {
		t.Errorf("Expected GET, got %s", actual.Method)
	}

	expectedUrl := url.URL{
		Scheme:   "https",
		Host:     "us.api.blizzard.com",
		Path:     "/data/wow/pvp-season/35/pvp-leaderboard/3v3",
		RawQuery: "locale=en_US&namespace=dynamic-us",
	}
	if *actual.URL != expectedUrl {
		t.Errorf("Expected %s, got %s", expectedUrl.String(), actual.URL.String())
	}

	expectedAuthHeader := "Bearer TEST_TOKEN"
	if actual.Header.Get("Authorization") != expectedAuthHeader {
		t.Errorf("Expected %s, got %s", expectedAuthHeader, actual.Header.Get("Authorization"))
	}

	expectedAcceptHeader := "application/json"
	if actual.Header.Get("Accept") != expectedAcceptHeader {
		t.Errorf("Expected %s, got %s", expectedAcceptHeader, actual.Header.Get("Accept"))
	}
}

func TestRequestFromUrl(t *testing.T) {
	rawUrl := "https://us.api.blizzard.com/data/wow/talent-tree/850?namespace=static-10.1.7_51059-us"
	expected := BnetRequest{
		Path:      "/data/wow/talent-tree/850",
		Namespace: NamespaceStatic,
		Region:    RegionUS,
	}
	actual, err := RequestFromUrl(rawUrl)
	if err != nil {
		t.Errorf("Expected no error, got %s", err.Error())
	}

	if actual.Path != expected.Path {
		t.Errorf("Expected %s, got %s", expected.Path, actual.Path)
	}

	if actual.Namespace != expected.Namespace {
		t.Errorf("Expected %s, got %s", expected.Namespace, actual.Namespace)
	}

	if actual.Region != expected.Region {
		t.Errorf("Expected %s, got %s", expected.Region, actual.Region)
	}
}
