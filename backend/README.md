# Society Setu API

Requires Node.js 24 or newer and PostgreSQL 13 or newer. Run these commands from the backend directory.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to an existing PostgreSQL database. Use a database role with schema creation privileges for migrations.
3. Run `npm run migrate`.
4. Run `npm run provision -- admin@example.com "My Society"` with a password of at least 12 characters supplied on standard input. The command creates an account, a society, and its administrator membership together.
5. Run `npm run dev`. The API listens on `http://127.0.0.1:8000` by default.

Send `POST /v1/auth/login` with JSON containing `email` and `password`. Pass the returned `accessToken` as `Authorization: Bearer <token>` to `GET /v1/societies`. The result contains the societies the account belongs to and its role in each. Sessions expire after 24 hours.

Run `npm test` to exercise the HTTP flow with an in-memory database substitute.
