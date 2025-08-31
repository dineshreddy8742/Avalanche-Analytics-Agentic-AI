import multiprocessing
import os

bind = os.getenv("GUNICORN_BIND", "0.0.0.0:8080")
worker_class = os.getenv("GUNICORN_WORKER_CLASS", "eventlet")
workers = int(os.getenv("GUNICORN_WORKERS", "4"))
worker_connections = int(os.getenv("GUNICORN_WORKER_CONNECTIONS", "1000"))
threads = int(os.getenv("GUNICORN_THREADS", "1"))
preload_app = True
keepalive = int(os.getenv("GUNICORN_KEEPALIVE", "2"))
loglevel = os.getenv("GUNICORN_LOGLEVEL", "info")
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
