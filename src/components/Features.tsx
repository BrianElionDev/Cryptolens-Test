"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, LineChart, Youtube, Database } from "lucide-react";

const features = [
  {
    title: "Model Testing",
    description:
      "Compare performance between OpenAI GPT-4, Perplexity, and Claude models",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Zero-Shot Analysis",
    description:
      "Test AI models with no prior training data to evaluate raw capabilities",
    icon: Youtube,
    color: "from-red-500 to-orange-500",
  },
  {
    title: "Performance Metrics",
    description: "Track and compare model accuracy, speed, and resource usage",
    icon: LineChart,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Test Results",
    description:
      "Access detailed analysis results and model performance comparisons",
    icon: Database,
    color: "from-green-500 to-emerald-500",
  },
];

const Features = () => {
  const scrollToFeatures = () => {
    const featuresElement = document.getElementById("features");
    if (featuresElement) {
      featuresElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const cardVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-start mb-2">
        <motion.div whileHover="hover" variants={cardVariants}>
          <Link
            href="/faq"
            className="group relative bg-gray-900/40 backdrop-blur-sm rounded-md p-4 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 block w-full sm:w-[220px] h-[72px]"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-md">
                <svg
                  className="w-5 h-5 text-cyan-200 group-hover:text-cyan-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-base font-medium text-cyan-200 whitespace-nowrap">
                  Ask AI
                </h3>
                <p className="text-sm text-gray-400 whitespace-nowrap">
                  Get crypto insights
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover="hover" variants={cardVariants}>
          <Link
            href="/knowledge"
            className="group relative bg-gray-900/40 backdrop-blur-sm rounded-md p-3 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 block w-full sm:w-[220px] h-[75px]"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-md">
                <svg
                  className="w-5 h-5 text-cyan-200 group-hover:text-cyan-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-base font-medium text-cyan-200 whitespace-nowrap">
                  Knowledge Base
                </h3>
                <p className="text-sm text-gray-400 whitespace-nowrap">
                  Explore market analysis
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToFeatures}
          className="px-6 py-2.5 rounded-xl border border-cyan-700/50 hover:border-cyan-600 text-cyan-300 hover:bg-cyan-900/20 transition-all duration-200 text-center backdrop-blur-sm hover:shadow-lg hover:shadow-cyan-500/20 text-base sm:w-[240px]"
        >
          Discover More
        </motion.button>
      </div>

      <div
        id="features"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative p-6 bg-gray-900/50 rounded-lg border border-gray-800/50 backdrop-blur-sm">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color}/20 flex items-center justify-center mb-4`}
              >
                <feature.icon
                  className={`w-6 h-6 text-${feature.color.split("-")[1]}-400`}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Features;
