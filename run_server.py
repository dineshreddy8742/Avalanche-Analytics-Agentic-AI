#!/usr/bin/env python3
"""
Avalanche Voting Analytics - Easy Startup Script
==============================================
Run this script to start the server with all features enabled.
Perfect for VS Code development and hackathon demos.
"""

import eventlet
eventlet.monkey_patch()

import os
import sys
import subprocess
import time
import logging

def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import flask
        import pandas 
        import numpy
        import requests
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("📦 Installing dependencies...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements_minimal.txt"])
            print("✅ Dependencies installed successfully")
            return True
        except Exception as install_error:
            print(f"❌ Failed to install dependencies: {install_error}")
            return False

def start_server():
    """Start the Avalanche Voting Analytics server."""
    # Suppress harmless connection reset errors
    log = logging.getLogger('eventlet.wsgi')
    log.setLevel(logging.ERROR)

    try:
        # Import and run the enhanced API
        from enhanced_ai_api import app, socketio, analytics, start_enhanced_simulation
        
        print("🌐 Server starting on: http://localhost:8080")
        
        # Start the background threads
        start_enhanced_simulation()

        # Start the server
        socketio.run(
            app,
            host='0.0.0.0',
            port=8080,
            debug=False,
            allow_unsafe_werkzeug=True
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure port 8080 is available")
        print("   2. Check if all dependencies are installed")
        print("   3. Try running: python enhanced_ai_api.py")

def main():
    """Main startup function."""
    # Check current directory
    if not os.path.exists("enhanced_ai_api.py"):
        print("❌ Please run this script from the project root directory")
        print("💡 The directory should contain: enhanced_ai_api.py, index.html, style.css")
        return
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Cannot start server due to missing dependencies")
        return
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main()