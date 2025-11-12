import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-auto w-full rounded-minimal border-standard border-motherduck-dark bg-white px-4 py-3 text-body-md text-motherduck-dark ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-motherduck-dark placeholder:text-motherduck-dark/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motherduck-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
