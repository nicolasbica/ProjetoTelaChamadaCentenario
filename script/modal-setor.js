// Sistema de Configuração de Setor do Painel
(function() {
    'use strict';
    
    const SETOR_STORAGE_KEY = 'painelSetor';
    
    // Elementos do DOM
    const modalSetor = document.getElementById('modalSetor');
    const btnConfigSetor = document.getElementById('btnConfigSetor');
    const botoesSetor = document.querySelectorAll('.btn-setor');
    const setorAtualTexto = document.getElementById('setorAtualTexto');
    const setorIndicator = document.getElementById('setorIndicator');
    
    // Verificar se já tem setor configurado
    let setorSelecionado = localStorage.getItem(SETOR_STORAGE_KEY);
    
    console.log(`🏥 Modal Setor: Verificando configuração... Setor atual: ${setorSelecionado || 'Não configurado'}`);
    
    // Inicializar sessionStorage com o valor do localStorage se existir
    if (setorSelecionado) {
        const sessionAtual = sessionStorage.getItem('setorAtual');
        if (!sessionAtual) {
            sessionStorage.setItem('setorAtual', setorSelecionado);
            console.log(`📋 SessionStorage inicializado com: ${setorSelecionado}`);
        }
    }
    
    // Se não tem setor, abrir modal automaticamente
    if (!setorSelecionado) {
        console.log('⚠️ Setor não configurado - abrindo modal...');
        setTimeout(() => {
            if (modalSetor) modalSetor.classList.add('active');
        }, 500);
    } else {
        atualizarInterface(setorSelecionado);
    }
    
    // Abrir modal ao clicar no botão de configuração
    if (btnConfigSetor) {
        btnConfigSetor.addEventListener('click', () => {
            console.log('⚙️ Abrindo modal de configuração...');
            if (modalSetor) modalSetor.classList.add('active');
        });
    }
    
    // Fechar modal ao clicar fora (somente se já tiver setor configurado)
    if (modalSetor) {
        modalSetor.addEventListener('click', (e) => {
            if (e.target === modalSetor) {
                if (setorSelecionado) {
                    modalSetor.classList.remove('active');
                } else {
                    mostrarAlerta('⚠️ Por favor, selecione um setor antes de continuar!');
                }
            }
        });
    }
    
    // Selecionar setor
    botoesSetor.forEach(botao => {
        botao.addEventListener('click', function() {
            const setor = this.getAttribute('data-setor');
            
            if (!setor) {
                console.error('❌ Setor inválido!');
                return;
            }
            
            console.log(`✅ Setor selecionado: ${setor}`);
            
            // Salvar no localStorage
            localStorage.setItem(SETOR_STORAGE_KEY, setor);
            setorSelecionado = setor;
            
            // Atualizar interface
            atualizarInterface(setor);
            
            // Feedback visual
            mostrarFeedback(this);
            
            // Fechar modal após 800ms
            setTimeout(() => {
                if (modalSetor) {
                    modalSetor.classList.remove('active');
                }
                
                // Verificar se realmente mudou o setor
                const setorAnterior = sessionStorage.getItem('setorAtual');
                
                // Apenas recarregar se houve mudança REAL de setor
                if (setorAnterior && setorAnterior !== setor) {
                    console.log(`🔄 Setor alterado de "${setorAnterior}" para "${setor}" - limpando inicialização e recarregando...`);
                    // Limpar flag de inicialização para forçar nova limpeza
                    sessionStorage.removeItem(`painelInicializado_${setorAnterior}`);
                    sessionStorage.removeItem(`painelInicializado_${setor}`);
                    sessionStorage.setItem('setorAtual', setor);
                    location.reload();
                } else {
                    // Mesmo setor ou primeira configuração - apenas atualizar sessionStorage
                    sessionStorage.setItem('setorAtual', setor);
                    console.log(`✅ Setor confirmado: ${setor} (sem reload)`);
                }
            }, 800);
        });
    });
    
    // Atualizar interface com setor selecionado
    function atualizarInterface(setor) {
        // Marcar visualmente o setor selecionado
        botoesSetor.forEach(botao => {
            if (botao.getAttribute('data-setor') === setor) {
                botao.classList.add('selected');
            } else {
                botao.classList.remove('selected');
            }
        });
        
        // Atualizar texto do setor atual
        const nomeSetor = setor === 'pronto-socorro' ? 'Pronto Socorro' : 'Ambulatório';
        const classeSetor = setor === 'pronto-socorro' ? 'pronto-socorro' : 'ambulatorio';
        
        if (setorAtualTexto) {
            setorAtualTexto.innerHTML = `Setor atual: <strong class="${classeSetor}">${nomeSetor}</strong>`;
        }
        
        // Mostrar indicador de setor (canto superior esquerdo)
        if (setorIndicator) {
            setorIndicator.textContent = `📍 ${nomeSetor}`;
            setorIndicator.className = `setor-indicator active ${classeSetor}`;
        }
        
        console.log(`✅ Interface atualizada para: ${nomeSetor}`);
    }
    
    // Mostrar feedback visual ao selecionar
    function mostrarFeedback(botao) {
        // Adicionar animação de sucesso
        botao.style.transform = 'scale(1.05)';
        botao.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            botao.style.transform = '';
        }, 300);
    }
    
    // Mostrar alerta simples
    function mostrarAlerta(mensagem) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Atenção',
                text: mensagem,
                confirmButtonColor: '#007bff',
                timer: 3000
            });
        } else {
            alert(mensagem);
        }
    }
    
    // Expor função globalmente para outros scripts acessarem
    window.getPainelSetor = function() {
        return localStorage.getItem(SETOR_STORAGE_KEY) || null;
    };
    
    console.log('✅ Modal de Setor inicializado');
})();
