const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do banco de dados
const sequelize = new Sequelize('nome_do_banco', 'usuario', 'senha', {
    host: 'endereco_do_servidor', // Exemplo: localhost ou mysql-ag-br1-20.conteige.cloud
    dialect: 'mysql',
    logging: false
});

// Testar conexão com o banco de dados
sequelize.authenticate()
    .then(() => console.log('Conexão bem-sucedida com o banco de dados!'))
    .catch(err => console.error('Erro ao conectar ao banco de dados:', err));

// Definição dos modelos
const Usuario = sequelize.define('Usuario', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING }
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
    login_remetente: { type: DataTypes.STRING, allowNull: false },
    login_destinatario: { type: DataTypes.STRING, allowNull: false },
    numero_procedimento: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pendente', 'aceita', 'recusada'), allowNull: false }
});

// Sincronizar os modelos com o banco de dados
sequelize.sync();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas

// Página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const usuario = await Usuario.findOne({ where: { username, password } });
        if (!usuario) {
            return res.status(401).json({ message: "Usuário ou senha incorretos" });
        }

        // Verificar solicitações pendentes
        const pendentes = await Solicitacao.findAll({
            where: { login_destinatario: username, status: 'pendente' }
        });

        res.json({
            message: "Login realizado com sucesso",
            usuario,
            possuiPendentes: pendentes.length > 0
        });
    } catch (err) {
        console.error('Erro ao realizar login:', err);
        res.status(500).json({ message: "Erro ao realizar login" });
    }
});

// Cadastro de usuários
app.post('/register', async (req, res) => {
    const { username, password, name } = req.body;

    if (!/^\d{6}$/.test(password)) {
        return res.status(400).json({ success: false, message: "A senha deve ter exatamente 6 dígitos numéricos." });
    }

    try {
        const usuario = await Usuario.create({ username, password, name });
        res.json({ success: true, message: "Usuário registrado com sucesso!", usuario });
    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
        res.status(500).json({ success: false, message: "Erro ao registrar usuário." });
    }
});


app.post('/leitura', async (req, res) => {
    const { qrCodeMessage, usuario } = req.body;

    // Ajusta a hora para GMT-3
    const dataAtual = new Date();
    dataAtual.setHours(dataAtual.getHours() - 3);
    const dataFormatada = dataAtual.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaFormatada = dataAtual.toTimeString().split(' ')[0]; // HH:MM:SS

    let numeroProcedimento;
    try {
        const url = new URL(qrCodeMessage);
        numeroProcedimento = url.searchParams.get('procedimento');
    } catch (error) {
        numeroProcedimento = qrCodeMessage;
    }

    if (!numeroProcedimento) {
        return res.status(400).json({ success: false, message: "Número do procedimento não encontrado na URL ou no QR code." });
    }

    try {
        // Verifica se o procedimento existe
        const procedimento = await Procedimento.findOne({ where: { numero: numeroProcedimento } });
        if (!procedimento) {
            return res.status(404).json({ success: false, message: "Procedimento não encontrado!" });
        }

        // Registra a leitura
        const usuarioObj = await Usuario.findOne({ where: { username: usuario } });
        if (!usuarioObj) {
            return res.status(404).json({ success: false, message: "Usuário não encontrado!" });
        }

        await Leitura.create({
            procedimento_id: procedimento.id,
            usuario_id: usuarioObj.id,
            data: dataFormatada,
            hora: horaFormatada,
            observacoes: null
        });

        res.json({ success: true, message: "Leitura registrada com sucesso!", procedimento: numeroProcedimento });
    } catch (err) {
        console.error('Erro ao registrar leitura:', err);
        res.status(500).json({ success: false, message: "Erro ao registrar leitura." });
    }
});


app.post('/salvarProcedimento', async (req, res) => {
    const { numero, usuario } = req.body;

    // Verificar se o número do procedimento está no formato correto
    const regex = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/;
    if (!regex.test(numero)) {
        return res.status(400).json({ success: false, message: "Formato inválido para o número do procedimento." });
    }

    try {
        // Verifica se o procedimento já existe
        const procedimentoExistente = await Procedimento.findOne({ where: { numero } });
        if (procedimentoExistente) {
            return res.json({ success: true, message: "Procedimento já existe." });
        }

        // Verifica se o usuário existe
        const usuarioObj = await Usuario.findOne({ where: { username: usuario } });
        if (!usuarioObj) {
            return res.status(404).json({ success: false, message: "Usuário não encontrado!" });
        }

        // Cria o novo procedimento
        await Procedimento.create({
            numero,
            usuario_id: usuarioObj.id
        });

        res.json({ success: true, message: "Procedimento salvo com sucesso." });
    } catch (err) {
        console.error('Erro ao salvar procedimento:', err);
        res.status(500).json({ success: false, message: "Erro ao salvar procedimento." });
    }
});


