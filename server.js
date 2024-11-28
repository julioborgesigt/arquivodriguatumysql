const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');


const app = express();
const port = 3000;


// Configuração do banco de dados
const sequelize = new Sequelize('deyaoj_banco', 'deyaoj_banco', 'NUA2Cy5oxa', {
    host: 'mysql-ag-br1-20.conteige.cloud',
    dialect: 'mysql'
});

// Testar a conexão
sequelize.authenticate()
    .then(() => console.log('Conexão bem-sucedida com o banco de dados!'))
    .catch(err => console.error('Erro ao conectar ao banco de dados:', err));

// Definição dos modelos
const Usuario = sequelize.define('Usuario', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false }
});

const Procedimento = sequelize.define('Procedimento', {
    numero: { type: DataTypes.STRING, allowNull: false, unique: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false }
});

const Leitura = sequelize.define('Leitura', {
    procedimento_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.DATEONLY, allowNull: false },
    hora: { type: DataTypes.TIME, allowNull: false },
    observacoes: { type: DataTypes.STRING }
});

const Solicitacao = sequelize.define('Solicitacao', {
    login_remetente: { type: DataTypes.INTEGER, allowNull: false },
    login_destinatario: { type: DataTypes.INTEGER, allowNull: false },
    numero_procedimento: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pendente', 'aceita', 'recusada'), allowNull: false }
});

// Sincronizar os modelos com o banco de dados
sequelize.sync();

// Middlewares
app.use(express.json());
app.use(express.static('public'));

// Rotas


// Serve o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});



/*
// Rota de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile('banco.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro ao ler o banco de dados" });
        }

        const bancoDados = JSON.parse(data);

        // Verificar se o usuário existe e a senha está correta
        const usuario = bancoDados.usuarios.find(u => u.username === username && u.password === password);

        if (usuario) {
            res.status(200).json({ message: "Login realizado com sucesso", usuario: usuario });
        } else {
            res.status(401).json({ message: "Usuário ou senha incorretos" });
        }
    });
});

*/

/*
// Rota de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile('banco.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro ao ler o banco de dados" });
        }

        const bancoDados = JSON.parse(data);

        // Verificar se o usuário existe e a senha está correta
        const usuario = bancoDados.usuarios.find(u => u.username === username && u.password === password);

        if (usuario) {
            res.status(200).json({ message: "Login realizado com sucesso", usuario: usuario });
        } else {
            res.status(401).json({ message: "Usuário ou senha incorretos" });
        }
    });
});

*/

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile('banco.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erro ao ler o banco de dados" });
        }

        const bancoDados = JSON.parse(data);

        // Verificar se o usuário existe e a senha está correta
        const usuario = bancoDados.usuarios.find(u => u.username === username && u.password === password);

        if (usuario) {
            // Verificar solicitações pendentes
            const pendentes = bancoDados.solicitacoes.filter(
                solicitacao => solicitacao.loginDestinatario === username && solicitacao.status === "pendente"
            );

            res.status(200).json({ 
                message: "Login realizado com sucesso", 
                usuario: usuario, 
                possuiPendentes: pendentes.length > 0 
            });
        } else {
            res.status(401).json({ message: "Usuário ou senha incorretos" });
        }
    });
});



// Rota para verificar o login de administrador
app.post('/login-admin', (req, res) => {
    const { username, password } = req.body;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    // Verificar se o usuário e senha estão corretos
    const admin = banco.usuarios.find(user => user.username === '00000000' && user.password === '789654321');

    if (username === admin.username && password === admin.password) {
        res.status(200).json({ success: true, message: "Login realizado com sucesso" });
    } else {
        res.status(401).json({ success: false, message: "Usuário ou senha incorretos" });
    }
});


// Rota de cadastro (register)
app.post('/register', (req, res) => {
    const { username, password, name } = req.body;

    // Validar que a senha tem exatamente 6 dígitos numéricos
    if (!/^\d{6}$/.test(password)) {
        return res.status(400).json({ success: false, message: "A senha deve ter exatamente 6 dígitos numéricos." });
    }

    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    // Verificar se o usuário existe e ainda não tem senha
    const usuario = banco.usuarios.find(user => user.username === username && user.password === null);

    if (usuario) {
        // Usuário está pré-cadastrado, agora cadastrar a senha
        usuario.password = password; // Define a nova senha
        usuario.name = name;
        fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));
        res.json({ success: true, message: "Senha cadastrada com sucesso!" });
    } else {
        res.status(400).json({ success: false, message: "Usuário não encontrado ou já possui senha." });
    }
});


