# NIT Career Counselling

A Next.js application built with TypeScript, Prisma, Supabase, and Clerk for career counselling.

## Technologies Used

- **Next.js**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Prisma**: Database ORM
- **Supabase**: Backend as a Service (Database, Auth, etc.)
- **Clerk**: User authentication and management
- **shadcn/ui**: Modern UI components

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Clerk:
   - Create a project at [clerk.com](https://clerk.com)
   - Go to API Keys
   - Copy the Publishable key and Secret key
   - Update `.env` file:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     CLERK_SECRET_KEY=your_clerk_secret_key
     ```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API
   - Copy the Project URL and anon public key
   - Update `.env` file:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     DATABASE_URL=your_supabase_database_url
     ```

3. Set up Prisma:
   - Update the `DATABASE_URL` in `.env` with your Supabase database connection string (found in Settings > Database)
   - Define your models in `prisma/schema.prisma`
   - Run migrations:
     ```bash
     npx prisma migrate dev --name init
     ```
   - Generate Prisma client:
     ```bash
     npx prisma generate
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app/`: Next.js app router pages
- `src/lib/`: Utility libraries (e.g., Supabase client)
- `prisma/`: Database schema and migrations
- `src/components/`: Reusable UI components

## Authentication

The app uses Clerk for authentication. Users can sign up, sign in, and manage their profiles. Protected routes can be implemented using Clerk's middleware or components.

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
