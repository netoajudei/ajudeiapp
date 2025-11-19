
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import DashboardLayout from './DashboardLayout';
import { companyService } from '../../services/companyService';
import { Empresa } from '../../types';
import { 
  Loader2, Save, Store, Wifi, Cpu, Lock, 
  Smartphone, MessageSquare, Image as ImageIcon,
  AlertTriangle, Upload
} from 'lucide-react';

const SettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<Empresa>();

  // Observar a cor para o preview em tempo real
  const currentColor = watch('cor');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await companyService.getCompany();
        
        // Populate form
        Object.keys(data).forEach((key) => {
          // @ts-ignore
          setValue(key, data[key]);
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setValue]);

  const onSubmit = async (data: Empresa) => {
    setIsSaving(true);
    try {
      await companyService.updateCompany(data);
      alert("Dados da empresa atualizados com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (confirm("Um email de redefinição será enviado para o administrador. Confirmar?")) {
      await companyService.changePassword();
      alert("Email enviado!");
    }
  };

  // Componente auxiliar para Input de Array (Tags simples separadas por virgula na UI, Array no submit)
  const ArrayInput = ({ name, label, icon: Icon, placeholder }: any) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-2">
            {Icon && <Icon size={14} className="text-electric"/>} {label}
          </label>
          <input
            type="text"
            defaultValue={field.value?.join(', ')}
            onBlur={(e) => {
              // Converte string "1, 2, 3" para array ["1", "2", "3"]
              const val = e.target.value;
              if (!val) field.onChange([]);
              else field.onChange(val.split(',').map(s => s.trim()).filter(Boolean));
            }}
            className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none transition-all placeholder:text-gray-600"
            placeholder={placeholder}
          />
          <p className="text-[10px] text-gray-600 mt-1">Separe múltiplos valores por vírgula.</p>
        </div>
      )}
    />
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="animate-spin text-electric" size={40} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Perfil da Empresa</h1>
            <p className="text-gray-400">Gerencie identidade visual, conexões e comportamento da IA.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleChangePassword}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Lock size={18} />
            Alterar Senha
          </motion.button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* SEÇÃO 1: IDENTIDADE VISUAL */}
          <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-electric to-cyan-500"></div>
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Store className="text-electric" /> Identidade Visual
             </h3>

             <div className="grid md:grid-cols-3 gap-8">
                {/* Logo Preview */}
                <div className="flex flex-col items-center space-y-4">
                   <div 
                      className="w-32 h-32 rounded-2xl bg-dark border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative group"
                      style={{ borderColor: currentColor }}
                   >
                      {watch('logo') ? (
                        <img src={watch('logo') || ''} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <ImageIcon className="text-gray-600" size={32} />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload size={24} className="text-white" />
                      </div>
                   </div>
                   <p className="text-xs text-gray-500 text-center">
                      Prévia da Logo<br/>(A cor da borda segue sua cor principal)
                   </p>
                </div>

                {/* Fields */}
                <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">URL da Logo</label>
                        <input 
                           {...register('logo')}
                           className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                           placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Razão Social</label>
                        <input 
                           {...register('razaoSocial', { required: true })}
                           className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome Fantasia</label>
                        <input 
                           {...register('fantasia', { required: true })}
                           className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                        />
                    </div>

                    {/* Color Picker Manual */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Cor Principal (Hexadecimal)</label>
                        <div className="flex items-center gap-4">
                            <div 
                              className="w-12 h-12 rounded-xl border border-gray-600 shadow-lg transition-colors duration-300"
                              style={{ backgroundColor: currentColor || '#000000' }}
                            />
                            <div className="flex-1 relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">#</span>
                                <input 
                                  {...register('cor', { 
                                      required: true, 
                                      pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ 
                                  })}
                                  className="w-full bg-dark border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white font-mono uppercase focus:border-electric outline-none"
                                  placeholder="#000000"
                                />
                            </div>
                        </div>
                        {errors.cor && (
                           <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                             <AlertTriangle size={12}/> Formato inválido (Use ex: #FF0000)
                           </p>
                        )}
                    </div>
                </div>
             </div>
          </section>

          {/* SEÇÃO 2: CONEXÃO E LIMITES */}
          <section className="grid md:grid-cols-2 gap-8">
             {/* Coluna Esquerda */}
             <div className="bg-deep/50 border border-gray-800 rounded-2xl p-6 space-y-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Wifi className="text-electric" size={20} /> Conectividade
                 </h3>
                 
                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Contato Principal (WhatsApp)</label>
                    <input 
                       {...register('contatoPrincipal')}
                       className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                       placeholder="5511999999999"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Senha do WiFi</label>
                    <input 
                       {...register('senhaWiFi')}
                       className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                       placeholder="Senha para clientes"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Instância Chat (ID)</label>
                    <input 
                       {...register('instanciaChat')}
                       readOnly
                       className="w-full bg-dark/50 border border-gray-800 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed outline-none"
                    />
                 </div>
             </div>

             {/* Coluna Direita */}
             <div className="bg-deep/50 border border-gray-800 rounded-2xl p-6 space-y-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Cpu className="text-electric" size={20} /> Regras Operacionais
                 </h3>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Limite Reservas/Dia</label>
                        <input 
                           type="number"
                           {...register('LimiteDeReservasPorDia')}
                           className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Limite Pessoas/Reserva</label>
                        <input 
                           type="number"
                           {...register('LimiteDeConvidadosPorReserva')}
                           className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                        />
                     </div>
                 </div>

                 <div>
                    <label className="flex items-center gap-3 p-3 border border-gray-700 rounded-xl bg-dark/30 cursor-pointer hover:bg-dark/50 transition-colors">
                       <input 
                          type="checkbox"
                          {...register('em_teste')}
                          className="w-5 h-5 rounded bg-dark border-gray-600 text-electric focus:ring-0"
                       />
                       <span className="text-sm text-white font-medium">Modo de Teste (Sandbox)</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2 pl-1">Se ativo, o bot responde apenas aos números de teste.</p>
                 </div>
             </div>
          </section>

          {/* SEÇÃO 3: INTELIGÊNCIA ARTIFICIAL */}
          <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6 md:p-8">
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Cpu className="text-purple-400" /> Configuração da IA
             </h3>

             <div className="grid md:grid-cols-2 gap-6 mb-6">
                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Provedor da API</label>
                    <select 
                       {...register('api_provider')}
                       className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                    >
                       <option value="wappi">Wappi (Não Oficial)</option>
                       <option value="oficial">Meta Cloud API (Oficial)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Modo de Operação</label>
                    <select 
                       {...register('modo_ia')}
                       className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none"
                    >
                       <option value="prompt_unico">Prompt Único (Simples)</option>
                       <option value="multi_agent">Multi-Agente (Avançado)</option>
                    </select>
                 </div>
             </div>

             <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Prompt do Sistema (Personalidade)</label>
                <textarea 
                   {...register('prompt')}
                   rows={6}
                   className="w-full bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-electric outline-none resize-y font-mono text-sm"
                   placeholder="Você é um assistente virtual..."
                />
                <p className="text-xs text-gray-500 mt-2">
                   Defina como a IA deve se comportar, tom de voz e regras específicas de atendimento.
                </p>
             </div>
          </section>

          {/* SEÇÃO 4: CONTATOS DE NOTIFICAÇÃO */}
          <section className="bg-deep/50 border border-gray-800 rounded-2xl p-6 md:p-8">
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Smartphone className="text-green-400" /> Contatos de Notificação
             </h3>
             <p className="text-sm text-gray-400 mb-6">
                Defina quem recebe os alertas do sistema (separados por vírgula).
             </p>

             <div className="grid md:grid-cols-2 gap-6">
                <ArrayInput 
                   name="contatoSoReserva" 
                   label="Alertas de Novas Reservas" 
                   icon={MessageSquare} 
                   placeholder="5511999999999, 5511888888888" 
                />
                <ArrayInput 
                   name="contato_vagas_de_emprego" 
                   label="Alertas de Currículos/Vagas" 
                   icon={Store}
                   placeholder="5511999999999" 
                />
                <ArrayInput 
                   name="contato_fornecedores" 
                   label="Alertas de Fornecedores" 
                   icon={Store}
                   placeholder="5511999999999" 
                />
                <ArrayInput 
                   name="respostas_prontas" 
                   label="Respostas Rápidas (Botões)" 
                   icon={MessageSquare}
                   placeholder="Cardápio, Localização, Wifi" 
                />
             </div>
          </section>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end pt-4 pb-12">
              <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 disabled={isSaving}
                 type="submit"
                 className="bg-electric hover:bg-electric/90 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-electric/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                 Salvar Alterações
              </motion.button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
