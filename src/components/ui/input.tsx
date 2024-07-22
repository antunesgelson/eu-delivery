import * as React from "react"

import { cn } from "@/lib/utils"
import { IoIosSearch } from "react-icons/io"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            `flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none  focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted ${type === 'search'  && 'pl-8'}`,
            className
          )}
          ref={ref}
          {...props}
        />



        {type === 'search' && (
          <button
            type="button"
            className="absolute top-0 left-0 bottom-0 w-10 flex items-center justify-center"
          >
            <IoIosSearch size={20} />
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
