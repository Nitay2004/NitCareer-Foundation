import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { StreamClient } from '@stream-io/node-sdk';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        const secret = process.env.STREAM_SECRET;

        if (!apiKey || !secret) {
            console.error("Stream API Key/Secret missing");
            return NextResponse.json({
                error: "Video Infrastructure Not Configured",
                message: "Please add NEXT_PUBLIC_STREAM_API_KEY and STREAM_SECRET to your .env"
            }, { status: 500 });
        }

        const client = new StreamClient(apiKey, secret);

        // Token expiration (1 hour)
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const issuedAt = Math.floor(Date.now() / 1000) - 60;

        // Secure metadata for both Video and Chat
        const userMetadata = {
            user_id: userId,
            exp: exp,
            iat: issuedAt,
            name: user.fullName || "User",
            image: user.imageUrl,
            role: 'user'
        };

        const token = client.generateUserToken(userMetadata);

        return NextResponse.json({
            token,
            apiKey,
            userId: userId,
            userName: user.fullName,
            userImage: user.imageUrl
        });

    } catch (error) {
        console.error("Video Token Error:", error);
        return NextResponse.json({ error: "Failed to create secure video token" }, { status: 500 });
    }
}
