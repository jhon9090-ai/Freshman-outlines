# Netlify Deployment Instructions

## Fixing Firebase Integration on Netlify

If you're experiencing issues with Firebase not working on your Netlify deployment, follow these steps to fix it:

### 1. Update Environment Variables in Netlify

The most common issue is that Netlify requires environment variables to use the `VITE_` prefix for Vite applications.

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** > **Build & deploy** > **Environment**
4. Add the following environment variables with your Firebase configuration values:

```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Trigger a New Deployment

After updating the environment variables, you need to trigger a new deployment:

1. Go to the **Deploys** tab in your Netlify dashboard
2. Click on **Trigger deploy** > **Deploy site**

### 3. Verify CORS Configuration

If you're still experiencing issues, make sure your Firebase project has the correct CORS configuration:

1. Go to the Firebase Console
2. Navigate to **Authentication** > **Settings** > **Authorized domains**
3. Add your Netlify domain (e.g., `intelligent-outlines.netlify.app`) to the list of authorized domains

### 4. Check Firestore Rules

Ensure your Firestore security rules are properly configured to allow authenticated users to access their data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /outlines/{outlineId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 5. Testing the Deployment

After making these changes and triggering a new deployment, test your application by:

1. Opening your Netlify site URL
2. Attempting to register or log in
3. Creating a new study outline and verifying it syncs to Firebase

If you continue to experience issues, check the browser console for specific error messages that can help identify the problem.