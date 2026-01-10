"use client";
import { useFarcaster } from "./providers";
import AppShell from "@/components/AppShell";

export default function Home() {
  const { context, isSDKLoaded } = useFarcaster();

  if (!isSDKLoaded || !context?.user) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <main className="min-h-screen bg-black">
      <AppShell user={context.user} />
    </main>
  );
}
