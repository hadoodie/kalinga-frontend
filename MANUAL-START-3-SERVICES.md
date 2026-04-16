# Manual Startup: Core 3 Services

Run each of these commands in a separate terminal window:

---

## 1. Laravel Backend (API)

```
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

---

## 2. Node.js Backend (API)

```
cd node-backend
node server.js
```

---

## 3. Vite Frontend (React)

```
npm run dev
```

---

After running all three, your services will be available at:
- Laravel  → http://127.0.0.1:8000
- Node API → http://localhost:5000
- Vite     → http://localhost:4000
