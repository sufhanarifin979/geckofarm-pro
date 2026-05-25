# Security Specification - GeckoFarm Pro

## Data Invariants
1. A gecko must have a valid `ownerId` matching the authenticated user's UID.
2. A pairing must have a valid `ownerId` matching the authenticated user's UID.
3. A clutch must have a valid `ownerId` matching the authenticated user's UID and belong to a valid pairing.
4. Activity and Weight logs must belong to a gecko owned by the authenticated user.
5. Users cannot modify their own `subscription` or `planLimit` unless they are an admin.
6. Users cannot increment their `geckoCount` beyond their `planLimit` (checked during creation).

## The Dirty Dozen Payloads

1. **Identity Spoofing (Gecko)**: Create a gecko with `ownerId` set to another user's UID.
2. **Identity Spoofing (User)**: Update another user's profile metadata.
3. **Privilege Escalation**: Update user profile to set `subscription` to "premium".
4. **ID Poisoning**: Create a gecko with a 2MB string as its ID.
5. **Shadow Field Injection**: Update a gecko adding a `isVerified: true` hidden field.
6. **Relational Orphan**: Create a clutch referring to a non-existent `pairingId`.
7. **Subcollection Bypass**: Write a weight log to a gecko owned by a different user.
8. **Resource Exhaustion**: Write a 1MB string to the `name` field of a gecko.
9. **Status Shortcutting**: Update a gecko status from "available" directly to "dead" without proper authorization (if there were state-based rules, but here we just check access).
10. **Admin Spoofing**: Attempt to write to the `admins` collection (if it existed) or use a rule that relies solely on email without verification.
11. **Negative Count**: Attempt to set `geckoCount` to -1.
12. **PII Leak**: Attempt to list all users to scrape emails.

## Test Runner (firestore.rules.test.ts snippet)
```typescript
// This is a conceptual test runner for the Dirty Dozen
describe('GeckoFarm Pro Security Rules', () => {
  it('should deny identity spoofing on gecko creation', async () => {
    const db = getFirestore(otherUserAuth);
    await assertFails(addDoc(collection(db, 'geckos'), { name: 'Fake', ownerId: 'victim-uid' }));
  });
  // ... and so on for all 12 payloads
});
```