// Consulta movimentações
app.get('/consultaMovimentacao', async (req, res) => {
    const { procedimento } = req.query;

    try {
        const proc = await Procedimento.findOne({ where: { numero: procedimento } });
        if (!proc) {
            return res.status(404).json({ success: false, message: "Procedimento não encontrado." });
        }

        const leituras = await Leitura.findAll({
            where: { procedimento_id: proc.id },
            include: { model: Usuario, attributes: ['username'] }
        });

        res.json({ success: true, leituras });
    } catch (err) {
        console.error('Erro ao consultar movimentações:', err);
        res.status(500).json({ success: false, message: "Erro ao consultar movimentações." });
    }
});

app.post('/preCadastro', async (req, res) => {
    const { username } = req.body;

    try {
        // Verificar se o usuário já existe
        const usuarioExistente = await Usuario.findOne({ where: { username } });
        if (usuarioExistente) {
            return res.json({ success: false, message: "Usuário já existe." });
        }

        // Criar o usuário pré-cadastrado
        await Usuario.create({ username, password: null, name: null });
        res.json({ success: true, message: "Usuário pré-cadastrado com sucesso." });
    } catch (err) {
        console.error('Erro ao pré-cadastrar usuário:', err);
        res.status(500).json({ success: false, message: "Erro ao pré-cadastrar usuário." });
    }
});


app.get('/verificarUsuario', async (req, res) => {
    const { username } = req.query;

    try {
        const usuario = await Usuario.findOne({ where: { username, password: null } });
        if (usuario) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Usuário não pré-registrado." });
        }
    } catch (err) {
        console.error('Erro ao verificar usuário:', err);
        res.status(500).json({ success: false, message: "Erro ao verificar usuário." });
    }
});


app.post('/resetSenha', async (req, res) => {
    const { username } = req.body;

    try {
        const usuario = await Usuario.findOne({ where: { username } });
        if (usuario) {
            usuario.password = null;
            await usuario.save(); // Salva a alteração no banco
            res.json({ success: true, message: "Senha resetada com sucesso." });
        } else {
            res.json({ success: false, message: "Usuário não encontrado." });
        }
    } catch (err) {
        console.error('Erro ao resetar senha:', err);
        res.status(500).json({ success: false, message: "Erro ao resetar senha." });
    }
});


// Página do Administrador
app.get('/administrador.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'administrador.html'));
});

// Página de Login do Administrador
app.get('/login_admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login_admin.html'));
});

// Página Principal
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});



app.post('/solicitar-transferencia', async (req, res) => {
    const { loginDestinatario, numeroProcedimento, usuarioAtivo, observacoesProcedimento } = req.body;

    // Validação do formato do número do procedimento
    const regex = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/;
    if (!regex.test(numeroProcedimento)) {
        return res.status(400).json({ success: false, message: "Formato inválido para o número do procedimento." });
    }

    try {
        // Verificar se o procedimento e o destinatário existem
        const procedimento = await Procedimento.findOne({ where: { numero: numeroProcedimento } });
        const destinatario = await Usuario.findOne({ where: { username: loginDestinatario } });

        if (!procedimento || !destinatario) {
            return res.status(400).json({ success: false, message: "Processo ou login inválido." });
        }

        // Criar a solicitação de transferência
        await Solicitacao.create({
            login_remetente: usuarioAtivo,
            login_destinatario: loginDestinatario,
            numero_procedimento: numeroProcedimento,
            observacoes: observacoesProcedimento,
            status: 'pendente'
        });

        res.json({ success: true, message: "Solicitação de transferência enviada com sucesso." });
    } catch (err) {
        console.error('Erro ao criar solicitação de transferência:', err);
        res.status(500).json({ success: false, message: "Erro ao criar solicitação de transferência." });
    }
});

let lock = false; // Variável de bloqueio

