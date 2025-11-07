import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motherduck-dark focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-motherduck-blue text-motherduck-dark border-standard border-motherduck-dark rounded-minimal hover:bg-motherduck-blue/90 hover:-translate-y-0.5 hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground border-standard border-motherduck-dark rounded-minimal hover:bg-destructive/90",
        outline:
          "border-standard border-motherduck-dark bg-white hover:bg-motherduck-beige rounded-minimal text-motherduck-dark",
        secondary:
          "bg-motherduck-beige text-motherduck-dark border-standard border-motherduck-dark rounded-minimal hover:bg-motherduck-beige/80",
        ghost: "hover:bg-motherduck-beige/50 hover:text-motherduck-dark rounded-minimal",
        link: "text-motherduck-teal underline-offset-4 hover:underline",
        teal: "bg-motherduck-teal text-white border-standard border-motherduck-dark rounded-minimal hover:bg-motherduck-teal/90 hover:-translate-y-0.5 hover:shadow-lg",
      },
      size: {
        default: "h-auto px-[22px] py-[16.5px] text-body-sm",
        sm: "h-auto px-4 py-2 text-caption rounded-minimal",
        lg: "h-auto px-8 py-5 text-body-md rounded-minimal",
        icon: "h-10 w-10 rounded-minimal",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
