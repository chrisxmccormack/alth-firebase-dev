# AlethiumCoreAuth

This is a Next.js application for user authentication using Firebase, with support for company accounts and an admin approval workflow.

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
6.  **Set the System Admin UID**: You need to specify a Firebase User ID as the system administrator. This user will have access to the `/admin` panel.
    - Go to the **Authentication -> Users** tab in your Firebase project.
    - Copy the UID of the user you want to be the admin.
    - Paste it into the `NEXT_PUBLIC_SYSTEM_ADMIN_UID` variable in your `.env.local` file.

⚠️ **Important**: If you see a message like "Firebase: Error (auth/invalid-api-key)", it means your environment variables are missing or incorrect. Please ensure your `.env.local` file is correctly configured.

### Authorized Domains

For social sign-in providers (like Google and Microsoft) to work correctly in a development or preview environment, you must add your app's domain to the list of authorized domains in Firebase.

1.  Go to the **Authentication -> Settings** tab in your Firebase project.
2.  Under "Authorized domains", click "Add domain".
3.  Add the domain of your development or preview environment (e.g., `localhost` for local development, or your preview URL from your hosting provider).