app.post('/leitura', (req, res) => {
    console.log("Entrou na rota /leitura");
    const { qrCodeMessage, usuario } = req.body; // Receber o usuário logado junto com o QR code
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    // Captura a hora atual e ajusta para GMT-3
    const dataAtual = new Date();
    dataAtual.setHours(dataAtual.getHours() - 3);
    const horaAjustada = dataAtual.toTimeString().split(' ')[0]; // Formato HH:MM:SS
    console.log("Hora ajustada para GMT-3:", horaAjustada);

    // Tentar extrair o número do procedimento da URL ou usar o valor diretamente
    let numeroProcedimento;
    try {
        const url = new URL(qrCodeMessage);
        numeroProcedimento = url.searchParams.get('procedimento');
    } catch (error) {
        numeroProcedimento = qrCodeMessage; // Caso não seja uma URL, usar o valor diretamente
    }

    console.log("Número do procedimento:", numeroProcedimento);

    if (!numeroProcedimento) {
        return res.status(400).json({ success: false, message: "Número do procedimento não encontrado na URL ou no QR code." });
    }

    // Procurar o procedimento correspondente no banco de dados
    const procedimento = banco.procedimentos.find(p => p.numero === numeroProcedimento);

    if (procedimento) {
        // Adicionar a leitura ao procedimento
        procedimento.leituras.push({
            usuario, // Nome do usuário logado
            data: dataAtual.toISOString().split('T')[0], // Data no formato YYYY-MM-DD
            hora: horaAjustada // Hora ajustada para GMT-3
        });

        // Salvar o banco de dados atualizado
        fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));
        console.log("Leitura registrada com sucesso para o procedimento:", numeroProcedimento);

        res.json({ success: true, message: "Leitura registrada com sucesso!", procedimento: numeroProcedimento });
    } else {
        console.log("Procedimento não encontrado:", numeroProcedimento);
        res.status(404).json({ success: false, message: "Procedimento não encontrado!" });
    }
});





// Rota para salvar o procedimento no banco de dados
app.post('/salvarProcedimento', (req, res) => {
    const { numero, usuario } = req.body;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    // Verificar se o número do procedimento está no novo formato
    const regex = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/;
    if (!regex.test(numero)) {
        return res.status(400).json({ success: false, message: "Formato inválido para o número do procedimento." });
    }

    // Verificar se o procedimento já existe
    const procedimentoExistente = banco.procedimentos.find(p => p.numero === numero);

    if (procedimentoExistente) {
        return res.json({ success: true, message: "Procedimento já existe." });
    }

    // Adicionar o novo procedimento com o usuário que o registrou
    banco.procedimentos.push({
        numero: numero,
        usuario: usuario, // Salvar o nome do usuário logado
        leituras: []
    });

    // Salvar no banco de dados
    fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));

    res.json({ success: true, message: "Procedimento salvo com sucesso." });
});






