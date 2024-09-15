'use client'
import * as React from "react"

import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { IoIosSearch } from "react-icons/io"
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            `flex h-9 w-full rounded-md border  bg-transparent  px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none  focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted ${error ? 'border-red-500' : 'border-input'} ${type === 'search' && 'pl-8'}`,
            className
          )}
          ref={ref}
          {...props}
        />



        {type === 'search' && (
          <button
            type="button"
            className="absolute top-0 left-0 bottom-0 w-10 flex items-center justify-center">
            <IoIosSearch size={20} />
          </button>
        )}



        <AnimatePresence>
          {error && (
            <motion.p
              className="text-[0.7rem] text-red-500 ml-2 line-clamp-1"
              initial={{ opacity: 0, }}
              animate={{
                opacity: [1, 0.5, 1, 0.5, 1],
                x: [0, -10, 10, -10, 0],
              }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
                times: [0, 0.2, 0.5, 0.8, 1],
                loop: Infinity,
                repeatDelay: 33
              }}
              exit={{ opacity: 0, y: 10 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
