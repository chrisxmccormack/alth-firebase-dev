# **App Name**: AlethiumCoreAuth

## Core Features:

- User Registration: User registration with email, first name, last name, and password. Uses Firebase's `createUserWithEmailAndPassword` to create user accounts.
- Firestore User Data: Write user data to Firestore `/users/{uid}` document immediately after account creation. Stores user details (firstName, lastName, email) and default permissions (buyer, seller, admin).
- Email/Password Login: Email and password login functionality.
- Google Sign-in: "Sign in with Google" button using Firebase Authentication.
- Microsoft Sign-in: "Sign in with Microsoft" button using Firebase Authentication.
- Dashboard Route: Route to `/dashboard` upon successful authentication.
- Authentication Context: `AuthContext` provides current user info and auth loading status

## Style Guidelines:

- Primary color: Strong purple (#9C27B0) for power and sophistication.
- Background color: Light lavender (#F3E5F5), subtly echoing the primary.
- Accent color: Darker violet (#6A1B9A), providing visual interest in a cohesive monochromatic way.
- Font: 'Nunito' (sans-serif). Note: currently only Google Fonts are supported.
- Clean and well-spaced layout to offer clarity. Login/register page fields should be stacked.  Dashboard greeting clearly displays the username and authentication status.
- Loading animations while authentication state changes (e.g., a subtle spinner on the login button).