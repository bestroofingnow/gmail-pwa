"use client";

import { useRouter } from "next/navigation";
import { ComposeModal } from "@/components/ComposeModal";

export default function ComposePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto">
      <ComposeModal onClose={() => router.push("/inbox")} />
    </div>
  );
}
