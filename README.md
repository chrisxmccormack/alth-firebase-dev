# AlethiumCoreAuth

This is a Next.js application for user authentication using Firebase, with support for company accounts and an admin approval workflow. It also includes a contact management system with a secure invite-link feature.

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
7.  **Set the App's Base URL**: For invite links to work correctly, you must set the public URL of your application.
    - For local development, this is typically `http://localhost:9002`.
    - For a deployed application, use its public domain (e.g., `https://your-app.com`).
    - Set this value for `NEXT_PUBLIC_BASE_URL` in your `.env.local` file.

⚠️ **Important**: If you see a message like "Firebase: Error (auth/invalid-api-key)", it means your environment variables are missing or incorrect. Please ensure your `.env.local` file is correctly configured.

## Firebase Security Rules

This project includes Firestore security rules in the `firestore.rules` file. These rules are essential for protecting your data.

**Before running the app**, you must deploy these rules and configure the System Admin UID within them.

1.  **Install Firebase CLI**: If you don't have it, install the Firebase command-line tools:
    ```bash
    npm install -g firebase-tools
    ```
2.  **Login to Firebase**:
    ```bash
    firebase login
    ```
3.  **Configure Admin UID in Rules**:
    - Open the `firestore.rules` file.
    - Find the line with the placeholder `'YOUR_ADMIN_UID_HERE'`.
    - Replace the placeholder with the same System Admin UID you set in your `.env.local` file.
4.  **Deploy Rules**: From your project root, run:
    ```bash
    firebase deploy --only firestore:rules
    ```

### Authorized Domains

For social sign-in providers (like Google and Microsoft) and the invite-link flow to work correctly in a development or preview environment, you must add your app's domain to the list of authorized domains in Firebase.

1.  Go to the **Authentication -> Settings** tab in your Firebase project.
2.  Under "Authorized domains", click "Add domain".
3.  Add the domain of your development or preview environment (e.g., `localhost` for local development, or your preview URL from your hosting provider).

## Testing the Invite Flow

1.  **User A**: Sign up and create a company. Navigate to **/contacts**.
2.  Click "Invite Contact", select a relationship, and generate an invite link.
3.  Copy the generated link and then sign out.
4.  **User B**: Sign up with a different account and create a second company.
5.  Open the invite link from User A in your browser.
6.  You should see an invitation prompt. Click "Accept Invitation".
7.  You will be redirected to your **/contacts** page and should now see User A's company listed.
8.  Sign out and sign back in as **User A**. Navigate to **/contacts**. You should now see User B's company in your list as well.
