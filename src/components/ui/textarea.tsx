import * as React from "react"

import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div>
        <textarea
          className={cn(
            `dark:border-dark-700 dark:bg-dark-800 dark:text-white flex min-h-[80px] w-full rounded-md border  bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground  disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-red-500" : "border-gray-700"}`,
            className
          )}
          ref={ref}
          {...props}
        />

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
Textarea.displayName = "Textarea"

export { Textarea }
