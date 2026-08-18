#!/usr/bin/env python3
"""Локальный сервер для SQL-курса.

Раздаёт файлы курса по HTTP и открывает браузер.
Нужен, потому что file:// блокирует ES-модули и WASM (движок Postgres).

Запуск:
    python3 serve.py           # порт 8000
    python3 serve.py 8080      # другой порт

Остановить — Ctrl+C.
"""
import http.server
import os
import sys
import webbrowser
from functools import partial

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))  # папка, где лежит этот файл


class Handler(http.server.SimpleHTTPRequestHandler):
    """Как обычный статический сервер, но с явным charset=utf-8,
    чтобы браузер не путал кодировку кириллицы."""
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
    }


def main():
    handler = partial(Handler, directory=ROOT)
    url = f"http://localhost:{PORT}/index.html"
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    except OSError:
        print(f"Порт {PORT} занят. Попробуй другой: python3 serve.py 8080")
        sys.exit(1)
    with server as httpd:
        print(f"SQL-курс запущен:  {url}")
        print("Остановить — Ctrl+C, или просто закрой это окно.")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nОстановлено.")


if __name__ == "__main__":
    main()
