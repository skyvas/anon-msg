"""
AnonMsg - Wasmer Edge WebAssembly Runtime Tests
Verifies that WasmerEdgeHandler serves static files and REST API endpoints.
"""

import json
import threading
import time
import urllib.error
import urllib.request
from http.server import HTTPServer
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import WasmerEdgeHandler, STATE


def run_tests():
    server = HTTPServer(("127.0.0.1", 0), WasmerEdgeHandler)
    host, port = server.server_address
    base_url = f"http://{host}:{port}"

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.3)

    passed = 0
    failed = 0

    def assert_test(condition, name):
        nonlocal passed, failed
        if condition:
            print(f"  [PASS] {name}")
            passed += 1
        else:
            print(f"  [FAIL] {name}")
            failed += 1

    print("=== Wasmer Edge Runtime Test Suite ===")

    try:
        # 1. Health check
        req = urllib.request.Request(f"{base_url}/api/health")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            assert_test(resp.status == 200 and data["runtime"] == "wasmer-edge", "Health probe returns wasmer-edge runtime")

        # 2. Public users list
        req = urllib.request.Request(f"{base_url}/api/users")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            assert_test(len(data["users"]) == 5, "Public directory returns 5 seed profiles")

        # 3. Static frontend root index.html
        req = urllib.request.Request(f"{base_url}/")
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode()
            assert_test(resp.status == 200 and '<div id="root"></div>' in html, "Serves compiled Vite index.html at root")

        # 4. SPA routing fallback for deep paths
        req = urllib.request.Request(f"{base_url}/u/alex_dev")
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode()
            assert_test(resp.status == 200 and '<div id="root"></div>' in html, "SPA fallback serves index.html for /u/alex_dev")

        # 5. Send anonymous message
        msg_payload = json.dumps({
            "recipient_id": 1,
            "content": "Automated Wasmer test note",
            "is_anonymous": True
        }).encode("utf-8")
        req = urllib.request.Request(f"{base_url}/api/messages", data=msg_payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            assert_test(resp.status == 201 and data["is_anonymous"] is True, "Send anonymous note returns 201")
            msg_id = data["message_id"]

        # 6. User registration
        reg_payload = json.dumps({
            "username": "wasmer_tester",
            "display_name": "Wasmer Tester",
            "password": "Password123!"
        }).encode("utf-8")
        req = urllib.request.Request(f"{base_url}/api/auth/register", data=reg_payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            assert_test(resp.status == 201 and "token" in data, "User registration succeeds with token")
            token = data["token"]

        # 7. Authenticated /api/auth/me
        req = urllib.request.Request(f"{base_url}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            assert_test(resp.status == 200 and data["user"]["username"] == "wasmer_tester", "Authenticated /me returns correct user")

        # 8. Unauthenticated inbox returns 401
        try:
            req = urllib.request.Request(f"{base_url}/api/messages/inbox")
            urllib.request.urlopen(req)
            assert_test(False, "Unauthenticated inbox returns 401")
        except urllib.error.HTTPError as err:
            assert_test(err.code == 401, "Unauthenticated inbox returns 401")

        # 9. Atomic IDOR protection (attempt to delete another user's message)
        try:
            req = urllib.request.Request(f"{base_url}/api/messages/inbox/{msg_id}", headers={"Authorization": f"Bearer {token}"}, method="DELETE")
            urllib.request.urlopen(req)
            assert_test(False, "IDOR attack to delete message returns 404")
        except urllib.error.HTTPError as err:
            assert_test(err.code == 404, "IDOR attack to delete message returns 404")

        print("=======================================")
        print(f"Wasmer Tests: {passed} Passed, {failed} Failed")
        print("=======================================\n")
        return failed == 0

    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
