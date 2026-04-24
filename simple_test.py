#!/usr/bin/env python3
"""
Simple Backend Test for debugging
"""

import requests
import json
import os

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://14555cf3-e784-4bbd-9041-24f9df77db87.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

def test_simple():
    print("Testing API endpoints...")
    
    # Test health check
    try:
        response = requests.get(f"{API_BASE}/", timeout=30)
        print(f"Health check: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Health check error: {e}")
    
    # Test registration
    try:
        data = {"name": "Test User 2", "email": "test2@example.com", "password": "test123"}
        response = requests.post(f"{API_BASE}/register", json=data, timeout=30)
        print(f"Registration: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Registration error: {e}")
    
    # Test protected route
    try:
        response = requests.get(f"{API_BASE}/workspaces", timeout=30)
        print(f"Workspaces (no auth): {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Workspaces error: {e}")

if __name__ == "__main__":
    test_simple()