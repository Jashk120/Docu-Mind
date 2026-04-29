```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Deletes a trade record from the database based on the provided trade ID.
 *
 * Validates that a trade ID is present in the request body, verifies the trade exists,
 * and deletes it. Responds with appropriate HTTP status codes and error messages.
 *
 * @param request - The incoming Next.js request object containing the JSON body with the trade ID.
 * @returns A NextResponse with a success message and status 200, or an error response with the corresponding status code.
 * @throws {Error} When an unexpected error occurs during database operations; caught and returned as a 500 response.
 */
export async function DELETE(request: NextRequest) {
    try {
        const { tradeId } = await request.json();

        // Validate tradeId
        if (!tradeId) {
            return NextResponse.json({ error: "Trade ID is required." }, { status: 400 });
        }

        // Check if the trade exists
        const tradeExists = await prisma.trade.findUnique({
            where: { id: tradeId }
        });

        if (!tradeExists) {
            return NextResponse.json({ error: "Trade not found." }, { status: 404 });
        }

        // Delete the trade
        await prisma.trade.delete({
            where: { id: tradeId }
        });

        return NextResponse.json({ message: "Trade deleted successfully." }, { status: 200 });

    } catch (error) {
        console.error('Error deleting trade:', error);

        // Type guard to check if 'error' is an instance of 'Error'
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
        await prisma.$disconnect(); // Ensure Prisma client disconnects
    }
}
```