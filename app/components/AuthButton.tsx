"use client";

import { motion } from "framer-motion";

export default function AuthButton() {
  // Not: Neynar login fonksiyonunu buraya bağlamalısın.
  const signIn = () => {
    console.log("Neynar Login Triggered");
    // window.location.href = ...
  };

  return (
    <div className="relative group">
      <motion.button
        onClick={signIn}
        whileHover={{ y: 2, x: 2 }}
        whileTap={{ y: 4, x: 4 }}
        className="
          relative z-10
          flex items-center gap-3 
          px-8 py-4 
          bg-white border-2 border-ink 
          text-ink font-bold uppercase tracking-wider
          shadow-hard hover:shadow-hard-hover active:shadow-hard-active
          transition-all
        "
      >
        <div className="w-3 h-3 bg-alert rounded-full animate-pulse" />
        Connect Neynar
      </motion.button>
      
      {/* Dekoratif Arka Plan Çizgileri */}
      <div className="absolute -inset-1 border border-ink/10 -z-10 rotate-2 group-hover:rotate-0 transition-transform" />
    </div>
  );
}
