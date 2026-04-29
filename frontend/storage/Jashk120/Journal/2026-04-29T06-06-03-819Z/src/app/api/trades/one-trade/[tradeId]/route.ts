```typescript
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Handles GET requests to retrieve a single trade by its trade ID.
 *
 * @param req - The incoming HTTP request object.
 * @param params - An object containing route parameters, including the `tradeId` string.
 * @returns A NextResponse JSON object containing the trade data on success, or an error message with the appropriate HTTP status code.
 *          Success (200): The trade object.
 *          Bad Request (400): If `tradeId` is missing or invalid.
 *          Not Found (404): If no trade with the given ID exists.
 *          Internal Server Error (500): If an unexpected error occurs.
 */
// Export the GET function to retrieve a single trade by tradeId
export async function GET(req: Request, { params }: { params: { tradeId: string } }) {
    const { tradeId } = params; // Extract tradeId from URL parameters

    try {
        // Validate tradeId
        if (!tradeId || typeof tradeId !== "string") {
            return NextResponse.json({ error: "Invalid tradeId provided" }, { status: 400 });
        }

        // Retrieve the trade entry for the specific tradeId
        const trade = await prisma.trade.findUnique({
            where: { id: tradeId } // Ensure tradeId matches your schema type
        });

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 });
        }

        return NextResponse.json(trade, { status: 200 });

    } catch (error) {
        console.error("Error retrieving trade:", error);

        // Handle error with message check
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
        await prisma.$disconnect(); // Ensure Prisma client disconnects
    }
}
```