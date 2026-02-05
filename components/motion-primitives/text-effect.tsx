"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

interface TextEffectProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  preset?: "fade-in-blur" | "slide-up" | "typewriter";
  speedSegment?: number;
  delay?: number;
  per?: "word" | "char" | "line";
}

const fadeBlurVariants = {
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
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 0.8,
    },
  },
};

const typewriterVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.05,
    },
  },
};

export function TextEffect({
  children,
  as: Component = "div",
  className,
  preset = "fade-in-blur",
  speedSegment = 0.3,
  delay = 0,
  per = "word",
}: TextEffectProps) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  const getVariants = () => {
    switch (preset) {
      case "slide-up":
        return slideUpVariants;
      case "typewriter":
        return typewriterVariants;
      default:
        return fadeBlurVariants;
    }
  };

  const renderText = () => {
    if (typeof children !== "string") {
      return children;
    }

    const text = children;
    const words = text.split(" ");

    if (per === "char") {
      return (
        <span>
          {text.split("").map((char, index) => (
            <motion.span
              key={index}
              variants={getVariants()}
              initial="hidden"
              animate={controls}
              transition={{
                delay: delay + index * speedSegment,
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      );
    }

    if (per === "line") {
      return (
        <span>
          {text.split("\n").map((line, index) => (
            <motion.span
              key={index}
              variants={getVariants()}
              initial="hidden"
              animate={controls}
              transition={{
                delay: delay + index * speedSegment,
              }}
              className="block"
            >
              {line}
            </motion.span>
          ))}
        </span>
      );
    }

    return (
      <span>
        {words.map((word, index) => (
          <motion.span
            key={index}
            variants={getVariants()}
            initial="hidden"
            animate={controls}
            transition={{
              delay: delay + index * speedSegment,
            }}
            className="inline-block"
          >
            {word}&nbsp;
          </motion.span>
        ))}
      </span>
    );
  };

  return (
    <Component className={className}>
      {renderText()}
    </Component>
  );
}