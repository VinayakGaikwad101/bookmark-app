"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addBookmarkAction(formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;

  const { error } = await supabase.from("bookmarks").insert({ title, url });

  if (!error) revalidatePath("/");
  return { error };
}

export async function deleteBookmarkAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bookmarks").delete().eq("id", id);

  if (!error) revalidatePath("/");
  return { error };
}
