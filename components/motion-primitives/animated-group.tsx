"use client";

import { motion } from "framer-motion";

interface AnimatedGroupProps {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants?: Record<string, { [key: string]: any }>;
  className?: string;
  as?: React.ElementType;
}

export function AnimatedGroup({
  children,
  variants = {},
  className,
  as: Component = "div",
}: AnimatedGroupProps) {
  const defaultVariants = {
    container: {
      visible: {
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.75,
        },
      },
    },
    item: {
      hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
          type: "spring",
          bounce: 0.3,
          duration: 1.5,
        },
      },
    },
  };

  const mergedVariants = { ...defaultVariants, ...variants };

  return (
    <Component className={className}>
      <motion.div
        variants={mergedVariants.container}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </Component>
  );
}