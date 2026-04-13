import requests
from duckduckgo_search import DDGS
import json

# Configuration
N8N_WEBHOOK_URL = "http://localhost:5678/webhook/leads-trigger" # Change this to your n8n production URL later
SEARCH_QUERY = "best innovative startups in London 2024"

def perform_free_search(query):
    print(f"Searching for: {query}...")
    results = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=10):
            results.append({
                "title": r['title'],
                "link": r['href'],
                "snippet": r['body']
            })
    return results

def send_to_n8n(data):
    try:
        response = requests.post(N8N_WEBHOOK_URL, json={"results": data})
        if response.status_code == 200:
            print("Successfully sent leads to n8n!")
        else:
            print(f"Failed to send to n8n. Status: {response.status_code}")
    except Exception as e:
        print(f"Error connecting to n8n: {e}")

if __name__ == "__main__":
    leads = perform_free_search(SEARCH_QUERY)
    if leads:
        send_to_n8n(leads)
    else:
        print("No leads found.")
