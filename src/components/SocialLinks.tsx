"use client"
import { motion } from "framer-motion";
import { Twitter, Linkedin, Github } from "lucide-react";
export const SocialLinks = ({className}: {className: string}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute  flex gap-6 pointer-events-auto z-50 ${className}`}
    >
      <a
        href="https://x.com/suryansh777777"
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-500 hover:text-cyan-300 transition-colors duration-300"
      >
        <Twitter size={16} className="md:size-8" />
      </a>
      <a
        href="https://linkedin.com/in/suryansh777777"
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-500 hover:text-cyan-300 transition-colors duration-300"
      >
        <Linkedin size={16} className="md:size-8" />
      </a>
      <a
        href="https://github.com/Suryansh777777/Jarvis-CV"
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-500 hover:text-cyan-300 transition-colors duration-300"
      >
        <Github size={16} className="md:size-8" />
      </a>
    </motion.div>
  );
};