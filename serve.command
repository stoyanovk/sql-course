#!/bin/bash
# Двойной клик в Finder (macOS) — запускает SQL-курс.
# Вся логика в serve.py; этот файл нужен только ради двойного клика.
cd "$(dirname "$0")" || exit 1
python3 serve.py
