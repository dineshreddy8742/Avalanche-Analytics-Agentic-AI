#!/usr/bin/env python3
"""
Avalanche Analytics - Local Dev Runner (port 8080)
- For local development only. In production use Gunicorn.
"""

import logging
import os
import subprocess
import sys

import eventlet

eventlet.monkey_patch()


def check_dependencies() -> bool:
    try:
        import flask  # noqa: F401
        import pandas  # noqa: F401
        import numpy  # noqa: F401
        import requests  # noqa: F401
        print("✅ Dependencies present")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("📦 Installing dependencies from requirements.txt ...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])  # noqa: S603,S607
            print("✅ Dependencies installed successfully")
            return True
        except Exception as install_error:
            print(f"❌ Failed to install dependencies: {install_error}")
            return False


def start_server():
    log = logging.getLogger("eventlet.wsgi")
    log.setLevel(logging.ERROR)
    from enhanced_ai_api import app, socketio, start_enhanced_simulation

    port = int(os.getenv("PORT", "8080"))
    print(f"🌐 Dev server starting on http://localhost:{port}")
    start_enhanced_simulation()
    socketio.run(app, host="0.0.0.0", port=port, debug=True, allow_unsafe_werkzeug=True)


def main():
    if not os.path.exists("enhanced_ai_api.py"):
        print("❌ Run this script from the project root directory")
        return
    if not check_dependencies():
        return
    start_server()


if __name__ == "__main__":
    main()
