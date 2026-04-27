# COGITO Login Fix - Complete Progress Tracker (Firebase Error Fix)

## Status
Previous fixes [x] complete. Current: Fixing Firebase errors (missing API key, persistence, user creation) for hamada.laidi.14@gmail.com/ldldld and all users.

## Detailed Steps:
1. [ ] **Firebase Setup Verification**
   - Go to Firebase Console > cogi-26845 > Authentication > Sign-in method > Enable Email/Password
   - Project Settings > General > Web SDK config > Copy VITE_API_KEY to .env
2. [ ] **Add Auth Persistence** - edit src/lib/firebase.js
3. [ ] **Fix Login UX** - edit src/components/Login/Login.jsx (no reload)
4. [ ] **Fix ESLint in Chat.jsx** 
5. [ ] **Create .env.example** (template)
6. [ ] **Test Account Creation/Login**
   - Register: hamada.laidi.14@gmail.com / ldldld
   - Login
   - Check console/Firestore
7. [ ] **Verify Persistence** - reload page, stays logged
8. [ ] **Cleanup & Completion**

## Commands to Run
```
npm run dev
```

## Expected Toasts on Error
- 'auth/invalid-credential': API key missing
- 'auth/user-not-found': Register first
- 'auth/wrong-password': Wrong pwd

**Next:** User confirm Firebase Console setup, then I proceed to code edits.

