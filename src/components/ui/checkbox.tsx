"use client"

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";
import { IoCheckmarkSharp, IoCloseSharp } from "react-icons/io5"; // Importar IoCheckmarkSharp para a variante 'add'

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

// Adicionando a prop 'variant' ao tipo de props
interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  variant?: string;
  className?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, ...props }, ref) => {
  // Determinar as classes de estilo com base na variante

  
  let variantClasses = ''
  switch (variant) {
    case 'add':
      variantClasses = "border-emerald-500 data-[state=checked]:bg-emerald-500"
      break;

    case 'remove':
      variantClasses = "border-red-700 data-[state=checked]:bg-red-700 data-[state=checked]:text-primary-foreground";
      break;

    default:
      variantClasses = "border-muted data-[state=checked]:bg-white-off data-[state=checked]:text-white";
      break;
  }
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        `peer h-6 w-6 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50   ${variantClasses}`,
        className
      )}
      {...props}>
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}>
        <AnimatePresence>
          {variant !== 'remove' && props.checked &&
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: '100deg' }}
              animate={{ opacity: 1, scale: 1, rotate: '0deg' }}>
              <IoCheckmarkSharp className="h-5 w-5 text-white dark:text-dark-800" />
            </motion.div>
          }
        </AnimatePresence>

        <AnimatePresence>
          {variant === 'remove' && props.checked &&
            <motion.div
              initial={{ opacity: 0, scale: 0, }}
              animate={{ opacity: 1, scale: 1, }}>
              <IoCloseSharp className="h-5 w-5" />
            </motion.div>
          }
        </AnimatePresence>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
