"use client";

import { useEffect, Suspense, memo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import KnowledgeBase from "@/components/KnowledgeBase";
import { useKnowledgeStore } from "@/stores/knowledgeStore";
import { useKnowledgeData } from "@/hooks/useCoinData";
import { KnowledgeFilter } from "@/components/KnowledgeFilter";

type DateFilterType = "all" | "today" | "week" | "month" | "year";
type SortByType = "date" | "title" | "channel" | "updated";

const KnowledgePageContent = memo(function KnowledgePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: knowledge, isLoading, error } = useKnowledgeData();
  const itemsPerPage = 99;

  const {
    searchTerm,
    filterChannel,
    dateFilter,
    sortBy,
    currentPage,
    setSearchTerm,
    setFilterChannel,
    setDateFilter,
    setSortBy,
    setCurrentPage,
  } = useKnowledgeStore();

  // Add model filter state
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Initialize from URL params on first load
  useEffect(() => {
    const search = searchParams.get("search");
    const channel = searchParams.get("channel");
    const date = searchParams.get("date");
    const sort = searchParams.get("sort");
    const page = searchParams.get("page");

    if (search) setSearchTerm(search);
    if (channel) setFilterChannel(channel);
    if (date && ["all", "today", "week", "month", "year"].includes(date)) {
      setDateFilter(date as DateFilterType);
    }
    if (
      sort &&
      (sort === "date" ||
        sort === "title" ||
        sort === "channel" ||
        sort === "updated")
    ) {
      setSortBy(sort as SortByType);
    }
    if (page) setCurrentPage(Number(page));
  }, [searchParams, setSearchTerm, setFilterChannel, setDateFilter, setSortBy, setCurrentPage]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }

    if (filterChannel !== "all") {
      params.set("channel", filterChannel);
    } else {
      params.delete("channel");
    }

    if (dateFilter !== "all") {
      params.set("date", dateFilter);
    } else {
      params.delete("date");
    }

    if (sortBy !== "date") {
      params.set("sort", sortBy);
    } else {
      params.delete("sort");
    }

    if (currentPage !== 1) {
      params.set("page", currentPage.toString());
    } else {
      params.delete("page");
    }

    const newUrl = `${window.location.pathname}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    router.replace(newUrl, { scroll: false });
  }, [searchTerm, filterChannel, dateFilter, sortBy, currentPage, searchParams, router]);

  // Get unique channels from the channel name field
  const channels = Array.from(
    new Set((knowledge || []).map((item) => item["channel name"] || "Unknown"))
  ).sort();

  // Filter and sort items
  const filteredAndSortedItems = (knowledge || [])
    .filter((item) => {
      const matchesSearch = item.video_title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesChannel =
        filterChannel === "all" || item["channel name"] === filterChannel;

      // Model filtering
      const matchesModel =
        selectedModels.length === 0 ||
        selectedModels.includes("all") ||
        (item.model && selectedModels.includes(item.model));

      // Date filtering
      const itemDate = new Date(item.date);
      let matchesDate = true;

      if (dateFilter !== "all") {
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        if (dateFilter === "today") {
          matchesDate = itemDate >= startOfToday;
        } else if (dateFilter === "week") {
          const weekAgo = new Date(startOfToday);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = itemDate >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(startOfToday);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = itemDate >= monthAgo;
        } else if (dateFilter === "year") {
          const yearAgo = new Date(startOfToday);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          matchesDate = itemDate >= yearAgo;
        }
      }

      return matchesSearch && matchesChannel && matchesDate && matchesModel;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "title") {
        return a.video_title.localeCompare(b.video_title);
      }
      if (sortBy === "channel") {
        return (a["channel name"] || "").localeCompare(b["channel name"] || "");
      }
      if (sortBy === "updated") {
        // Use updated_at if available, otherwise fallback to date
        const aTime = a.updated_at
          ? new Date(a.updated_at).getTime()
          : new Date(a.date).getTime();
        const bTime = b.updated_at
          ? new Date(b.updated_at).getTime()
          : new Date(b.date).getTime();
        return bTime - aTime; // Sort newest first
      }
      return 0;
    });

  // Fix the pagination button handlers
  const handlePrevPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const handleNextPage = () =>
    setCurrentPage(
      Math.min(
        Math.ceil(filteredAndSortedItems.length / itemsPerPage),
        currentPage + 1
      )
    );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error.message}</div>;
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-black via-green-950/30 to-black relative overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-green-600/10 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-green-400/5 rounded-full mix-blend-multiply filter blur-xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glassmorphic border-b border-green-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 green-text-glow">
                  Knowledge Base
                </h1>
                <div className="px-4 py-2 rounded-lg glassmorphic-light">
                  <span className="text-sm text-green-400">
                    {filteredAndSortedItems.length === 1
                      ? "1 item"
                      : `${filteredAndSortedItems.length} items`}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group flex-1">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search knowledge..."
                    className="w-full glassmorphic-light rounded-lg py-2 pl-10 pr-4 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all duration-200"
                  />
                  <svg
                    className="absolute left-3 w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Model Filter */}
              <KnowledgeFilter
                selectedModels={selectedModels}
                onModelsChange={setSelectedModels}
              />

              {/* Channel Filter */}
              <div className="relative w-48">
                <select
                  value={filterChannel}
                  onChange={(e) => {
                    setFilterChannel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none glassmorphic-light accent-green-500 rounded-lg py-2 px-4 pr-8 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-colors"
                >
                  <option value="all">All Channels</option>
                  {channels.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                {/* Sort Type */}
                <div className="relative w-32">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as SortByType);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none glassmorphic-light accent-green-500 bg rounded-lg py-2 px-3 pr-8 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-colors"
                  >
                    <option value="title">Sort by Title</option>
                    <option value="channel">Sort by Channel</option>
                    <option value="date">Sort by Date</option>
                    <option value="updated">Sort by Updated</option>
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Filter Button with Modern Hover Menu */}
                <div className="relative group">
                  <button className="p-2 rounded-lg glassmorphic-light text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    <span className="text-sm">Filter</span>
                    {dateFilter !== "all" && (
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-64 p-4 glassmorphic rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-green-400 mb-2">
                          Date Range
                        </label>
                        <div className="space-y-2">
                          {[
                            { value: "all", label: "All Time" },
                            { value: "today", label: "Today" },
                            { value: "week", label: "Last 7 Days" },
                            { value: "month", label: "Last 30 Days" },
                            { value: "year", label: "Last 12 Months" },
                          ].map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center px-3 py-2 rounded-lg hover:glass-hover cursor-pointer group/option"
                            >
                              <input
                                type="radio"
                                name="dateFilter"
                                value={option.value}
                                checked={dateFilter === option.value}
                                onChange={(e) => {
                                  setDateFilter(
                                    e.target.value as DateFilterType
                                  );
                                  setCurrentPage(1);
                                }}
                                className="hidden"
                              />
                              <div className="w-4 h-4 rounded-full border-2 border-green-800 group-hover/option:border-green-400 flex items-center justify-center">
                                {dateFilter === option.value && (
                                  <div className="w-2 h-2 rounded-full bg-green-400" />
                                )}
                              </div>
                              <span className="ml-3 text-sm text-gray-300 group-hover/option:text-green-300">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KnowledgeBase
          items={filteredAndSortedItems.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          )}
        />

        {/* Pagination */}
        {filteredAndSortedItems.length > itemsPerPage && (
          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-6 py-3 rounded-xl glassmorphic-light text-gray-200 hover:text-green-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 group"
            >
              <svg
                className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              {Array.from({
                length: Math.ceil(filteredAndSortedItems.length / itemsPerPage),
              }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    currentPage === i + 1
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg glass-glow"
                      : "glassmorphic-light text-gray-300 hover:text-white"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={
                currentPage ===
                Math.ceil(filteredAndSortedItems.length / itemsPerPage)
              }
              className="px-6 py-3 rounded-xl glassmorphic-light text-gray-200 hover:text-green-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 group"
            >
              <span>Next</span>
              <svg
                className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
});

export default function KnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      }
    >
      <KnowledgePageContent />
    </Suspense>
  );
}
