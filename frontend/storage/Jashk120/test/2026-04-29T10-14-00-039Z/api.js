```javascript
/**
 * Fetches a user record from the API by their unique identifier.
 *
 * @param userId - The unique identifier of the user.
 * @returns A promise that resolves to the user object (parsed JSON).
 */
async function fetchUser(userId) {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
}

/**
 * Creates a new user by sending their name and email to the API.
 *
 * @param name - The name of the new user.
 * @param email - The email address of the new user.
 * @returns A promise that resolves to the created user object (parsed JSON).
 */
async function createUser(name, email) {
    const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name, email })
    });
    return response.json();
}
```