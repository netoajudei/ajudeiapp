import React from 'react';
import { Bot, Instagram, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-deep border-t border-gray-800 pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-display font-bold text-2xl">
              <div className="w-8 h-8 bg-electric rounded-lg flex items-center justify-center">
                <Bot size={20} />
              </div>
              RestauranteIA
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              O futuro do atendimento já chegou. Automatize, converta e cresça seu negócio enquanto você dorme.
            </p>
            <div className="flex gap-4 text-gray-400 pt-4">
                <a href="#" className="hover:text-electric transition-colors"><Instagram size={20} /></a>
                <a href="#" className="hover:text-electric transition-colors"><Linkedin size={20} /></a>
                <a href="#" className="hover:text-electric transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Produto</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Demonstração</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Casos de sucesso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-6">Suporte</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Central de ajuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">WhatsApp</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Email</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Agendar call</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Termos de uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          © 2024 RestauranteIA. Feito por Pastel apps com muito café ☕
        </div>
      </div>
    </footer>
  );
};

export default Footer;