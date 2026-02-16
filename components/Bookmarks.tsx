"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback, useRef } from "react";
import { addBookmarkAction, deleteBookmarkAction } from "@/app/actions";

type Bookmark = {
  id: string;
  title: string;
  url: string;
};

const ITEMS_PER_PAGE = 5;

export default function Bookmarks({
  serverBookmarks = [],
}: {
  serverBookmarks: Bookmark[];
}) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();
  const pageRef = useRef(1);

  const showToast = useCallback(
    (msg: string, type: "error" | "success" = "error") => {
      setToast({ msg, type });
    },
    [],
  );

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchPageData = useCallback(
    async (page: number, showLoading = true) => {
      if (showLoading) setIsFetching(true);
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await supabase
        .from("bookmarks")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!error && data) {
        setBookmarks(data);
        if (count !== null) setTotalCount(count);
      }
      setIsFetching(false);
    },
    [supabase],
  );

  useEffect(() => {
    setIsMounted(true);
    fetchPageData(1);

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const channel = supabase
          .channel("realtime-bookmarks")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "bookmarks",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              fetchPageData(pageRef.current, false);
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };
    setupRealtime();
  }, [fetchPageData, supabase]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    pageRef.current = newPage;
    fetchPageData(newPage);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("url", url);

    const result = await addBookmarkAction(formData);

    if (result?.error) {
      const rawError =
        typeof result.error === "string"
          ? result.error
          : (result.error as any).message || "";

      let friendlyMsg = rawError;

      if (
        rawError.includes("unique_title_per_user") ||
        rawError.includes("duplicate key")
      ) {
        friendlyMsg = "You already have a bookmark with this title.";
      } else if (rawError.includes("url_format_check")) {
        friendlyMsg = "Please enter a valid URL.";
      }

      showToast(friendlyMsg, "error");
    } else {
      setTitle("");
      setUrl("");
      showToast("Link saved successfully!", "success");
      setCurrentPage(1);
      pageRef.current = 1;
      fetchPageData(1);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteBookmarkAction(id);
    if (result?.error) {
      showToast(
        typeof result.error === "string"
          ? result.error
          : (result.error as any).message,
        "error",
      );
    } else {
      showToast("Bookmark removed", "success");
      fetchPageData(pageRef.current);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const shouldShowSkeleton = !isMounted || isFetching;

  return (
    <div className="w-full flex flex-col items-center relative">
      <div className="w-full max-w-md mt-6">
        {toast && (
          <div
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleAdd} className="mb-10 space-y-4">
          <input
            className="border p-2.5 rounded-lg w-full text-black focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            required
          />
          <input
            className="border p-2.5 rounded-lg w-full text-black focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Bookmark"}
          </button>
        </form>

        <div className="relative min-h-115">
          {shouldShowSkeleton && (
            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-100 h-18.5 rounded-xl border border-gray-100"
                />
              ))}
            </div>
          )}

          <ul className="space-y-4">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 transition-all relative"
              >
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border shrink-0 overflow-hidden">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`}
                    alt="icon"
                    className="w-6 h-6 object-contain"
                    onError={(e) =>
                      (e.currentTarget.src =
                        "https://www.google.com/favicon.ico")
                    }
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-gray-900 truncate">
                    {bookmark.title}
                  </p>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    className="text-xs text-blue-500 truncate block hover:underline"
                  >
                    {new URL(bookmark.url).hostname}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bookmark.url);
                      showToast("Copied!", "success");
                    }}
                    className="text-gray-400 hover:text-blue-600 p-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    className="text-gray-400 hover:text-red-500 p-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              disabled={currentPage === 1 || shouldShowSkeleton}
              onClick={() => handlePageChange(currentPage - 1)}
              className="text-sm font-medium text-gray-500 hover:text-blue-600 disabled:opacity-30"
            >
              ← Prev
            </button>
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages || shouldShowSkeleton}
              onClick={() => handlePageChange(currentPage + 1)}
              className="text-sm font-medium text-gray-500 hover:text-blue-600 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
