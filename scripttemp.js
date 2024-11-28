

document.addEventListener('DOMContentLoaded', function() {
    const resultadoPesquisaDiv = document.getElementById('resultado-pesquisa');

    // Limpar a div de resultados de pesquisa ao carregar a página se a flag estiver ativa
    if (sessionStorage.getItem('limparResultado') === 'true') {
        if (resultadoPesquisaDiv) {
            resultadoPesquisaDiv.innerHTML = '';
        }
        sessionStorage.setItem('limparResultado', 'false');  // Reseta a flag
    }

    // Carregar as solicitações pendentes automaticamente
    carregarSolicitacoesPendentes();
});




// Função para verificar se o usuário já está logado
document.addEventListener('DOMContentLoaded', () => {
    const usuarioAtivo = localStorage.getItem('usuarioAtivo');
    
    if (usuarioAtivo) {
        // Se o usuário já estiver logado, mostrar a interface do app
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-name').textContent = usuarioAtivo;
    } else {
        // Se não estiver logado, mostrar a interface de login
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }
});


// Função para realizar o login
function login() {
    sessionStorage.setItem('limparResultado', 'true');
    location.reload(true);
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Login realizado com sucesso") {
            alert(data.message);
            // Armazenar o nome de usuário no localStorage
            localStorage.setItem('usuarioAtivo', username);
            // Exibir a interface do app
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            document.getElementById('user-name').textContent = username;
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Erro ao realizar login:', error));
}


// Função para realizar o logout
function logout() {
    localStorage.removeItem('usuarioAtivo');
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('app-container').style.display = 'none';
}




// Função para validar o formato do nome de usuário (8 caracteres alfanuméricos)
function validarUsername(username) {
    const regex = /^[a-zA-Z0-9]{8}$/; // Exatamente 8 caracteres alfanuméricos
    return regex.test(username);
}

// Função para validar o formato da senha (6 dígitos numéricos)
function validarSenha(senha) {
    const regex = /^\d{6}$/; // Exatamente 6 dígitos numéricos
    return regex.test(senha);
}

// Função para realizar o cadastro
function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Validar formato do usuário
    if (!validarUsername(username)) {
        alert("O nome de usuário deve ter exatamente 8 caracteres alfanuméricos.");
        return;
    }

    // Validar formato da senha
    if (!validarSenha(password)) {
        alert("A senha deve ter exatamente 6 dígitos numéricos.");
        return;
    }

    // Verificar se o usuário está pré-registrado pelo administrador
    fetch(`/verificarUsuario?username=${username}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Usuário está pré-registrado, continuar com o cadastro
            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Cadastro realizado com sucesso!");
                } else {
                    alert("Erro ao cadastrar usuário.");
                }
            });
        } else {
            alert("Usuário não pré-registrado. Por favor, contacte o administrador.");
        }
    })
    .catch(error => {
        console.error('Erro ao verificar o usuário:', error);
        alert("Erro ao verificar o usuário. Tente novamente.");
    });
}



// Função para validar o formato do número de procedimento
function validarProcedimento(numero) {
    const regex = /^\d{3}-\d{5}\/\d{4}$/; // Novo formato: xxx-xxxxx/xxxx
    return regex.test(numero);
}


// Função para gerar o PDF
function gerarPDF() {
    const numeroProcedimento = document.getElementById("procedimento").value;
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Pega o usuário logado

    if (!validarProcedimento(numeroProcedimento)) {
        alert("O número do procedimento deve estar no formato xxx - xxxxx / xxxx.");
        return;
    }

    if (!usuarioAtivo) {
        alert("Usuário não está logado. Por favor, faça o login novamente.");
        return;
    }

    // Salvar o número do procedimento no banco de dados com o usuário ativo
    fetch('/salvarProcedimento', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numero: numeroProcedimento, usuario: usuarioAtivo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Gera o PDF se o procedimento foi salvo
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFont('Arial');
            doc.setFontSize(22);
            doc.text(numeroProcedimento, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2, { align: 'center' });

            const qrCodeUrl = `https://arquivo-driguatu-production.up.railway.app/leitura?procedimento=${numeroProcedimento}`;
            const qrCodeImg = generateQRCode(qrCodeUrl);
            doc.addImage(qrCodeImg, 'PNG', doc.internal.pageSize.getWidth() - 110, 10, 100, 100);

            doc.save(`procedimento_${numeroProcedimento}.pdf`);
        } else {
            alert("Erro ao salvar o procedimento: " + data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao salvar o procedimento:', error);
        alert('Erro ao salvar o procedimento. Tente novamente.');
    });
}

