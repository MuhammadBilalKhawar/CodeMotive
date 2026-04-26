"use client"

import { motion } from "framer-motion"

export function DynamicBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-30 dark:opacity-20">
      {/* Top Right Blob */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full ambient-flow" />
      
      {/* Bottom Left Blob */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-soft/10 blur-[100px] rounded-full ambient-flow" 
           style={{ animationDelay: '-5s' }} />
      
      {/* Center Blob */}
      <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-muted/5 blur-[80px] rounded-full ambient-flow"
           style={{ animationDelay: '-10s' }} />
    </div>
  )
}