// Rota para exibir o comprovante
app.get('/comprovante', (req, res) => {
    const numeroProcedimento = req.query.procedimento;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    // Procurar o procedimento correspondente
    const procedimento = banco.procedimentos.find(p => p.numero === numeroProcedimento);

    if (procedimento) {
        // Renderizar uma página de comprovante
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Comprovante de Leitura</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { text-align: center; margin-top: 50px; }
                    .info { font-size: 18px; }
                    .info p { margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Comprovante de Leitura</h1>
                    <div class="info">
                        <p><strong>Procedimento:</strong> ${numeroProcedimento}</p>
                        <p><strong>Última Leitura:</strong> ${procedimento.leituras[procedimento.leituras.length - 1].data} ${procedimento.leituras[procedimento.leituras.length - 1].hora}</p>
                        <p><strong>Usuário:</strong> ${procedimento.leituras[procedimento.leituras.length - 1].usuario}</p>
                    </div>
                    <button onclick="window.print()">Imprimir Comprovante</button>
                </div>
            </body>
            </html>
        `);
    } else {
        res.status(404).send('Procedimento não encontrado.');
    }
});



// Rota para servir a página de consulta
app.get('/consulta', (req, res) => {
    res.sendFile(path.join(__dirname, 'consulta.html'));
});

// Rota para obter os dados do banco.json
app.get('/dados', (req, res) => {
    fs.readFile('banco.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: "Erro ao ler o banco de dados" });
        } else {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        }
    });
});


app.get('/consultaMovimentacao', (req, res) => {
    const { procedimento } = req.query;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    // Verificar se o número do procedimento está no formato válido
    const regex = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/;
    if (!regex.test(procedimento)) {
        return res.status(400).json({ success: false, message: "Formato inválido para o número do procedimento." });
    }

    // Procurar o procedimento correspondente no banco de dados
    const procedimentoEncontrado = banco.procedimentos.find(p => p.numero === procedimento);

    // Garantir que estamos buscando observações relacionadas ao procedimento correto
    const solicitacao = banco.solicitacoes.find(s => s.numeroProcedimento === procedimento);

    if (procedimentoEncontrado) {
        res.json({
            success: true,
            leituras: procedimentoEncontrado.leituras,
            observacoes: solicitacao ? solicitacao.observacoesProcedimento : "Nenhuma observação registrada." // Inclui observações ou mensagem padrão
        });
    } else {
        res.json({ success: false, message: "Procedimento não encontrado." });
    }
});






// Rota para pré-cadastrar um usuário
app.post('/preCadastro', (req, res) => {
    const { username } = req.body;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    if (banco.usuarios.find(user => user.username === username)) {
        return res.json({ success: false, message: "Usuário já existe." });
    }

    banco.usuarios.push({ username, password: null }); // Usuário pré-cadastrado sem senha
    fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));
    res.json({ success: true, message: "Usuário pré-cadastrado com sucesso." });
});

// Rota para verificar se o usuário está pré-registrado
app.get('/verificarUsuario', (req, res) => {
    const { username } = req.query;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    const usuarioEncontrado = banco.usuarios.find(user => user.username === username && user.password === null);

    if (usuarioEncontrado) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Usuário não pré-registrado." });
    }
});

// Rota para resetar senha
app.post('/resetSenha', (req, res) => {
    const { username } = req.body;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    const usuario = banco.usuarios.find(user => user.username === username);
    if (usuario) {
        usuario.password = null; // Reseta a senha
        fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));
        res.json({ success: true, message: "Senha resetada com sucesso." });
    } else {
        res.json({ success: false, message: "Usuário não encontrado." });
    }
});

// Servir a página administrador.html
app.get('/administrador.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'administrador.html'));
});





// Servir a página login_admin.html
app.get('/login_admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login_admin.html'));
});

// Servir a página index.html
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});



// Rota para obter os dados do banco.json
app.get('/dados', (req, res) => {
    fs.readFile('banco.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: "Erro ao ler o banco de dados" });
        } else {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        }
    });
});



// Variável de bloqueio (lock)
let lock = false;

// Rota para solicitar transferência
app.post('/solicitar-transferencia', (req, res) => {
    const { loginDestinatario, numeroProcedimento, usuarioAtivo, observacoesProcedimento } = req.body;

    // Ler o banco de dados existente
    let banco;
    try {
        banco = JSON.parse(fs.readFileSync(bancoFilePath, 'utf8'));
        console.log('Banco de dados lido com sucesso!');
    } catch (error) {
        console.error('Erro ao ler o banco de dados:', error);
        return res.status(500).json({ success: false, message: "Erro ao ler o banco de dados." });
    }

    // Verificar se o número do procedimento está no novo formato
    const regex = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/;
    if (!regex.test(numeroProcedimento)) {
        return res.status(400).json({ success: false, message: "Formato inválido para o número do procedimento." });
    }

    // Verificar se o processo e o login destinatário existem
    const procedimento = banco.procedimentos.find(p => p.numero === numeroProcedimento);
    const destinatarioExiste = banco.usuarios.find(user => user.username === loginDestinatario);

    if (!procedimento || !destinatarioExiste) {
        return res.status(400).json({ success: false, message: "Processo ou login inválido." });
    }

    // Adicionar solicitação de transferência ao banco
    banco.solicitacoes.push({
        id: Math.random().toString(36).substr(2, 9),  // ID único
        loginRemetente: usuarioAtivo,
        loginDestinatario,
        numeroProcedimento,
        observacoesProcedimento,
        status: "pendente"
    });

    // Gravar o banco de dados atualizado
    try {
        fs.writeFileSync(bancoFilePath, JSON.stringify(banco, null, 2));
        console.log('Solicitação de transferência enviada e banco de dados atualizado!');
        res.json({ success: true, message: "Solicitação de transferência enviada." });
    } catch (error) {
        console.error('Erro ao salvar o banco de dados:', error);
        res.status(500).json({ success: false, message: "Erro ao salvar o banco de dados." });
    }
});




// Rota para responder a solicitação de transferência
app.post('/responder-transferencia/:id', (req, res) => {
    if (lock) {
        return res.status(503).json({ success: false, message: "Outra operação em andamento. Tente novamente." });
    }

    lock = true;  // Bloquear operações simultâneas
    const { acao } = req.body;
    const solicitacaoId = req.params.id;

    // Ler o banco de dados existente
    let banco;
    try {
        banco = JSON.parse(fs.readFileSync(bancoFilePath, 'utf8'));
        console.log('Banco de dados carregado com sucesso!');
    } catch (error) {
        lock = false;
        console.error('Erro ao carregar banco de dados:', error);
        return res.status(500).json({ success: false, message: "Erro ao carregar banco de dados." });
    }

    // Verificar se a solicitação existe
    const solicitacao = banco.solicitacoes.find(s => s.id === solicitacaoId);
    if (!solicitacao) {
        lock = false;
        return res.status(404).json({ success: false, message: "Solicitação não encontrada." });
    }

    // Ação de aceitar ou recusar
    if (acao === 'aceitar') {
        solicitacao.status = 'aceita';
        // Captura a hora atual
        let dataAtual = new Date();

        // Subtrai 3 horas do horário atual
        dataAtual.setHours(dataAtual.getHours() - 3);

        // Formata a hora no formato HH:MM:SS
        const horaAjustada = dataAtual.toTimeString().split(' ')[0]; // Agora a hora está ajustada para GMT -3

        console.log(horaAjustada);

        // Encontrar o processo e adicionar nova leitura
        const procedimento = banco.procedimentos.find(p => p.numero === solicitacao.numeroProcedimento);
        if (!procedimento) {
            lock = false;
            return res.status(404).json({ success: false, message: "Processo não encontrado." });
        }
        

        procedimento.leituras.push({
            usuario: solicitacao.loginDestinatario,
            data: new Date().toISOString().split('T')[0], // Data no formato YYYY-MM-DD
            hora: horaAjustada, // Hora ajustada para GMT -3
            observacoesProcedimento: solicitacao.observacoesProcedimento
        });

        console.log(`Leitura adicionada para o login ${solicitacao.loginDestinatario}`);
    } else if (acao === 'recusar') {
        solicitacao.status = 'recusada';
        console.log(`Solicitação ${solicitacaoId} recusada`);
    }

    // Gravar o banco de dados atualizado
    try {
        fs.writeFileSync(bancoFilePath, JSON.stringify(banco, null, 2));
        console.log('Banco de dados atualizado com sucesso!');
        lock = false;  // Liberar o bloqueio
        res.json({ success: true, message: `Solicitação ${acao === 'aceitar' ? 'aceita' : 'recusada'} com sucesso!` });
    } catch (error) {
        lock = false;  // Liberar o bloqueio em caso de erro
        console.error('Erro ao salvar banco de dados:', error);
        return res.status(500).json({ success: false, message: "Erro ao salvar banco de dados." });
    }
});






app.post('/salvar-dados', (req, res) => {
    const bancoAtualizado = req.body;

    try {
        fs.writeFileSync('banco.json', JSON.stringify(bancoAtualizado, null, 2));
        res.json({ success: true, message: "Dados salvos com sucesso!" });
    } catch (error) {
        console.error('Erro ao salvar banco de dados:', error);
        res.status(500).json({ success: false, message: "Erro ao salvar banco de dados." });
    }
});



// Leitura
app.get('/teste-leitura', (req, res) => {
    console.log(`Tentando ler o arquivo: ${bancoFilePath}`);
    try {
        const banco = JSON.parse(fs.readFileSync(bancoFilePath, 'utf8'));
        console.log('Banco de dados lido com sucesso:', banco);
        res.json({ success: true, message: "Banco de dados lido com sucesso!", banco });
    } catch (error) {
        console.error('Erro ao ler o banco de dados:', error);
        res.status(500).json({ success: false, message: "Erro ao ler o banco de dados." });
    }
});




// Caminho absoluto para o arquivo banco.json
const bancoFilePath = path.join(__dirname, 'banco.json');

// Rota para testar gravação no banco de dados
app.post('/teste-gravacao', (req, res) => {
    const dados = req.body;
    
    // Ler o banco de dados existente
    let banco;
    try {
        banco = JSON.parse(fs.readFileSync(bancoFilePath, 'utf8'));
        console.log('Banco de dados lido com sucesso!');
    } catch (error) {
        console.error('Erro ao ler o banco de dados:', error);
        return res.status(500).json({ success: false, message: "Erro ao ler o banco de dados." });
    }

    // Adicionar os dados de teste ao banco de dados
    banco.testes = banco.testes || []; // Seção de testes no banco
    banco.testes.push(dados);

    // Gravar o banco de dados atualizado
    try {
        fs.writeFileSync(bancoFilePath, JSON.stringify(banco, null, 2));
        console.log('Banco de dados salvo com sucesso!');
        res.json({ success: true, message: "Banco de dados salvo com sucesso!" });
    } catch (error) {
        console.error('Erro ao salvar o banco de dados:', error);
        res.status(500).json({ success: false, message: "Erro ao salvar o banco de dados." });
    }
});


app.post('/converterProcedimento', (req, res) => {
    const { antigoNumeroCompleto, novoTipo, novoNumero } = req.body;

    // Carregar banco de dados
    let banco;
    try {
        banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));
    } catch (error) {
        return res.status(500).json({ success: false, message: "Erro ao carregar banco de dados." });
    }

    // Localizar o procedimento e validar a existência
    const procedimento = banco.procedimentos.find(p => p.numero === antigoNumeroCompleto);
    if (!procedimento) {
        return res.status(404).json({ success: false, message: "Procedimento não encontrado." });
    }

    // Validar formato do novo número
    const regexNovoNumero = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/; // Formato do novo número
    if (!regexNovoNumero.test(novoNumero)) {
        return res.status(400).json({ success: false, message: "Formato inválido para a nova numeração." });
    }

    // Alterar o tipo e número do procedimento
    procedimento.numero = `${novoNumero}`;

    // Salvar alterações
    try {
        fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));
        res.json({ success: true, message: "Procedimento convertido com sucesso." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao salvar banco de dados." });
    }
});
// Extrair o número do procedimento da URL do QR code
    //const urlParams = new URLSearchParams(new URL(qrCodeMessage).search);
    //const regexProcedimento = urlParams.get('procedimento');



   // alert('antes da verificação');

   app.post('/transferencias-em-massa', (req, res) => {
    const { loginDestinatario, loginRemetente, procedimentos } = req.body;
    const banco = JSON.parse(fs.readFileSync('banco.json', 'utf8'));

    if (!banco.usuarios.find(user => user.username === loginDestinatario)) {
        return res.status(400).json({ success: false, message: 'Login do destinatário não encontrado.' });
    }

    procedimentos.forEach(numeroProcedimento => {
        banco.solicitacoes.push({
            id: Math.random().toString(36).substr(2, 9),
            loginRemetente,
            loginDestinatario,
            numeroProcedimento,
            status: 'pendente'
        });
    });

    fs.writeFileSync('banco.json', JSON.stringify(banco, null, 2));
    res.json({ success: true, message: 'Transferências registradas com sucesso!' });
});







// Rota para verificar se existe uma solicitação pendente para um procedimento
app.get('/verificarSolicitacaoPendente', (req, res) => {
    const { procedimento } = req.query;

    // Carregar banco de dados
    let banco;
    try {
        banco = JSON.parse(fs.readFileSync(bancoFilePath, 'utf8'));
    } catch (error) {
        return res.status(500).json({ success: false, message: "Erro ao carregar banco de dados." });
    }

    // Verificar se há uma solicitação pendente para o procedimento
    const solicitacaoPendente = banco.solicitacoes.some(
        (s) => s.numeroProcedimento === procedimento && s.status === 'pendente'
    );

    res.json({ pendente: solicitacaoPendente });
});








// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
