#!/usr/bin/env python3
"""
Focused Backend Testing for Task Management System
Tests core API functionality
"""

import requests
import json
import os
from datetime import datetime, timedelta

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://14555cf3-e784-4bbd-9041-24f9df77db87.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

def test_backend_functionality():
    """Test core backend functionality"""
    print("🚀 Testing Task Management Backend API")
    print(f"API Base: {API_BASE}")
    print("=" * 60)
    
    results = []
    
    # 1. Test API Health Check
    print("\n1. Testing API Health Check...")
    try:
        response = requests.get(f"{API_BASE}/", timeout=30)
        if response.status_code == 200:
            print("✅ API Health Check - PASS")
            results.append(("API Health Check", True))
        else:
            print("❌ API Health Check - FAIL")
            results.append(("API Health Check", False))
    except Exception as e:
        print(f"❌ API Health Check - FAIL: {e}")
        results.append(("API Health Check", False))
    
    # 2. Test User Registration
    print("\n2. Testing User Registration...")
    try:
        import time
        unique_email = f"testbackend{int(time.time())}@example.com"
        user_data = {
            "name": "Test User Backend",
            "email": unique_email,
            "password": "test123"
        }
        response = requests.post(f"{API_BASE}/register", json=user_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if 'user' in data and 'workspace' in data:
                print("✅ User Registration - PASS")
                print(f"   User ID: {data['user']['id']}")
                print(f"   Workspace ID: {data['workspace']['id']}")
                results.append(("User Registration", True))
                user_id = data['user']['id']
                workspace_id = data['workspace']['id']
            else:
                print("❌ User Registration - FAIL: Missing user or workspace")
                results.append(("User Registration", False))
                return results
        else:
            print(f"❌ User Registration - FAIL: Status {response.status_code}")
            results.append(("User Registration", False))
            return results
    except Exception as e:
        print(f"❌ User Registration - FAIL: {e}")
        results.append(("User Registration", False))
        return results
    
    # 3. Test Duplicate Registration
    print("\n3. Testing Duplicate Registration Prevention...")
    try:
        response = requests.post(f"{API_BASE}/register", json=user_data, timeout=30)
        if response.status_code == 400:
            print("✅ Duplicate Registration Prevention - PASS")
            results.append(("Duplicate Registration Prevention", True))
        else:
            print("❌ Duplicate Registration Prevention - FAIL")
            results.append(("Duplicate Registration Prevention", False))
    except Exception as e:
        print(f"❌ Duplicate Registration Prevention - FAIL: {e}")
        results.append(("Duplicate Registration Prevention", False))
    
    # 4. Test Input Validation
    print("\n4. Testing Input Validation...")
    try:
        invalid_data = {"name": "Test", "email": "", "password": ""}
        response = requests.post(f"{API_BASE}/register", json=invalid_data, timeout=30)
        if response.status_code == 400:
            print("✅ Input Validation - PASS")
            results.append(("Input Validation", True))
        else:
            print("❌ Input Validation - FAIL")
            results.append(("Input Validation", False))
    except Exception as e:
        print(f"❌ Input Validation - FAIL: {e}")
        results.append(("Input Validation", False))
    
    # 5. Test Authentication Protection
    print("\n5. Testing Authentication Protection...")
    try:
        response = requests.get(f"{API_BASE}/workspaces", timeout=30)
        if response.status_code == 401:
            print("✅ Authentication Protection - PASS")
            results.append(("Authentication Protection", True))
        else:
            print("❌ Authentication Protection - FAIL")
            results.append(("Authentication Protection", False))
    except Exception as e:
        print(f"❌ Authentication Protection - FAIL: {e}")
        results.append(("Authentication Protection", False))
    
    # 6. Test Protected Endpoints (should all return 401)
    print("\n6. Testing Protected Endpoints...")
    protected_endpoints = [
        ("GET", "/workspaces"),
        ("POST", "/workspaces"),
        ("GET", f"/workspaces/{workspace_id}"),
        ("GET", f"/workspaces/{workspace_id}/projects"),
        ("POST", f"/workspaces/{workspace_id}/projects"),
        ("GET", "/projects/test-id/boards"),
        ("POST", "/projects/test-id/boards"),
        ("GET", "/boards/test-id"),
        ("POST", "/columns/test-id/tasks"),
        ("PUT", "/tasks/test-id"),
        ("POST", "/tasks/test-id/move"),
        ("DELETE", "/tasks/test-id"),
        ("GET", "/tasks/test-id/subtasks"),
        ("POST", "/tasks/test-id/subtasks"),
        ("PATCH", "/subtasks/test-id"),
        ("GET", "/tasks/test-id/comments"),
        ("POST", "/tasks/test-id/comments"),
        ("GET", f"/workspaces/{workspace_id}/calendar"),
        ("GET", f"/workspaces/{workspace_id}/analytics")
    ]
    
    protected_pass = 0
    for method, endpoint in protected_endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", timeout=30)
            elif method == "POST":
                response = requests.post(f"{API_BASE}{endpoint}", json={}, timeout=30)
            elif method == "PUT":
                response = requests.put(f"{API_BASE}{endpoint}", json={}, timeout=30)
            elif method == "DELETE":
                response = requests.delete(f"{API_BASE}{endpoint}", timeout=30)
            elif method == "PATCH":
                response = requests.patch(f"{API_BASE}{endpoint}", json={}, timeout=30)
            
            if response.status_code == 401:
                protected_pass += 1
            else:
                print(f"   ⚠️  {method} {endpoint} returned {response.status_code} instead of 401")
        except Exception as e:
            print(f"   ❌ {method} {endpoint} failed: {e}")
    
    if protected_pass == len(protected_endpoints):
        print(f"✅ Protected Endpoints - PASS ({protected_pass}/{len(protected_endpoints)})")
        results.append(("Protected Endpoints", True))
    else:
        print(f"❌ Protected Endpoints - FAIL ({protected_pass}/{len(protected_endpoints)})")
        results.append(("Protected Endpoints", False))
    
    # 7. Test Route Not Found (returns 401 due to authentication check first)
    print("\n7. Testing Route Behavior...")
    try:
        response = requests.get(f"{API_BASE}/nonexistent-route", timeout=30)
        if response.status_code == 401:
            print("✅ Route Behavior - PASS (401 for unauthenticated access to any route)")
            results.append(("Route Behavior", True))
        else:
            print("❌ Route Behavior - FAIL")
            results.append(("Route Behavior", False))
    except Exception as e:
        print(f"❌ Route Behavior - FAIL: {e}")
        results.append(("Route Behavior", False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 All backend tests passed!")
    else:
        print("⚠️  Some backend tests failed.")
    
    return results

if __name__ == "__main__":
    test_backend_functionality()