// Função para consultar movimentação
function consultarMovimentacao() {
    const numeroProcedimento = document.getElementById("consulta-procedimento").value;

    if (!validarProcedimento(numeroProcedimento)) {
        alert("O número do procedimento deve estar no formato xxx - xxxxx / xxxx.");
        return;
    }

    fetch(`/consultaMovimentacao?procedimento=${numeroProcedimento}`)
    .then(response => response.json())
    .then(data => {
        const resultadoDiv = document.getElementById('resultado-consulta');
        if (data.success) {
            let html = `<h3>Movimentações para o procedimento ${numeroProcedimento}:</h3><ul>`;
            data.leituras.forEach(leitura => {
                html += `<li>${leitura.usuario}, Data: ${leitura.data}, Hora: ${leitura.hora}</li>`;
            });
            html += `</ul>`;
            resultadoDiv.innerHTML = html;
        } else {
            resultadoDiv.innerHTML = `<p>${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Erro ao consultar movimentação:', error);
        document.getElementById('resultado-consulta').innerHTML = `<p>Erro ao consultar movimentação. Tente novamente.</p>`;
    });
}


// Função para gerar QR Code
function generateQRCode(text) {
    const qr = qrcode(0, 'L');
    qr.addData(text);
    qr.make();
    return qr.createDataURL();
}



function lerQRCode() {
    const qrReaderElement = document.getElementById("qr-reader");
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Pega o usuário logado

    if (!usuarioAtivo) {
        alert("Usuário não está logado. Por favor, faça o login novamente.");
        return;
    }

    qrReaderElement.style.display = "flex"; // Mostrar o leitor de QR code
    qrReaderElement.style.justifyContent = "center"; // Centralizar o leitor
    qrReaderElement.style.alignItems = "center"; // Centralizar verticalmente
    qrReaderElement.style.height = "100vh"; // Ocupa toda a altura da tela
    qrReaderElement.style.width = "100vw"; // Ocupa toda a largura da tela
    qrReaderElement.style.backgroundColor = "#000"; // Fundo preto para destaque

    const html5QrCode = new Html5Qrcode("qr-reader");
    let leituraEfetuada = false; // Flag para garantir que só uma leitura seja registrada

    // Funções para formatar a data e ajustar o horário
    function formatarData(data) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    function ajustarHoraGMT3(data) {
        const novaData = new Date(data.getTime() - 3 * 60 * 60 * 1000); // Ajuste de 3 horas para GMT -3
        const hora = String(novaData.getHours()).padStart(2, '0');
        const minutos = String(novaData.getMinutes()).padStart(2, '0');
        const segundos = String(novaData.getSeconds()).padStart(2, '0');
        return `${hora}:${minutos}:${segundos}`;
    }

    html5QrCode.start(
        { facingMode: "environment" },  // Câmera traseira
        {
            fps: 10,  // Taxa de quadros
            qrbox: { width: 250, height: 250 },  // Tamanho da caixa de leitura (quadrado central)
            aspectRatio: 1.0  // Força o formato quadrado e a orientação vertical
        },
        qrCodeMessage => {
            if (!leituraEfetuada) {
                leituraEfetuada = true; // Marca como já lido para evitar múltiplas leituras

                fetch('/leitura', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ qrCodeMessage, usuario: usuarioAtivo })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message); // Exibe mensagem de sucesso
                        window.location.href = `/comprovante?procedimento=${data.procedimento}`;
                    } else {
                        alert("Erro: " + data.message); // Exibe mensagem de erro
                    }
                    html5QrCode.stop(); // Para o leitor de QR code
                    qrReaderElement.style.display = "none"; // Esconder o leitor
                })
                .catch(error => {
                    console.error('Erro ao registrar leitura:', error);
                    alert('Erro ao registrar leitura. Tente novamente.');
                    html5QrCode.stop();
                    qrReaderElement.style.display = "none";
                });
            }
        },
        errorMessage => {
            console.log(`Erro ao ler QR Code: ${errorMessage}`);
        }
    ).catch(err => {
        console.log(`Erro ao iniciar a câmera: ${err}`);
    });
}


function lerQRCodePage() {
    window.location.href = "/leitor_qrcode.html";
}

// Função para pesquisar processos pelo login
function pesquisarPorLogin() {
    const loginPesquisa = document.getElementById('login-pesquisa').value;
    
    if (!loginPesquisa) {
        alert('Por favor, insira o número de login para pesquisar.');
        return;
    }

    // Buscar os dados no banco.json
    fetch('/dados')
        .then(response => response.json())
        .then(data => {
            const resultados = data.procedimentos.filter(procedimento => {
                // Verificar se a última leitura foi feita pelo login informado
                const ultimaLeitura = procedimento.leituras[procedimento.leituras.length - 1];
                return ultimaLeitura && ultimaLeitura.usuario === loginPesquisa;
            });

            // Exibir os resultados
            const resultadoDiv = document.getElementById('resultado-pesquisa');
            resultadoDiv.innerHTML = ''; // Limpar resultados anteriores

            if (resultados.length > 0) {
                resultados.forEach(procedimento => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <p><strong>Número do Procedimento:</strong> ${procedimento.numero}</p>
                        <p><strong>Última Leitura:</strong> ${procedimento.leituras[procedimento.leituras.length - 1].data} às ${procedimento.leituras[procedimento.leituras.length - 1].hora}</p>
                    `;
                    resultadoDiv.appendChild(div);
                });
            } else {
                resultadoDiv.innerHTML = '<p>Nenhum processo encontrado para este login.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
            alert('Erro ao buscar processos. Tente novamente.');
        });
}


