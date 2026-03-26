from fastapi.testclient import TestClient
from main import app
import os

# Mock environment variables
os.environ["GOOGLE_CLIENT_ID"] = "test-id"
os.environ["GOOGLE_CLIENT_SECRET"] = "test-secret"

client = TestClient(app)

print("\n--- Testing Redirect URI Generation ---")

# 1. Test without APP_BASE_URL (Localhost detection)
if "APP_BASE_URL" in os.environ:
    del os.environ["APP_BASE_URL"]

# We hit the login endpoint
# Note: Google redirect happens via a Location header
response = client.get("/users/login/google", follow_redirects=False)

if response.status_code == 302:
    location = response.headers.get("Location", "")
    print(f"Full Google Auth URL: {location}")
    if "redirect_uri=" in location:
        # Extract the redirect_uri part
        parts = location.split("redirect_uri=")
        redirect_uri = parts[1].split("&")[0].replace("%3A", ":").replace("%2F", "/")
        print(f"EXTRACTED REDIRECT_URI: {redirect_uri}")
    else:
        print("No redirect_uri found in Location header!")
else:
    print(f"Failed to get redirect. Status: {response.status_code}")
    print(response.text)

# 2. Test with explicit APP_BASE_URL
print("\n--- Testing with APP_BASE_URL=http://localhost:8000 ---")
os.environ["APP_BASE_URL"] = "http://localhost:8000"
response = client.get("/users/login/google", follow_redirects=False)
if response.status_code == 302:
    location = response.headers.get("Location")
    parts = location.split("redirect_uri=")
    redirect_uri = parts[1].split("&")[0].replace("%3A", ":").replace("%2F", "/")
    print(f"EXTRACTED REDIRECT_URI: {redirect_uri}")
