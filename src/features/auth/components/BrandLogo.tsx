import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden
      className={cn("shrink-0", sizeClasses[size], className)}
    />
  )
}