// Função para solicitar a transferência de processo para outro login
function solicitarTransferencia() {
    const loginDestinatario = document.getElementById('login-transferencia').value;
    const numeroProcedimento = document.getElementById('procedimento-transferencia').value;
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Usuário logado

    if (!loginDestinatario || !numeroProcedimento) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    fetch('/solicitar-transferencia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginDestinatario, numeroProcedimento, usuarioAtivo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Solicitação enviada com sucesso!');
        } else {
            alert('Erro ao enviar solicitação: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao solicitar transferência:', error);
        alert('Erro ao solicitar transferência. Tente novamente.');
    });
}




// Função para carregar as solicitações pendentes para o usuário logado
function carregarSolicitacoesPendentes() {
    const usuarioAtivo = localStorage.getItem('usuarioAtivo'); // Usuário logado

    fetch('/dados')
        .then(response => response.json())
        .then(data => {
            const solicitacoes = data.solicitacoes.filter(solicitacao => solicitacao.loginDestinatario === usuarioAtivo && solicitacao.status === 'pendente');

            const solicitacoesDiv = document.getElementById('solicitacoes-pendentes');
            solicitacoesDiv.innerHTML = ''; // Limpar solicitações anteriores

            if (solicitacoes.length > 0) {
                solicitacoes.forEach((solicitacao) => {
                    const div = document.createElement('div');
                    div.id = `solicitacao-${solicitacao.id}`;  // Usar o ID único da solicitação
                    div.innerHTML = `
                        <p><strong>Processo:</strong> ${solicitacao.numeroProcedimento}</p>
                        <p><strong>De:</strong> ${solicitacao.loginRemetente}</p>
                        <button onclick="responderTransferencia('${solicitacao.id}', 'aceitar', this)">Aceitar</button>
                        <button onclick="responderTransferencia('${solicitacao.id}', 'recusar', this)">Recusar</button>
                    `;
                    solicitacoesDiv.appendChild(div);
                });
            } else {
                solicitacoesDiv.innerHTML = '<p>Nenhuma solicitação pendente.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar as solicitações pendentes:', error);
        });
}





function responderTransferencia(solicitacaoId, acao, botao) {
    botao.disabled = true;  // Evitar múltiplos cliques

    fetch(`/responder-transferencia/${solicitacaoId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acao })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Solicitação ' + (acao === 'aceitar' ? 'aceita' : 'recusada') + ' com sucesso!');
            document.getElementById(`solicitacao-${solicitacaoId}`).remove();  // Remove da lista
        } else {
            alert('Erro ao processar solicitação: ' + data.message);
        }
    })
    .catch(error => {
        console.error(`Erro ao processar solicitação ${solicitacaoId}:`, error);
        botao.disabled = false;  // Reabilita o botão se houver erro
    });
}




 // Função para testar leitura do banco de dados
 function testeLeitura() {
    fetch('/teste-leitura')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Leitura do banco de dados realizada com sucesso!\nDados: ' + JSON.stringify(data.banco, null, 2));
                console.log('Leitura do banco de dados:', data.banco);
            } else {
                alert('Erro ao ler banco de dados: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro ao testar leitura:', error);
            alert('Erro ao testar leitura do banco de dados.');
        });
}

// Função para testar gravação no banco de dados
function testeGravacao() {
    const dadosTeste = {
        test: "dados de teste"
    };

    fetch('/teste-gravacao', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosTeste)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Gravação no banco de dados realizada com sucesso!');
            console.log('Gravação no banco de dados realizada.');
        } else {
            alert('Erro ao gravar no banco de dados: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao testar gravação:', error);
        alert('Erro ao testar gravação no banco de dados.');
    });
}


function verificarSolicitacoes() {
    
    // Reutilizar a função de carregar as solicitações pendentes
    carregarSolicitacoesPendentes();
}
