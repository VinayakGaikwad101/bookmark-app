import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Bookmarks from "@/components/Bookmarks";
import LoadingButton from "@/components/LoadingButton";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 max-w-md p-8 bg-white rounded-xl shadow-lg border">
          <h1 className="text-3xl font-bold text-gray-900">
            Smart Bookmark App
          </h1>
          <p className="text-gray-500">
            Save your links and see them update instantly across devices.
          </p>

          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              const { data } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
                },
              });
              if (data.url) redirect(data.url);
            }}
          >
            <LoadingButton className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
              Sign in with Google
            </LoadingButton>
          </form>
        </div>
      </div>
    );
  }

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-10 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">My Bookmarks - Assignment</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/");
            }}
          >
            <LoadingButton className="text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 hover:bg-red-50 rounded transition">
              Sign Out
            </LoadingButton>
          </form>
        </div>

        <Bookmarks serverBookmarks={bookmarks || []} />
      </div>
    </main>
  );
}
