# AI Toolkit

A free collection of simple AI writing tools — no account required.

**Live:** https://ai-toolkit-ebon-chi.vercel.app/

## Tools

* **Improve** — make text clearer, more formal, more casual, or more concise
* **Summarize** — create short, medium, or bullet-point summaries
* **Translate** — translate text into 11 languages
* **Email** — turn notes into ready-to-send emails

The toolkit also supports **Next Step**, allowing you to send the result of one tool directly into another without manually copying the text.

## Features

* Free to use
* No registration
* Mobile-first interface
* Gemini-powered AI
* 8,000 character input limit
* Server-side API key protection
* Per-IP rate limiting
* Input validation
* Production deployment on Vercel

## Architecture

```text
ai-toolkit/
├── client/       React + Vite frontend
├── server/       Express API
├── .env.example
└── README.md
```

The frontend never receives the Gemini API key.

The request flow is:

```text
Browser
   ↓
Vercel Frontend
   ↓
Express API
   ↓
Google Gemini
   ↓
Response
```

## Local development

### 1. Install dependencies

From the project root:

```bash
cd server
npm install
```

Then:

```bash
cd ../client
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root based on `.env.example`.

The server requires:

```env
GEMINI_API_KEY=your_gemini_api_key
```

For local development, the default backend port is:

```env
PORT=3001
```

### 3. Start the backend

From the `server` directory:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:3001
```

### 4. Start the frontend

In a second terminal:

```bash
cd client
npm run dev -- --host 127.0.0.1
```

The frontend runs on:

```text
http://127.0.0.1:5173
```

## Production

The frontend is deployed on Vercel:

https://ai-toolkit-ebon-chi.vercel.app/

The API is deployed separately:

https://ai-toolkit-api-orcin.vercel.app/

Health check:

```text
https://ai-toolkit-api-orcin.vercel.app/health
```

## Security

* The Gemini API key is kept on the server.
* The frontend never receives the API key.
* API requests are limited to 30 requests per 15 minutes per IP.
* Input is limited to 8,000 characters.
* Tool options are validated server-side.
* CORS is restricted to the production frontend.
* `.env` is excluded from Git.

## Project structure

| File                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `client/src/App.jsx`  | Main frontend UI and API client                               |
| `client/index.html`   | HTML document, metadata and fonts                             |
| `server/src/index.js` | Express API, validation, rate limiting and Gemini integration |
| `server/package.json` | Backend dependencies and scripts                              |
| `client/package.json` | Frontend dependencies and scripts                             |
| `.env.example`        | Environment variable template                                 |
| `.gitignore`          | Prevents secrets and dependencies from being committed        |

## Current status

AI Toolkit is currently deployed as a working MVP.

The production frontend, backend, Gemini integration, four AI tools, Next Step flow, mobile layout, CORS configuration, validation, and rate limiting have been tested.

## License

This project is currently provided as-is.
