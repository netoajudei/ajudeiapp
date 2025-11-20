"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function SupabaseConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const supabase = createClient();
    const logs: any[] = [];

    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info', data?: any) => {
      console.log(message, data);
      logs.push({ message, type, data, timestamp: new Date().toISOString() });
      setResults([...logs]);
    };

    try {
      // Test 1: Connection
      addLog('🔌 Testando conexão com Supabase...', 'info');
      const { data: connection, error: connError } = await supabase.from('profiles').select('count');
      if (connError) {
        addLog('❌ Erro na conexão', 'error', connError);
      } else {
        addLog('✅ Conexão OK', 'success');
      }

      // Test 2: List all profiles
      addLog('👥 Buscando todos os profiles...', 'info');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, empresa_id, role, nome');
      
      if (profilesError) {
        addLog('❌ Erro ao buscar profiles', 'error', profilesError);
      } else {
        addLog(`✅ Encontrados ${profiles?.length || 0} profiles`, 'success', profiles);
      }

      // Test 3: List all empresas
      addLog('🏢 Buscando todas as empresas...', 'info');
      const { data: empresas, error: empresasError } = await supabase
        .from('empresa')
        .select('id, fantasia, razaoSocial');
      
      if (empresasError) {
        addLog('❌ Erro ao buscar empresas', 'error', empresasError);
      } else {
        addLog(`✅ Encontradas ${empresas?.length || 0} empresas`, 'success', empresas);
      }

      // Test 4: Check auth session
      addLog('🔐 Verificando sessão atual...', 'info');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addLog('❌ Erro ao verificar sessão', 'error', sessionError);
      } else if (session) {
        addLog('✅ Sessão ativa', 'success', {
          user_id: session.user.id,
          email: session.user.email
        });
      } else {
        addLog('⚠️ Nenhuma sessão ativa', 'info');
      }

    } catch (error: any) {
      addLog('💥 Erro inesperado', 'error', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={runTests}
        disabled={testing}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      >
        {testing ? '🔄 Testando...' : '🧪 Testar Supabase'}
      </button>

      {results.length > 0 && (
        <div className="mt-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-white">Resultados do Teste</h3>
            <button
              onClick={() => setResults([])}
              className="text-gray-400 hover:text-white text-sm"
            >
              Limpar
            </button>
          </div>
          <div className="space-y-2 text-xs font-mono">
            {results.map((log, i) => (
              <div 
                key={i} 
                className={`p-2 rounded ${
                  log.type === 'success' ? 'bg-green-900/20 text-green-300' :
                  log.type === 'error' ? 'bg-red-900/20 text-red-300' :
                  'bg-blue-900/20 text-blue-300'
                }`}
              >
                <div className="font-bold">{log.message}</div>
                {log.data && (
                  <pre className="mt-1 text-[10px] overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