app.post('/responder-transferencia/:id', async (req, res) => {
    if (lock) {
        return res.status(503).json({ success: false, message: "Outra operação em andamento. Tente novamente." });
    }

    lock = true; // Ativa o bloqueio
    const { acao } = req.body;
    const solicitacaoId = req.params.id;

    try {
        // Verificar se a solicitação existe
        const solicitacao = await Solicitacao.findByPk(solicitacaoId);
        if (!solicitacao) {
            lock = false;
            return res.status(404).json({ success: false, message: "Solicitação não encontrada." });
        }

        if (acao === 'aceitar') {
            solicitacao.status = 'aceita';

            // Ajustar data e hora para GMT-3
            const dataAtual = new Date();
            dataAtual.setHours(dataAtual.getHours() - 3);
            const dataFormatada = dataAtual.toISOString().split('T')[0];
            const horaFormatada = dataAtual.toTimeString().split(' ')[0];

            // Adicionar leitura ao procedimento
            const procedimento = await Procedimento.findOne({ where: { numero: solicitacao.numero_procedimento } });
            if (!procedimento) {
                lock = false;
                return res.status(404).json({ success: false, message: "Processo não encontrado." });
            }

            const destinatario = await Usuario.findOne({ where: { username: solicitacao.login_destinatario } });
            await Leitura.create({
                procedimento_id: procedimento.id,
                usuario_id: destinatario.id,
                data: dataFormatada,
                hora: horaFormatada,
                observacoes: solicitacao.observacoes
            });
        } else if (acao === 'recusar') {
            solicitacao.status = 'recusada';
        }

        await solicitacao.save(); // Atualiza o status da solicitação
        lock = false; // Libera o bloqueio

        res.json({ success: true, message: `Solicitação ${acao === 'aceitar' ? 'aceita' : 'recusada'} com sucesso.` });
    } catch (err) {
        lock = false; // Libera o bloqueio em caso de erro
        console.error('Erro ao responder solicitação de transferência:', err);
        res.status(500).json({ success: false, message: "Erro ao responder solicitação de transferência." });
    }
});


app.post('/salvar-dados', async (req, res) => {
    const { dadosBackup } = req.body;

    try {
        // Operação simulada, pois MySQL gerencia a persistência automaticamente
        // Aqui você pode salvar um backup dos dados em um arquivo, se necessário
        res.json({ success: true, message: "Dados salvos com sucesso." });
    } catch (err) {
        console.error('Erro ao salvar dados:', err);
        res.status(500).json({ success: false, message: "Erro ao salvar dados." });
    }
});


app.post('/converterProcedimento', async (req, res) => {
    const { antigoNumeroCompleto, novoNumero } = req.body;

    // Validar formato do novo número
    const regexNovoNumero = /^[A-Z]{2}-\d{3}-\d{5}\/\d{4}$/;
    if (!regexNovoNumero.test(novoNumero)) {
        return res.status(400).json({ success: false, message: "Formato inválido para a nova numeração." });
    }

    try {
        // Verificar se o procedimento existe
        const procedimento = await Procedimento.findOne({ where: { numero: antigoNumeroCompleto } });
        if (!procedimento) {
            return res.status(404).json({ success: false, message: "Procedimento não encontrado." });
        }

        // Atualizar o número do procedimento
        procedimento.numero = novoNumero;
        await procedimento.save();

        res.json({ success: true, message: "Procedimento convertido com sucesso." });
    } catch (err) {
        console.error('Erro ao converter procedimento:', err);
        res.status(500).json({ success: false, message: "Erro ao converter procedimento." });
    }
});


app.post('/transferencias-em-massa', async (req, res) => {
    const { loginDestinatario, loginRemetente, procedimentos } = req.body;

    try {
        // Verificar se o destinatário existe
        const destinatario = await Usuario.findOne({ where: { username: loginDestinatario } });
        if (!destinatario) {
            return res.status(400).json({ success: false, message: 'Login do destinatário não encontrado.' });
        }

        // Criar transferências para cada procedimento
        const transferencias = procedimentos.map(numeroProcedimento => ({
            login_remetente: loginRemetente,
            login_destinatario: loginDestinatario,
            numero_procedimento: numeroProcedimento,
            status: 'pendente'
        }));

        await Solicitacao.bulkCreate(transferencias); // Insere todas as transferências em massa

        res.json({ success: true, message: 'Transferências registradas com sucesso!' });
    } catch (err) {
        console.error('Erro ao registrar transferências em massa:', err);
        res.status(500).json({ success: false, message: "Erro ao registrar transferências em massa." });
    }
});


app.get('/verificarSolicitacaoPendente', async (req, res) => {
    const { procedimento } = req.query;

    try {
        // Verificar se existe uma solicitação pendente para o procedimento
        const solicitacaoPendente = await Solicitacao.findOne({
            where: { numero_procedimento: procedimento, status: 'pendente' }
        });

        res.json({ pendente: !!solicitacaoPendente });
    } catch (err) {
        console.error('Erro ao verificar solicitação pendente:', err);
        res.status(500).json({ success: false, message: "Erro ao verificar solicitação pendente." });
    }
});
