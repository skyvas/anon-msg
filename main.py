#!/usr/bin/env python3
"""
AnonMsg - Wasmer Edge WebAssembly HTTP Server & API Runtime
Zero-dependency edge server modeled for Wasmer WASIX execution.
Serves the Vite production frontend and provides full REST API endpoints.
"""

import base64
from datetime import datetime, timezone
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import re
import sys
from typing import Any, Dict, List, Optional
import urllib.parse
import uuid
from http.server import HTTPServer, SimpleHTTPRequestHandler


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = uuid.uuid4().hex[:16]
    pwd_hash = hashlib.sha256((password + salt).encode("utf-8")).hexdigest()
    return pwd_hash, salt


def verify_password(password: str, pwd_hash: str, salt: str) -> bool:
    expected, _ = hash_password(password, salt)
    return expected == pwd_hash


def sanitize_text(text: Optional[str]) -> str:
    if not text or not isinstance(text, str):
        return ""
    # Strip HTML tags
    clean = re.sub(r"<[^>]*>?", "", text).strip()
    return clean


class WasmerAnonMsgState:
    """In-memory state machine and datastore for Wasmer Edge execution."""

    def __init__(self):
        self.reset()

    def reset(self):
        default_hash, default_salt = hash_password("Password123!")

        self.users: List[dict] = [
            {
                "id": 1,
                "username": "alex_dev",
                "display_name": "Alex Rivers",
                "avatar_url": None,
                "bio": "Fullstack engineer and open-source tinkerer. Building modern web experiences.",
                "prompt": "Ask me anything about tech, career pivots, or what I really think of AI",
                "is_available": True,
                "password_hash": default_hash,
                "password_salt": default_salt,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": 2,
                "username": "maya_design",
                "display_name": "Maya Chen",
                "avatar_url": None,
                "bio": "Product Designer and design systems enthusiast. Typography and clean UI.",
                "prompt": "Send me honest portfolio critiques or design thoughts",
                "is_available": True,
                "password_hash": default_hash,
                "password_salt": default_salt,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": 3,
                "username": "sam_founder",
                "display_name": "Samir Patel",
                "avatar_url": None,
                "bio": "Founder and Angel Investor. Looking for wild ideas and fearless builders.",
                "prompt": "Pitch me an unhinged startup idea or ask for founder advice",
                "is_available": True,
                "password_hash": default_hash,
                "password_salt": default_salt,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": 4,
                "username": "elena_music",
                "display_name": "Elena Rostova",
                "avatar_url": None,
                "bio": "Indie producer and songwriter. Exploring synthwave and ambient soundscapes.",
                "prompt": "What song secretly moves you? Share your musical memories",
                "is_available": True,
                "password_hash": default_hash,
                "password_salt": default_salt,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": 5,
                "username": "kai_photo",
                "display_name": "Kai Tanaka",
                "avatar_url": None,
                "bio": "Street and portrait photographer based in Tokyo. Leica M shooter.",
                "prompt": "Tell me your favorite city street or an unforgettable visual memory",
                "is_available": True,
                "password_hash": default_hash,
                "password_salt": default_salt,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]

        self.user_counter = 5
        self.message_counter = 5
        self.tokens: Dict[str, int] = {}  # token -> user_id

        self.messages: List[dict] = [
            {
                "id": 1,
                "recipient_id": 1,
                "content": "I love how intuitive your open-source libraries are. Which stack do you predict will dominate 2027?",
                "is_anonymous": True,
                "sender_name": None,
                "is_read": False,
                "is_favorite": True,
                "ip_hash": "a1b2c3d4e5f6",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": 2,
                "recipient_id": 1,
                "content": "Honestly, that refactor you pushed yesterday saved our entire staging sprint! Huge thanks.",
                "is_anonymous": False,
                "sender_name": "Jordan T.",
                "is_read": True,
                "is_favorite": True,
                "ip_hash": "b2c3d4e5f6a1",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": 3,
                "recipient_id": 1,
                "content": "Secret confession: I still prefer simple SQL and relational models over distributed clusters for most apps.",
                "is_anonymous": True,
                "sender_name": None,
                "is_read": False,
                "is_favorite": False,
                "ip_hash": "c3d4e5f6a1b2",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": 4,
                "recipient_id": 2,
                "content": "Your dark theme color palette is genuinely stunning. What inspired the cyber violet tones?",
                "is_anonymous": False,
                "sender_name": "Liam Vance",
                "is_read": False,
                "is_favorite": True,
                "ip_hash": "d4e5f6a1b2c3",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": 5,
                "recipient_id": 2,
                "content": "I have a confession: I still copy button padding values from your public Figma files haha!",
                "is_anonymous": True,
                "sender_name": None,
                "is_read": True,
                "is_favorite": False,
                "ip_hash": "e5f6a1b2c3d4",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]

    def clean_user(self, user: dict) -> dict:
        return {
            "id": user["id"],
            "username": user["username"],
            "display_name": user["display_name"],
            "avatar_url": user.get("avatar_url"),
            "bio": user.get("bio", ""),
            "prompt": user.get("prompt", "Send me an anonymous note"),
            "is_available": user.get("is_available", True),
            "created_at": user.get("created_at")
        }

    def clean_users(self) -> List[dict]:
        return [self.clean_user(u) for u in self.users]

    def get_user_by_id(self, user_id: int) -> Optional[dict]:
        return next((u for u in self.users if u["id"] == user_id), None)

    def get_user_by_username(self, username: str) -> Optional[dict]:
        clean = username.lower().strip()
        return next((u for u in self.users if u["username"].lower() == clean), None)

    def authenticate(self, username: str, password: str) -> Optional[dict]:
        user = self.get_user_by_username(username)
        if not user:
            # Timing attack mitigation
            hash_password(password, "dummysalt1234567")
            return None
        if verify_password(password, user["password_hash"], user["password_salt"]):
            return user
        return None

    def create_token(self, user_id: int) -> str:
        token = uuid.uuid4().hex + uuid.uuid4().hex
        self.tokens[token] = user_id
        return token

    def get_user_from_token(self, token: Optional[str]) -> Optional[dict]:
        if not token or token not in self.tokens:
            return None
        user_id = self.tokens[token]
        user = self.get_user_by_id(user_id)
        if user:
            return self.clean_user(user)
        return None


STATE = WasmerAnonMsgState()


class WasmerEdgeHandler(SimpleHTTPRequestHandler):
    """Zero-dependency HTTP handler for Wasmer Edge WebAssembly execution."""

    def __init__(self, *args, **kwargs):
        self.root_dir = Path(__file__).resolve().parent
        self.dist_dir = self.root_dir / "dist"
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        sys.stderr.write(f"[WasmerEdge] {self.address_string()} - {format % args}\n")

    def _send_json(self, data: Any, status: int = 200, headers: Optional[dict] = None):
        body = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        if headers:
            for k, v in headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 0:
                raw = self.rfile.read(content_length).decode("utf-8")
                return json.loads(raw)
        except Exception:
            pass
        return {}

    def _get_auth_user(self) -> Optional[dict]:
        auth = self.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1].strip()
            return STATE.get_user_from_token(token)
        return None

    def _serve_file(self, file_path: Path):
        if not file_path.exists() or not file_path.is_file():
            # Fallback to SPA index.html
            index_path = self.dist_dir / "index.html"
            if index_path.exists():
                file_path = index_path
            else:
                self.send_error(404, "File Not Found")
                return

        mime_type, _ = mimetypes.guess_type(str(file_path))
        if not mime_type:
            mime_type = "application/octet-stream"

        try:
            with open(file_path, "rb") as fp:
                content = fp.read()
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(content)))
            if str(file_path).endswith((".js", ".css", ".svg", ".png", ".jpg", ".woff2")):
                self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            else:
                self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(content)
        except Exception as err:
            self.send_error(500, f"Error reading file: {err}")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD")
        self.end_headers()

    def do_HEAD(self):
        path = self.path.split("?")[0]
        if path in ("/", "/health", "/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json" if "health" in path else "text/html")
            self.end_headers()
        else:
            self.do_GET()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        raw_path = parsed.path

        # 1. Health Endpoints
        if raw_path in ("/health", "/api/health"):
            self._send_json({
                "status": "healthy",
                "database": "postgresql",
                "runtime": "wasmer-edge",
                "app": "anon-msg",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            return

        # 2. Public User Directory
        if raw_path == "/api/users":
            self._send_json({"users": STATE.clean_users()})
            return

        # Single user by username
        m_user = re.match(r"^/api/users/([a-zA-Z0-9_]+)$", raw_path)
        if m_user:
            username = m_user.group(1)
            user = STATE.get_user_by_username(username)
            if not user:
                self._send_json({"error": "User not found."}, 404)
                return
            self._send_json({"user": STATE.clean_user(user)})
            return

        # 3. Auth Current User
        if raw_path == "/api/auth/me":
            user = self._get_auth_user()
            if not user:
                self._send_json({"error": "Authentication required"}, 401)
                return
            self._send_json({"user": user})
            return

        # 4. Recipient Inbox
        if raw_path == "/api/messages/inbox":
            user = self._get_auth_user()
            if not user:
                self._send_json({"error": "Authentication required"}, 401)
                return

            recipient_id = user["id"]
            user_msgs = [m for m in STATE.messages if m["recipient_id"] == recipient_id]
            # Strip ip_hash for privacy
            clean_msgs = []
            for m in reversed(user_msgs):
                clean_msgs.append({
                    "id": m["id"],
                    "content": m["content"],
                    "is_anonymous": m["is_anonymous"],
                    "sender_name": m["sender_name"],
                    "is_read": m["is_read"],
                    "is_favorite": m["is_favorite"],
                    "created_at": m["created_at"]
                })

            total = len(clean_msgs)
            unread = len([m for m in clean_msgs if not m["is_read"]])
            anon_count = len([m for m in clean_msgs if m["is_anonymous"]])
            named_count = total - anon_count
            anon_ratio = round((anon_count / total) * 100) if total > 0 else 0

            stats = {
                "total": total,
                "unread": unread,
                "anonymous_count": anon_count,
                "named_count": named_count,
                "anonymous_ratio": anon_ratio
            }
            self._send_json({"messages": clean_msgs, "stats": stats})
            return

        # Block unhandled API routes from returning HTML
        if raw_path.startswith("/api/"):
            self._send_json({"error": "Not found"}, 404)
            return

        # Static Frontend Files (SPA Fallback)
        rel_path = raw_path.lstrip("/")
        if not rel_path:
            target_file = self.dist_dir / "index.html"
        else:
            target_file = self.dist_dir / rel_path

        self._serve_file(target_file)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        raw_path = parsed.path
        body = self._read_json()

        # 1. User Registration
        if raw_path == "/api/auth/register":
            username = body.get("username", "")
            display_name = body.get("display_name", "")
            password = body.get("password", "")

            if not username or not display_name or not password:
                self._send_json({"error": "Username, display name, and password are required."}, 400)
                return

            clean_user = username.strip().lower()
            if not re.match(r"^[a-z0-9_]{3,20}$", clean_user):
                self._send_json({"error": "Username must be 3-20 characters long."}, 400)
                return

            if len(password) < 8:
                self._send_json({"error": "Password must be at least 8 characters long."}, 400)
                return
            if len(password) > 128:
                self._send_json({"error": "Password cannot exceed 128 characters."}, 400)
                return
            if password.isspace():
                self._send_json({"error": "Password cannot consist solely of whitespace."}, 400)
                return

            if STATE.get_user_by_username(clean_user):
                self._send_json({"error": "That username is already taken. Please pick another."}, 409)
                return

            pwd_hash, pwd_salt = hash_password(password)
            STATE.user_counter += 1
            new_user = {
                "id": STATE.user_counter,
                "username": clean_user,
                "display_name": display_name.strip(),
                "avatar_url": body.get("avatar_url"),
                "bio": body.get("bio", "").strip(),
                "prompt": body.get("prompt", "Send me an anonymous note").strip(),
                "is_available": True,
                "password_hash": pwd_hash,
                "password_salt": pwd_salt,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            STATE.users.append(new_user)
            token = STATE.create_token(new_user["id"])
            self._send_json({"token": token, "user": STATE.clean_user(new_user)}, 201)
            return

        # 2. User Login
        if raw_path == "/api/auth/login":
            username = body.get("username", "")
            password = body.get("password", "")

            if not username or not password:
                self._send_json({"error": "Please enter both username and password."}, 400)
                return

            user = STATE.authenticate(username, password)
            if not user:
                self._send_json({"error": "Invalid username or password."}, 401)
                return

            token = STATE.create_token(user["id"])
            self._send_json({"token": token, "user": STATE.clean_user(user)}, 200)
            return

        # 3. Send Message
        if raw_path == "/api/messages":
            recipient_id = body.get("recipient_id")
            content = body.get("content", "")
            is_anonymous = body.get("is_anonymous", True)
            sender_name = body.get("sender_name")

            if not recipient_id:
                self._send_json({"error": "Recipient is required."}, 400)
                return

            try:
                r_id = int(recipient_id)
            except ValueError:
                self._send_json({"error": "Invalid recipient ID."}, 400)
                return

            recipient = STATE.get_user_by_id(r_id)
            if not recipient:
                self._send_json({"error": "Recipient user does not exist."}, 404)
                return

            if not recipient.get("is_available", True):
                self._send_json({"error": "This member is currently not accepting new messages."}, 403)
                return

            clean_content = sanitize_text(content)
            if not clean_content:
                self._send_json({"error": "Message content cannot be empty."}, 400)
                return
            if len(clean_content) > 500:
                self._send_json({"error": "Message cannot exceed 500 characters."}, 400)
                return

            final_anon = True
            final_name = None
            if is_anonymous is False:
                final_anon = False
                clean_name = sanitize_text(sender_name)
                final_name = clean_name[:50] if clean_name else "Anonymous"

            STATE.message_counter += 1
            new_msg = {
                "id": STATE.message_counter,
                "recipient_id": r_id,
                "content": clean_content,
                "is_anonymous": final_anon,
                "sender_name": final_name,
                "is_read": False,
                "is_favorite": False,
                "ip_hash": "wasmer_ip",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            STATE.messages.append(new_msg)

            self._send_json({
                "success": True,
                "message_id": new_msg["id"],
                "is_anonymous": final_anon,
                "sender_name": final_name
            }, 201)
            return

        self._send_json({"error": "Not found"}, 404)

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        raw_path = parsed.path
        body = self._read_json()

        # 1. Update User Profile
        if raw_path == "/api/users/profile":
            auth_user = self._get_auth_user()
            if not auth_user:
                self._send_json({"error": "Authentication required"}, 401)
                return

            user = STATE.get_user_by_id(auth_user["id"])
            if not user:
                self._send_json({"error": "User not found"}, 404)
                return

            if "display_name" in body:
                dn = sanitize_text(body["display_name"])
                if dn:
                    user["display_name"] = dn[:50]
            if "bio" in body:
                user["bio"] = sanitize_text(body["bio"])[:200]
            if "prompt" in body:
                p = sanitize_text(body["prompt"])
                if p:
                    user["prompt"] = p[:120]
            if "is_available" in body:
                user["is_available"] = bool(body["is_available"])

            self._send_json({"success": True, "user": STATE.clean_user(user)}, 200)
            return

        # 2. Mark Message as Read (Atomic IDOR Defense)
        m_read = re.match(r"^/api/messages/inbox/(\d+)/read$", raw_path)
        if m_read:
            auth_user = self._get_auth_user()
            if not auth_user:
                self._send_json({"error": "Authentication required"}, 401)
                return

            msg_id = int(m_read.group(1))
            msg = next((m for m in STATE.messages if m["id"] == msg_id and m["recipient_id"] == auth_user["id"]), None)
            if not msg:
                self._send_json({"error": "Message not found."}, 404)
                return

            new_read = bool(body.get("is_read", not msg["is_read"]))
            msg["is_read"] = new_read
            self._send_json({"success": True, "is_read": new_read}, 200)
            return

        # 3. Toggle Favorite (Atomic IDOR Defense)
        m_fav = re.match(r"^/api/messages/inbox/(\d+)/favorite$", raw_path)
        if m_fav:
            auth_user = self._get_auth_user()
            if not auth_user:
                self._send_json({"error": "Authentication required"}, 401)
                return

            msg_id = int(m_fav.group(1))
            msg = next((m for m in STATE.messages if m["id"] == msg_id and m["recipient_id"] == auth_user["id"]), None)
            if not msg:
                self._send_json({"error": "Message not found."}, 404)
                return

            msg["is_favorite"] = not msg["is_favorite"]
            self._send_json({"success": True, "is_favorite": msg["is_favorite"]}, 200)
            return

        self._send_json({"error": "Not found"}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        raw_path = parsed.path

        # Delete Message (Atomic IDOR Defense)
        m_del = re.match(r"^/api/messages/inbox/(\d+)$", raw_path)
        if m_del:
            auth_user = self._get_auth_user()
            if not auth_user:
                self._send_json({"error": "Authentication required"}, 401)
                return

            msg_id = int(m_del.group(1))
            msg = next((m for m in STATE.messages if m["id"] == msg_id and m["recipient_id"] == auth_user["id"]), None)
            if not msg:
                self._send_json({"error": "Message not found."}, 404)
                return

            STATE.messages = [m for m in STATE.messages if m["id"] != msg_id]
            self._send_json({"success": True, "message": "Message deleted successfully."}, 200)
            return

        self._send_json({"error": "Not found"}, 404)


def start():
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[AnonMsg] Wasmer Edge HTTP Server running on http://{host}:{port}")
    server = HTTPServer((host, port), WasmerEdgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()


if __name__ == "__main__":
    start()
