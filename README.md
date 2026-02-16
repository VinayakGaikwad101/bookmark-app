# Bookmark Manager - Abstrabit Technical Challenge

A high-performance, real-time Bookmark Manager built with **Next.js 14**, **Supabase**, and **Tailwind CSS**. This application emphasizes a seamless user experience through server-side mutations, efficient pagination, and robust state management.

## Technical Features

- **Server Actions Architecture**: Utilizes Next.js 14 Server Actions for secure database mutations (Add/Delete) and automatic cache revalidation using `revalidatePath`.
- **Efficient Pagination**: Implements limit/offset logic via Supabase `.range()` to fetch data in chunks of 5, ensuring the application remains performant regardless of dataset size.
- **Real-time Synchronization**: Integrated Supabase Real-time listeners to synchronize the UI across multiple clients without requiring manual page refreshes.
- **Stable Skeleton Loading**: Implemented an absolute-overlay skeleton system and hydration checks (`isMounted`) to eliminate "flickering" and layout shifts during data transitions.
- **Favicon Integration**: Leverages Google’s S2 favicon service to dynamically retrieve high-resolution icons based on the bookmark's hostname.
- **Auto-dismissing Toast Notifications**: A centralized notification system provides immediate feedback for successes (copying links) and errors (database constraint violations), with a 5-second auto-dismissal.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Language**: TypeScript (Strict Mode)

---

## Engineering Challenges & Solutions

### 1. Eliminating the Real-time Infinite Loop

**Problem**: Initial implementation caused a recursive loop where database changes triggered `router.refresh()`, which in turn triggered new client-side fetches.
**Solution**: Decoupled the Real-time listener from the Next.js router. Used a `useRef` to track the current page index within the listener, allowing the UI to update local state silently without notifying the server to re-render the entire route.

### 2. Hydration and Layout Stability

**Problem**: The application suffered from a "flash" of unpaginated content during the transition from Server-Side Rendering (SSR) to Client-Side Rendering (CSR).
**Solution**: Utilized an `isMounted` state to guard the initial render. By enforcing a skeleton loader until the client confirms hydration and fetches the first page, the layout remains stable and visual shifts are eliminated.

### 3. Type-Safe Error Handling

**Problem**: Supabase `PostgrestError` objects were incompatible with UI components expecting simple strings.
**Solution**: Implemented a type-safe error extractor that parses the error object to provide specific feedback for PGSQL codes (e.g., code `23505` for unique title violations) while satisfying TypeScript's strict type checks.

---

## Installation and Setup

1. **Clone the Repository**:

```bash
git clone [your-repo-url]
cd [folder-name]
npm install

```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

```

3. **Database Configuration**:
   The application expects a table named `bookmarks` with the following schema:

- `id`: uuid (Primary Key)
- `user_id`: uuid (Foreign Key to auth.users)
- `title`: text (Unique constraint)
- `url`: text
- `created_at`: timestamptz

4. **Run Development Server**:

```bash
npm run dev

```
