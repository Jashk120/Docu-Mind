```typescript
import NextAuth from "next-auth";

import { authOptions } from "@/auth";

/**
 * Creates the NextAuth handler for authentication routes.
 *
 * @param authOptions - The authentication options configuration.
 * @returns A NextAuth handler function that can be used for GET and POST requests.
 */
const handler = NextAuth(authOptions);

/**
 * Exports the NextAuth handler as GET and POST to handle authentication requests.
 */
export { handler as GET, handler as POST };
```