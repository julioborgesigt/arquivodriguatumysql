// Função de login
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Login realizado com sucesso!');
                localStorage.setItem('usuarioAtivo', data.user.username);
                window.location.href = '/dashboard.html'; // Redireciona para a página principal
            } else {
                alert(data.message);
            }
        })
        .catch(err => {
            console.error('Erro ao fazer login:', err);
        });
}

// Função de cadastro
function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Usuário registrado com sucesso!');
                window.location.href = '/';
            } else {
                alert(data.message);
            }
        })
        .catch(err => {
            console.error('Erro ao registrar usuário:', err);
        });
}

// Função para consultar movimentações
function consultarMovimentacao() {
    const tipoProcedimento = document.getElementById('consulta-tipo-procedimento').value;
    const numeroProcedimento = document.getElementById('consulta-procedimento').value;

    // Combina o tipo e o número do procedimento
    const numeroCompleto = `${tipoProcedimento}-${numeroProcedimento}`;

    fetch(`/consultaMovimentacao?procedimento=${numeroCompleto}`)
        .then(response => response.json())
        .then(data => {
            const resultadoDiv = document.getElementById('resultado-consulta');
            resultadoDiv.innerHTML = ''; // Limpa resultados anteriores

            if (data.success) {
                let html = `<h3>Movimentações para o procedimento ${numeroCompleto}:</h3>`;
                html += `
                    <table>
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Data</th>
                                <th>Hora</th>
                                <th>Observações</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                data.leituras.forEach(leitura => {
                    html += `
                        <tr>
                            <td>${leitura.usuario}</td>
                            <td>${leitura.data}</td>
                            <td>${leitura.hora}</td>
                            <td>${leitura.observacoes || 'N/A'}</td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
                resultadoDiv.innerHTML = html;
            } else {
                resultadoDiv.innerHTML = `<p>${data.message}</p>`;
            }
        })
        .catch(err => {
            console.error('Erro ao consultar movimentação:', err);
        });
}

// Função para solicitar transferência
function solicitarTransferencia() {
    const loginRemetente = localStorage.getItem('usuarioAtivo');
    const loginDestinatario = document.getElementById('login-transferencia').value;
    const numeroProcedimento = document.getElementById('procedimento-transferencia').value;
    const observacoes = document.getElementById('observacoes-transferencia').value;

    if (!loginDestinatario || !numeroProcedimento) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    fetch('/solicitarTransferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_remetente: loginRemetente, login_destinatario: loginDestinatario, numero_procedimento: numeroProcedimento, observacoes })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Solicitação de transferência enviada com sucesso!');
                document.getElementById('login-transferencia').value = '';
                document.getElementById('procedimento-transferencia').value = '';
                document.getElementById('observacoes-transferencia').value = '';
            } else {
                alert(data.message);
            }
        })
        .catch(err => {
            console.error('Erro ao solicitar transferência:', err);
        });
}

// Função para buscar lista de usuários (usada para "Selecionar Login")
function exibirUsuariosParaCampo(campoId) {
    fetch('/usuarios')
        .then(response => response.json())
        .then(data => {
            const listaUsuariosDiv = document.getElementById('lista-usuarios');
            listaUsuariosDiv.innerHTML = ''; // Limpa a lista

            if (data.success) {
                data.usuarios.forEach(usuario => {
                    const usuarioItem = document.createElement('div');
                    usuarioItem.className = 'usuario-item';
                    usuarioItem.textContent = `${usuario.name} (${usuario.username})`;
                    usuarioItem.onclick = () => {
                        document.getElementById(campoId).value = usuario.username;
                        listaUsuariosDiv.style.display = 'none'; // Esconde a lista
                    };
                    listaUsuariosDiv.appendChild(usuarioItem);
                });
                listaUsuariosDiv.style.display = 'block'; // Mostra a lista
            } else {
                alert('Nenhum usuário encontrado.');
            }
        })
        .catch(err => {
            console.error('Erro ao buscar lista de usuários:', err);
        });
}
