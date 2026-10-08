// Inicializar Supabase
const supabase = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);

let usuarioLogado = null;

// ==================== FUNÇÕES UTILITÁRIAS ====================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function exibirErro(elementId, mensagem) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = mensagem;
        setTimeout(() => el.textContent = '', 5000);
    }
}

// ==================== LOGIN ====================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: senha
        });

        if (error) {
            exibirErro('loginError', error.message);
            return;
        }

        // Validar se tem perfil
        const { data: perfil, error: perfilError } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        if (perfilError || !perfil) {
            exibirErro('loginError', 'Seu perfil não foi encontrado.');
            await supabase.auth.signOut();
            return;
        }

        usuarioLogado = perfil;
        document.getElementById('email').value = '';
        document.getElementById('senha').value = '';

        if (perfil.papel === 'admin' || perfil.papel === 'master') {
            showPage('adminPage');
            carregarIgrejas();
        } else {
            exibirErro('loginError', 'Você não tem permissão para acessar este sistema.');
            await supabase.auth.signOut();
        }
    } catch (err) {
        exibirErro('loginError', err.message);
    }
});

// ==================== CADASTRO PÚBLICO ====================

document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nomeC').value;
    const telefone = document.getElementById('telefoneC').value;
    const email = document.getElementById('emailC').value;
    const senha = document.getElementById('senhaC').value;
    const token = document.getElementById('tokenC').value;

    try {
        const response = await fetch(window.CADASTRO_MEMBRO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                acao: 'cadastrar',
                token,
                nome,
                telefone,
                email,
                senha
            })
        });

        const resultado = await response.json();

        if (!response.ok) {
            exibirErro('cadastroError', resultado.erro || 'Erro ao cadastrar.');
            return;
        }

        alert('Cadastro realizado com sucesso! Faça login agora.');
        document.getElementById('cadastroForm').reset();
        showPage('loginPage');
    } catch (err) {
        exibirErro('cadastroError', err.message);
    }
});

// ==================== IGREJAS ====================

async function carregarIgrejas() {
    try {
        let query = supabase.from('igrejas').select('*');
        
        if (usuarioLogado.papel === 'master') {
            query = query.eq('id', usuarioLogado.igreja_id);
        }

        const { data: igrejas, error } = await query;

        if (error) throw error;

        const lista = document.getElementById('igrejasList');
        lista.innerHTML = '';

        (igrejas || []).forEach(igreja => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div>
                    <p><strong>${igreja.nome}</strong></p>
                    <p>${igreja.qtd_membros || 0} membros</p>
                </div>
                <button onclick="editarIgreja('${igreja.id}')">Editar</button>
            `;
            lista.appendChild(div);
        });
    } catch (err) {
        exibirErro('igrejaError', err.message);
    }
}

document.getElementById('novaIgrejaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (usuarioLogado.papel !== 'admin') {
        exibirErro('igrejaError', 'Só o administrador pode criar igrejas.');
        return;
    }

    const nomeIgreja = document.getElementById('nomeIgreja').value;
    const emailMaster = document.getElementById('emailMaster').value;
    const telefoneMaster = document.getElementById('telefoneMaster').value;

    try {
        const response = await fetch(window.CRIAR_LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
            },
            body: JSON.stringify({
                tipo: 'igreja',
                igreja_nome: nomeIgreja,
                nome: 'Master',
                email: emailMaster,
                telefone: telefoneMaster
            })
        });

        const resultado = await response.json();

        if (!response.ok) {
            exibirErro('igrejaError', resultado.erro || 'Erro ao criar igreja.');
            return;
        }

        alert(`Igreja criada!\nE-mail: ${resultado.email}\nSenha: ${resultado.senha}`);
        document.getElementById('novaIgrejaForm').reset();
        carregarIgrejas();
    } catch (err) {
        exibirErro('igrejaError', err.message);
    }
});

function editarIgreja(igrejaId) {
    alert('Funcionalidade em desenvolvimento.');
}

// ==================== LOGOUT ====================

async function logout() {
    await supabase.auth.signOut();
    usuarioLogado = null;
    showPage('loginPage');
    document.getElementById('loginForm').reset();
}

// ==================== INICIALIZAÇÃO ====================

window.addEventListener('load', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const { data: perfil } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
        
        if (perfil && (perfil.papel === 'admin' || perfil.papel === 'master')) {
            usuarioLogado = perfil;
            showPage('adminPage');
            carregarIgrejas();
        } else {
            showPage('loginPage');
        }
    } else {
        showPage('loginPage');
    }
});