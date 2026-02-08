import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const experts = await prisma.expert.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        experience: true,
        rating: true,
        bio: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: "completed"
              }
            }
          }
        }
      },
      orderBy: {
        rating: "desc"
      }
    })

    // Transform the data to include session count
    const transformedExperts = experts.map((expert: any) => ({
      id: expert.id,
      firstName: expert.firstName,
      lastName: expert.lastName,
      specialization: expert.specialization,
      experience: expert.experience,
      rating: expert.rating,
      bio: expert.bio,
      sessionsCompleted: expert._count.bookings
    }))

    return NextResponse.json({ experts: transformedExperts })

  } catch (error) {
    console.error("Error fetching experts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}