"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-blush-300 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-400 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  );
}
