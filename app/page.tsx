"use client";
import { useFarcaster } from ".[/providers](https://farcaster.xyz/~/channel/providers)";
import AppShell from "@[/components](https://farcaster.xyz/~/channel/components)/AppShell";

export default function Home() {
  const { context } = useFarcaster();

  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1117]">
        <div className="loader mb-4"><[/div](https://farcaster.xyz/~/channel/div)>
        <p className="text-gray-500 text-xs tracking-[0.2em] animate-pulse">
          SYSTEM INITIALIZING...
        <[/p](https://farcaster.xyz/~/channel/p)>
      <[/div](https://farcaster.xyz/~/channel/div)>
    );
  }

  if (!context.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1117] p-8 text-center text-white">
        <div className="text-5xl mb-6">📱<[/div](https://farcaster.xyz/~/channel/div)>
        <h1 className="text-2xl font-bold mb-4">Mobile App Only<[/h1](https://farcaster.xyz/~/channel/h1)>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Unfollow Cleaner, Warpcast mini app deneyimi için tasarlandı.
          Lütfen bu linki Warpcast içinde aç.
        <[/p](https://farcaster.xyz/~/channel/p)>
        </p>
        
          href="https://warpcast.com/bluexir"
          className="bg-[#7C65C1] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#6952a3] transition-colors"
        >
          Warpcast'ı Aç
        </a>
        <[/a](https://farcaster.xyz/~/channel/a)>
      <[/div](https://farcaster.xyz/~/channel/div)>
    );
  }

  return (
    <main data-testid="app-root" className="min-h-screen bg-app">
      <AppShell user={context.user} />
    <[/main](https://farcaster.xyz/~/channel/main)>
  );
}
