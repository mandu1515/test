import hmac
import os
import re
import secrets
import sqlite3
import time
from contextlib import closing
from pathlib import Path

from flask import Flask, redirect, render_template_string, request, send_from_directory, url_for

app = Flask(__name__)
DIST = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("BORAM_DB_PATH") or DIST / "users.db")
ASSETS = {"index.html", "app.js", "model.js", "styles.css"}


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# 처음 실행할 때 테이블 생성
with closing(get_db()) as conn:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS attendance_codes (
            store TEXT NOT NULL,
            method TEXT NOT NULL,
            code TEXT NOT NULL,
            issued_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            issue_count INTEGER NOT NULL,
            PRIMARY KEY (store, method)
        );
        CREATE TABLE IF NOT EXISTS attendance_otp_attempts (
            client TEXT NOT NULL,
            window INTEGER NOT NULL,
            attempts INTEGER NOT NULL,
            PRIMARY KEY (client, window)
        );
    """)


@app.get("/")
@app.get("/<asset>")
def frontend(asset="index.html"):
    if asset not in ASSETS:
        return "", 404
    return send_from_directory(DIST, asset)


@app.after_request
def prevent_code_caching(response):
    if request.path.startswith("/api/attendance/"):
        response.headers["Cache-Control"] = "no-store"
    return response


def attendance_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None
    store, method = data.get("store"), data.get("method")
    if not isinstance(store, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", store):
        return None
    if method not in ("OTP", "QR"):
        return None
    return data


@app.post("/api/attendance/issue")
def issue_attendance_code():
    admin_key = os.environ.get("BORAM_ATTENDANCE_ADMIN_KEY", "")
    if not admin_key:
        return {"error": "서버에 출퇴근 코드 발급 키를 설정해 주세요."}, 503
    if not hmac.compare_digest(admin_key.encode(), request.headers.get("X-Boram-Admin-Key", "").encode()):
        return {"error": "관리자 발급 키를 확인해 주세요."}, 403
    data = attendance_payload()
    if data is None:
        return {"error": "사업장 코드와 인증 방식을 확인해 주세요."}, 400
    store, method = data["store"].upper(), data["method"]
    seconds = data.get("seconds", 300)
    if type(seconds) is not int or not 30 <= seconds <= 3600:
        return {"error": "유효기간은 30~3600초로 설정해 주세요."}, 400
    with closing(get_db()) as conn, conn:
        conn.execute("BEGIN IMMEDIATE")
        previous = conn.execute(
            "SELECT code, issue_count FROM attendance_codes WHERE store = ? AND method = ?",
            (store, method),
        ).fetchone()
        if method == "OTP":
            number = secrets.randbelow(1_000_000)
            if previous and f"{number:06d}" == previous["code"]:
                number = (number + 1) % 1_000_000
            code = f"{number:06d}"
        else:
            code = "BORAM-" + secrets.token_urlsafe(24)
        now = int(time.time())
        expires = now + seconds
        count = previous["issue_count"] + 1 if previous else 1
        conn.execute(
            "INSERT OR REPLACE INTO attendance_codes VALUES (?, ?, ?, ?, ?, ?)",
            (store, method, code, now, expires, count),
        )
    return {"code": code, "issuedAt": now, "expiresAt": expires, "count": count}


@app.post("/api/attendance/verify")
def verify_attendance_code():
    data = attendance_payload()
    if data is None:
        return {"error": "사업장 코드와 인증 방식을 확인해 주세요."}, 400
    store, method = data["store"].upper(), data["method"]
    code = data.get("code")
    pattern = r"[0-9]{6}" if method == "OTP" else r"BORAM-[A-Za-z0-9_-]{32}"
    if not isinstance(code, str) or not re.fullmatch(pattern, code):
        return {"error": "인증 코드 형식을 확인해 주세요."}, 400
    with closing(get_db()) as conn, conn:
        if method == "OTP":
            conn.execute("BEGIN IMMEDIATE")
            window = int(time.time()) // 60
            client = request.remote_addr or ""
            conn.execute("DELETE FROM attendance_otp_attempts WHERE window < ?", (window,))
            attempts = conn.execute(
                "SELECT attempts FROM attendance_otp_attempts WHERE client = ? AND window = ?",
                (client, window),
            ).fetchone()
            if attempts and attempts["attempts"] >= 10:
                return {"error": "인증 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."}, 429
            conn.execute("""
                INSERT INTO attendance_otp_attempts VALUES (?, ?, 1)
                ON CONFLICT(client, window) DO UPDATE SET attempts = attempts + 1
            """, (client, window))
        active = conn.execute(
            "SELECT code, expires_at FROM attendance_codes WHERE store = ? AND method = ?",
            (store, method),
        ).fetchone()
        if not active or active["expires_at"] <= time.time() or not hmac.compare_digest(active["code"], code):
            return {"error": "인증 코드가 일치하지 않거나 만료됐습니다."}, 401
    return {"verified": True}


@app.get("/users")
def index():
    conn = get_db()
    try:
        users = conn.execute(
            "SELECT id, name FROM users ORDER BY id DESC"
        ).fetchall()
    finally:
        conn.close()

    return render_template_string("""
        <!doctype html>
        <html lang="ko">
        <meta charset="utf-8">
        <title>SQLite 웹 예제</title>

        <h1>사용자 등록</h1>
        <form action="/users" method="post">
            <input name="name" placeholder="이름" required maxlength="100">
            <button type="submit">저장</button>
        </form>

        <h2>사용자 목록</h2>
        <ul>
        {% for user in users %}
            <li>{{ user["id"] }}: {{ user["name"] }}</li>
        {% else %}
            <li>등록된 사용자가 없습니다.</li>
        {% endfor %}
        </ul>
        </html>
    """, users=users)


@app.post("/users")
def create_user():
    name = request.form.get("name", "").strip()

    if not name or len(name) > 100:
        return "이름은 1~100자로 입력하세요.", 400

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (name) VALUES (?)",
            (name,)
        )
        conn.commit()
    finally:
        conn.close()

    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(host=os.environ.get("BORAM_HOST", "127.0.0.1"))
