```typescript
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles GET requests to retrieve all trade records from the database.
 *
 * @param req - The incoming HTTP request object.
 * @returns A NextResponse containing either the list of trades (status 200) or an error message (status 500).
 * @throws {Error} If the database query fails or an unexpected error occurs.
 */
// Export the GET function
export async function GET(req: Request) {
    try {
        // Retrieve all trade entries
        const trades = await prisma.trade.findMany();

        return NextResponse.json(trades, { status: 200 });

    } catch (error) {
        console.error("Error retrieving trades:", error);

        // Handle error with message check
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
        await prisma.$disconnect(); // Ensure Prisma client disconnects
    }
}
```