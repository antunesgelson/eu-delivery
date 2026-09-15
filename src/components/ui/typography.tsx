"use client"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const typographyVariants = cva("text-foreground antialiased", {
  variants: {
    variant: {
      display: "text-[28px] font-extrabold leading-8 tracking-tight text-dark-900 md:text-[32px] md:leading-9",
      h1: "scroll-m-20 text-[24px] font-extrabold leading-8 tracking-tight text-dark-900",
      h2: "scroll-m-20 text-[20px] font-extrabold leading-7 tracking-tight text-dark-900",
      h3: "scroll-m-20 text-[18px] font-extrabold leading-6 text-dark-900",
      h4: "scroll-m-20 text-[16px] font-extrabold leading-6 text-dark-900",
      title: "text-[18px] font-extrabold leading-6 text-dark-900",
      subtitle: "text-[15px] font-bold leading-5 text-dark-700",
      lead: "text-[16px] font-semibold leading-7 text-muted-foreground",
      body: "text-[14px] font-normal leading-6 text-dark-700",
      bodyStrong: "text-[14px] font-bold leading-6 text-dark-900",
      small: "text-[12px] font-semibold leading-5 text-dark-600",
      caption: "text-[11px] font-semibold leading-4 text-muted-foreground",
      label: "text-[12px] font-extrabold uppercase leading-none tracking-wide text-dark-500",
      overline: "text-[10px] font-extrabold uppercase leading-none tracking-wide text-muted-foreground",
      muted: "text-[14px] font-medium leading-5 text-muted-foreground",
      code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[13px] font-semibold text-dark-900",
    },
    tone: {
      default: "",
      muted: "text-muted-foreground",
      subtle: "text-dark-500",
      strong: "text-dark-900",
      primary: "text-[#0b98f6]",
      accent: "text-[#f97316]",
      success: "text-emerald-700",
      warning: "text-amber-700",
      danger: "text-destructive",
      inherit: "text-inherit",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    truncate: {
      true: "truncate",
      false: "",
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "default",
    align: "left",
    truncate: false,
  },
})

const defaultElementByVariant = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  title: "h2",
  subtitle: "p",
  lead: "p",
  body: "p",
  bodyStrong: "p",
  small: "small",
  caption: "span",
  label: "span",
  overline: "span",
  muted: "p",
  code: "code",
} satisfies Record<NonNullable<VariantProps<typeof typographyVariants>["variant"]>, keyof JSX.IntrinsicElements>

type TypographyProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof typographyVariants> & {
    as?: React.ElementType;
    asChild?: boolean;
  }

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ as, asChild = false, variant = "body", tone, align, truncate, className, ...props }, ref) => {
    const Comp: React.ElementType = asChild ? Slot : as ?? defaultElementByVariant[variant ?? "body"]

    return (
      <Comp
        ref={ref}
        className={cn(typographyVariants({ variant, tone, align, truncate }), className)}
        {...props}
      />
    )
  }
)
Typography.displayName = "Typography"

export { Typography, typographyVariants }
export type { TypographyProps }
