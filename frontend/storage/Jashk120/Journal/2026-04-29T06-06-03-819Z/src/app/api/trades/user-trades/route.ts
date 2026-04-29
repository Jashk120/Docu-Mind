```typescript
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getDataFromToken } from "@/helper/getDataFromTokens";
import type { NextRequest } from "next/server";

const prisma = new PrismaClient();

/**
 * Handles GET requests to retrieve paginated trade records for the authenticated user.
 *
 * Parses the request for pagination and sorting parameters, extracts the user ID from the
 * authentication token, and queries the database for trades belonging to that user. Returns
 * a JSON response with the trades array and total count, or an error message if something fails.
 *
 * @param request - The incoming Next.js request object containing query parameters and authentication token.
 * @returns A NextResponse JSON object with either the trades and total count (status 200),
 *          an invalid userId error (status 400), or a server error message (status 500).
 * @throws Will catch any error during token extraction or database interaction and return a 500 response.
 */
export async function GET(request: NextRequest) {
    try {
        const userId = await getDataFromToken(request);

        if (!userId || typeof userId !== "string") {
            return NextResponse.json({ error: "Invalid userId provided" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const sortBy = searchParams.get("sortBy") || "dateTime";

        const offset = (page - 1) * limit;

        const [trades, total] = await Promise.all([
            prisma.trade.findMany({
                where: { userId: userId },
                orderBy: { [sortBy]: "asc" },
                skip: offset,
                take: limit,
            }),
            prisma.trade.count({ where: { userId: userId } }),
        ]);

        return NextResponse.json({ trades, total }, { status: 200 });

    } catch (error) {
        console.error("Error retrieving trades:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
```