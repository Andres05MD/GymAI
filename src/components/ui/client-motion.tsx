"use client";

import { motion, AnimatePresence as FramerAnimatePresence, HTMLMotionProps } from "framer-motion";

export const ClientMotionDiv = motion.div;
export const ClientMotionSection = motion.section;
export const ClientMotionHeader = motion.header;
export const AnimatePresence = FramerAnimatePresence;

export type { HTMLMotionProps };
