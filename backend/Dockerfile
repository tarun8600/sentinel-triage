FROM python:3.12-slim

WORKDIR /code

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Render / Railway / Fly inject $PORT; default 8000 for local runs
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
