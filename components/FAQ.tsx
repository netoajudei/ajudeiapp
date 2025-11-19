"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Section } from './ui/Section';
import { FAQS } from '../constants';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <Section className="bg-dark">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-display font-bold text-white mb-4">Perguntas que <span className="text-electric">todo dono faz</span></h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {FAQS.map((faq, index) => (
          <div 
            key={index} 
            className="bg-deep border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700"
          >
            <button
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              className="w-full p-6 flex items-center justify-between text-left text-white font-medium focus:outline-none"
            >
              {faq.question}
              <ChevronDown 
                className={`w-5 h-5 text-electric transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`} 
              />
            </button>
            
            <AnimatePresence>
              {activeIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-gray-800/50">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default FAQ;