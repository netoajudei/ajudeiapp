import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Section } from './ui/Section';
import { TESTIMONIALS } from '../constants';

const SocialProof = () => {
  return (
    <Section className="bg-deep">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-display font-bold text-white mb-4">
            Resultados que <span className="text-cyan-400">enchem seu salão</span>
          </h2>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <motion.div 
            whileHover={{ y: -10 }}
            className="glass-card p-8 rounded-2xl text-center border-t-4 border-t-electric"
          >
            <div className="text-5xl font-bold text-white mb-2 font-display">300+</div>
            <p className="text-gray-400">Mensagens/dia respondidas sem contratar ninguém</p>
          </motion.div>
          <motion.div 
             whileHover={{ y: -10 }}
             className="glass-card p-8 rounded-2xl text-center border-t-4 border-t-cyan-400"
          >
            <div className="text-5xl font-bold text-white mb-2 font-display">3X</div>
            <p className="text-gray-400">Retorno sobre investimento no primeiro mês</p>
          </motion.div>
          <motion.div 
             whileHover={{ y: -10 }}
             className="glass-card p-8 rounded-2xl text-center border-t-4 border-t-purple-500"
          >
            <div className="text-5xl font-bold text-white mb-2 font-display">0%</div>
            <p className="text-gray-400">De chance de perder lead por demora na resposta</p>
          </motion.div>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="bg-dark p-8 rounded-2xl border border-gray-800 relative"
            >
              <Quote className="absolute top-8 right-8 text-gray-800 w-12 h-12" />
              <div className="flex gap-1 mb-6">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 mb-8 relative z-10 italic">"{item.content}"</p>
              <div className="flex items-center gap-4">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover border-2 border-electric" />
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.restaurant}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default SocialProof;