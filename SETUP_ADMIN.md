# User Setup Guide

## Firebase Configuration

This project supports two types of users:
- **Admin users**: Access the web dashboard (this Next.js app)
- **Regular users**: Access the Flutter mobile app

### 1. Deploy Firestore Security Rules

Deploy the `firebase.rules` file to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

### 2. Create Admin User (Web Dashboard)

You need to create an admin user in Firebase Authentication and Firestore.

#### Option A: Using Firebase Console

1. **Create user in Firebase Authentication:**
   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Add email: `admin@water-management.com` (or your preferred email)
   - Set a password
   - Note the User UID

2. **Create user document in Firestore:**
   - Go to Firebase Console → Firestore Database
   - Create a collection named `users`
   - Create a document with ID = User UID from step 1
   - Add the following fields:
     ```
     {
       "role": "admin",
       "name": "Admin User",
       "email": "admin@water-management.com",
       "createdAt": <timestamp>
     }
     ```

#### Option B: Using Firebase Admin SDK (Node.js script)

Create a file `create-admin.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: 'admin@water-management.com',
      password: 'YourSecurePassword123!',
      displayName: 'Admin User',
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      role: 'admin',
      name: 'Admin User',
      email: 'admin@water-management.com',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Admin user created successfully!');
    console.log('UID:', userRecord.uid);
    console.log('Email:', userRecord.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
```

Run the script:
```bash
node create-admin.js
```

### 3. Create Regular Users (Flutter App)

Regular users should be created through your Flutter app's registration flow. When creating a user, ensure the Firestore document has:

```javascript
{
  "role": "user",
  "name": "User Name",
  "email": "user@example.com",
  "phoneNumber": "+1234567890", // optional
  "createdAt": <timestamp>
}
```

#### Manual Creation (if needed):

1. Create user in Firebase Authentication
2. Create document in Firestore `users` collection with `role: "user"`

### 4. Login Credentials

**Admin (Web Dashboard):**
- **Username:** `admin@water-management.com` (or just `admin`)
- **Password:** The password you set in step 2

**Regular Users (Flutter App):**
- Use their registered email and password

## Firestore Security Rules Explanation

The rules support different access levels:

### For Admin Users (`role: "admin"`):
- ✅ Full access to all data
- ✅ Can read/write admin-specific collections
- ✅ Can read/write all user data
- ✅ Can access water readings and analytics

### For Regular Users (`role: "user"`):
- ✅ Can read their own user document
- ✅ Can read/write their own water readings (`water_readings` collection)
- ✅ Can read/write their own user data (`user_data/{userId}` subcollections)
- ❌ Cannot access other users' data
- ❌ Cannot access admin collections

### Collection Structure:

```
firestore/
├── users/
│   └── {userId}
│       ├── role: "admin" | "user"
│       ├── name: string
│       ├── email: string
│       └── createdAt: timestamp
│
├── admin/                    # Admin-only collections
│   └── ...
│
├── water_readings/           # Water usage readings
│   └── {readingId}
│       ├── userId: string
│       ├── reading: number
│       ├── timestamp: timestamp
│       └── ...
│
└── user_data/                # User-specific data
    └── {userId}/
        └── ...
```

## Security Notes

1. The Firebase rules ensure proper role-based access control
2. Users can only read their own user document
3. All writes to the users collection should be done through admin SDK or Cloud Functions
4. Regular users can only access their own data
5. Admins have full access to all collections
6. Consider implementing additional security measures:
   - Two-factor authentication
   - IP whitelisting for admin access
   - Session timeout
   - Password complexity requirements
   - Rate limiting

## Testing

### Web Dashboard (Admin):
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click the "Login" button
4. Enter admin credentials
5. You should be redirected to the dashboard

### Flutter App (Regular Users):
1. Ensure Firebase is configured in your Flutter app
2. Users should register/login through the Flutter app
3. They will have `role: "user"` in Firestore
4. They can access their own data but not admin features

## Troubleshooting

- **"User data not found"**: Make sure the user document exists in Firestore with the correct UID
- **"Access denied" (Web)**: Check that the user document has `role: "admin"`
- **"Access denied" (Flutter)**: Check that the user document has `role: "user"`
- **"Invalid username or password"**: Verify credentials in Firebase Authentication console
- **Rules error**: Make sure you deployed the Firestore rules using `firebase deploy --only firestore:rules`
- **Permission denied on specific collection**: Check that your collection follows the naming convention in the rules

## Adding New Collections

When adding new collections, update the `firebase.rules` file to specify access patterns:

```javascript
// Example: For a new "notifications" collection
match /notifications/{notificationId} {
  // Users can read their own notifications
  allow read: if isUser() && resource.data.userId == request.auth.uid;
  // Admins can read all notifications
  allow read: if isAdmin();
  // Only admins can write
  allow write: if isAdmin();
}
```
