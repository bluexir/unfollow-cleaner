"use client";
import { motion } from "framer-motion";
import { useFarcaster } from "@/app/providers";
import { useState } from "react";

export default function AuthButton() {
  const { login } = useFarcaster();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group">
      <motion.button
        onClick={handleLogin}
        disabled={isLoading}
        whileHover={!isLoading ? { y: 2, x: 2 } : {}}
        whileTap={!isLoading ? { y: 4, x: 4 } : {}}
        className="
          relative z-10
          flex items-center gap-3 
          px-8 py-4 
          bg-white border-2 border-ink 
          text-ink font-bold uppercase tracking-wider
          shadow-hard hover:shadow-hard-hover active:shadow-hard-active
          transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <div className={`w-3 h-3 bg-alert rounded-full ${isLoading ? 'animate-spin' : 'animate-pulse'}`} />
        {isLoading ? "Connecting..." : "Connect Neynar"}
      </motion.button>
      
      <div className="absolute -inset-1 border border-ink/10 -z-10 rotate-2 group-hover:rotate-0 transition-transform" />
    </div>
  );
}
