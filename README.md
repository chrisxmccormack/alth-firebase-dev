# AlethiumCoreAuth

This is a Next.js application for user authentication using Firebase.

## Getting Started

First, install the dependencies:
```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Environment Variables

This project uses Firebase for authentication and database services. You need to set up a Firebase project and create a web app to get your credentials.

1.  Copy the example environment file:
    ```bash
    cp .env.local.example .env.local
    ```
2.  Open your Firebase project in the [Firebase Console](https://console.firebase.google.com/).
3.  Go to **Project settings** (the gear icon).
4.  In the "Your apps" card, select your web app.
5.  Find the `firebaseConfig` object and copy the values into your `.env.local` file.

⚠️ **Important**: If you see a message like "Firebase: Error (auth/invalid-api-key)", it means your environment variables are missing or incorrect. Please ensure your `.env.local` file is correctly configured.
