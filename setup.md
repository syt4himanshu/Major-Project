# Public Distribution System (PDS)

This project is a modern web-based Public Distribution System (PDS) designed to streamline food grain distribution. It consists of three main components:

*   **Admin Panel (`pds-admin`):** A React-based single-page application for administrative tasks, such as managing shopkeepers, beneficiaries, and entitlements.
*   **Shopkeeper App (`pds-shopkeeper`):** A React-based single-page application for shopkeepers to handle ration distribution. It features QR code scanning for quick and secure verification of beneficiaries.
*   **Backend Server (`pds-backend`):** A Node.js and Express server that provides a RESTful API to support the admin panel and shopkeeper app. It handles business logic, database interactions, and authentication.

## Setup Instructions

### Backend (`pds-backend`)

1.  Navigate to the `pds-backend` directory:
    ```bash
    cd pds-backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your database credentials and other environment variables.

4.  Seed the database with an admin user:
    ```bash
    npm run seed:admin
    ```

5.  Start the development server:
    ```bash
    npm run dev
    ```
    The backend will be running on the port specified in your `.env` file.

### Admin Panel (`pds-admin`)

1.  Navigate to the `pds-admin` directory:
    ```bash
    cd pds-admin
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The admin panel will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

### Shopkeeper App (`pds-shopkeeper`)

1.  Navigate to the `pds-shopkeeper` directory:
    ```bash
    cd pds-shopkeeper
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The shopkeeper app will be accessible at `http://localhost:5174` (or another port if 5174 is in use).
