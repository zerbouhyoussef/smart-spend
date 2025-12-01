# Smart Spend Manager

A smart budgeting application that helps you plan your purchases, track actual spending, and get AI-powered financial advice.

## Features
-   **Budget Planning**: Set a monthly budget and plan items to buy.
-   **Spending Log**: Track actual expenses and link them to planned items.
-   **Smart Insights**:
    -   **AI Advisor**: Get personalized financial tips powered by Google Gemini.
    -   **Real-time Updates**: Optimistic UI for instant feedback.
    -   **Auto-Calculation**: Automatically calculates costs when logging planned items.
-   **Performance**: Server-side caching and rate limiting.

## Tech Stack
-   **Frontend**: React, Vite, TypeScript, Tailwind CSS.
-   **Backend**: Node.js, Express.
-   **Database**: PostgreSQL.
-   **AI**: Google Gemini API.
-   **DevOps**: Docker, Docker Compose.

## Prerequisites
-   **Node.js** (v18+)
-   **PostgreSQL** (or use Docker)
-   **Google Gemini API Key**

## Getting Started

### Option 1: Docker (Recommended)
Run the entire application (Frontend + Backend) with one command.

1.  **Configure Environment**:
    -   Ensure `server/.env` has your `DATABASE_URL` and `API_KEY`.
    -   Ensure `client/.env` has `VITE_API_URL=http://localhost:3001/api`.
2.  **Run**:
    ```bash
    docker-compose up --build
    ```
3.  **Access**:
    -   Frontend: [http://localhost:3000](http://localhost:3000)
    -   Backend: [http://localhost:3001](http://localhost:3001)

### Option 2: Local Development
Run the frontend and backend individually for development.

1.  **Install Dependencies**:
    ```bash
    npm run install-all
    ```
2.  **Database Setup**:
    -   Ensure PostgreSQL is running.
    -   Update `server/.env` with your `DATABASE_URL`.
    -   Run the setup script:
        ```bash
        npm run setup-db
        ```
3.  **Start App**:
    ```bash
    npm run dev
    ```
    -   This runs both client and server concurrently.
    -   Client: [http://localhost:5173](http://localhost:5173) (Vite default)
    -   Server: [http://localhost:3001](http://localhost:3001)

## Environment Variables

### Server (`server/.env`)
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
API_KEY=your_google_gemini_api_key
NODE_TLS_REJECT_UNAUTHORIZED=0 (Optional: for self-signed certs)
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```
