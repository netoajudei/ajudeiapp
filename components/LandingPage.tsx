"use client";

import React, { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import Link from 'next/link';
import Hero from './Hero';
import Features from './Features';
import ChatDemo from './ChatDemo';
import SocialProof from './SocialProof';
import Comparison from './Comparison';
import Integrations from './TechStack';
import FAQ from './FAQ';
import FinalCTA from './CTA';
import Footer from './Footer';

const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Custom cursor effect
  useEffect(() => {
    const cursor = document.createElement('div');
    cursor.className = 'fixed w-8 h-8 border border-electric rounded-full pointer-events-none z-50 hidden md:block mix-blend-difference transition-transform duration-100 ease-out';
    document.body.appendChild(cursor);

    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = e.clientX - 16 + 'px';
      cursor.style.top = e.clientY - 16 + 'px';
    };

    window.addEventListener('mousemove', moveCursor);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      if(document.body.contains(cursor)) {
        document.body.removeChild(cursor);
      }
    };
  }, []);

  return (
    <div className="bg-dark min-h-screen text-white relative selection:bg-electric selection:text-white">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-electric origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-display font-bold text-2xl tracking-tighter">
            Restaurante<span className="text-electric">IA</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
            <a href="#como-funciona" className="hover:text-electric transition-colors">Como funciona</a>
            <a href="#demo" className="hover:text-electric transition-colors">Demonstração</a>
            <a href="#precos" className="hover:text-electric transition-colors">Preços</a>
          </div>
          <Link 
            href="/login"
            className="px-5 py-2 bg-white text-dark font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Login
          </Link>
        </div>
      </nav>

      <Hero />
      <Integrations />
      <div id="como-funciona"><Features /></div>
      <div id="demo"><ChatDemo /></div>
      <SocialProof />
      <Comparison />
      
      {/* Pricing Teaser */}
      <div id="precos" className="py-20 bg-electric text-white text-center">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Investimento que se paga sozinho</h2>
            <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto text-lg">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">💰 Sem custo de contratação</div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">📈 ROI em 30 dias</div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">🎯 Pague pelo uso</div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">🚀 Setup em 48h</div>
            </div>
        </div>
      </div>

      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;