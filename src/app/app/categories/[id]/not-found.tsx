import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function CategoryNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
      <AlertTriangle className="h-16 w-16 text-yellow-500 mb-6" />
      <h1 className="text-3xl font-bold mb-3">Category Not Found</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
        The category you're looking for doesn't exist or has been removed.
      </p>
      <Link href="/categories">
        <Button>View All Categories</Button>
      </Link>
    </div>
  );
}
