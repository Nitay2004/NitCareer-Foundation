
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
    let dbStatus = "Checking..."
    let expertCount = 0
    let error = ""

    try {
        expertCount = await prisma.expert.count()
        dbStatus = "Connected"
    } catch (err: any) {
        dbStatus = "Error"
        error = err.message || JSON.stringify(err)
    }

    return (
        <div className="p-8">
            <h1>Debug Page</h1>
            <p>DB Status: {dbStatus}</p>
            <p>Expert Count: {expertCount}</p>
            {error && (
                <pre className="bg-red-100 p-4 mt-4">
                    {error}
                </pre>
            )}
        </div>
    )
}
