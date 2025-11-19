"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Section } from './ui/Section';
import { PAIN_POINTS, FEATURES } from '../constants';
import { CheckCircle } from 'lucide-react';

const Features = () => {
  return (
    <>
      {/* Problems Section */}
      <Section className="bg-deep relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Por que você está <span className="text-red-500">perdendo clientes</span>
          </h2>
          <p className="text-gray-400 text-lg">
            O atendimento tradicional está sangrando seu faturamento. Veja os sintomas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PAIN_POINTS.map((point, index) => (
            <motion.div
              key={point.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="glass-card p-8 rounded-2xl hover:bg-white/5 transition-colors duration-300 border border-white/5 group"
            >
              <div className={`w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <point.icon className={`w-7 h-7 ${point.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{point.title}</h3>
              <p className="text-gray-400 leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-mono">
            ⚠ 73% dos clientes desistem se não recebem resposta em 1 hora
          </div>
        </div>
      </Section>

      {/* Solution Section */}
      <Section className="bg-dark">
        <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-electric font-mono text-sm tracking-wider uppercase mb-2 block">Solução Definitiva</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-white">
                IA que atende como seu <span className="text-electric">melhor garçom</span>
            </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
                <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-gradient-to-b from-[#1A2025] to-[#0f1316] border border-gray-800 hover:border-electric/50 transition-all group hover:shadow-[0_0_20px_rgba(34,147,221,0.1)]"
                >
                    <div className="w-12 h-12 rounded-lg bg-electric/10 flex items-center justify-center mb-4 group-hover:bg-electric text-electric group-hover:text-white transition-colors">
                        <feature.icon size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
            ))}
        </div>
      </Section>
    </>
  );
};

export default Features;