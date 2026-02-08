import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { meetingNumber, role } = body;

        const sdkKey = process.env.ZOOM_SDK_KEY;
        const sdkSecret = process.env.ZOOM_SDK_SECRET;

        // If no keys, return a mock signature for UI demonstration or instructions
        if (!sdkKey || !sdkSecret) {
            console.error("Zoom SDK Key/Secret missing from .env");
            return NextResponse.json({
                error: "Zoom API Keys Missing",
                instructions: "Please add ZOOM_SDK_KEY and ZOOM_SDK_SECRET to your .env file."
            }, { status: 500 });
        }

        const iat = Math.round(new Date().getTime() / 1000) - 30;
        const exp = iat + 60 * 60 * 2;

        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = {
            sdkKey: sdkKey,
            mn: meetingNumber,
            role: role,
            iat: iat,
            exp: exp,
            appKey: sdkKey,
            tokenExp: iat + 60 * 60 * 2
        };

        const sHeader = JSON.stringify(header);
        const sPayload = JSON.stringify(payload);

        const base64Header = Buffer.from(sHeader).toString('base64').replace(/=/g, "");
        const base64Payload = Buffer.from(sPayload).toString('base64').replace(/=/g, "");

        const signature = crypto
            .createHmac('sha256', sdkSecret)
            .update(base64Header + "." + base64Payload)
            .digest('base64')
            .replace(/=/g, "");

        return NextResponse.json({
            signature: `${base64Header}.${base64Payload}.${signature}`
        });

    } catch (error) {
        console.error("Zoom Signature Error:", error);
        return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
    }
}
