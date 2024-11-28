const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');


const app = express();
const port = 3306;


// Configuração do banco de dados
const sequelize = new Sequelize('deyaoj_banco', 'deyaoj_banco', 'deyaoj_banco', {
    host: 'localhost',
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
// Rota de Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Usuario.findOne({ where: { username, password } });
        if (user) {
            res.json({ success: true, message: 'Login realizado com sucesso!', user });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao realizar login.', error: err.message });
    }
});

// Rota de Cadastro
app.post('/register', async (req, res) => {
    const { username, password, name } = req.body;
    try {
        const newUser = await Usuario.create({ username, password, name });
        res.json({ success: true, message: 'Usuário registrado com sucesso!', user: newUser });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Erro ao registrar usuário.', error: err.message });
    }
});

// Rota para listar usuários
app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({ attributes: ['username', 'name'] });
        res.json({ success: true, usuarios });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao buscar usuários.', error: err.message });
    }
});

// Rota para consultar movimentações
app.get('/consultaMovimentacao', async (req, res) => {
    const { procedimento } = req.query;
    try {
        const proc = await Procedimento.findOne({ where: { numero: procedimento } });
        if (!proc) {
            return res.status(404).json({ success: false, message: 'Procedimento não encontrado.' });
        }
        const leituras = await Leitura.findAll({
            where: { procedimento_id: proc.id },
            include: { model: Usuario, attributes: ['username'] }
        });
        res.json({ success: true, leituras });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao consultar movimentações.', error: err.message });
    }
});

// Rota para solicitar transferência
app.post('/solicitarTransferencia', async (req, res) => {
    const { login_remetente, login_destinatario, numero_procedimento, observacoes } = req.body;
    try {
        const remetente = await Usuario.findOne({ where: { username: login_remetente } });
        const destinatario = await Usuario.findOne({ where: { username: login_destinatario } });
        const procedimento = await Procedimento.findOne({ where: { numero: numero_procedimento } });

        if (!remetente || !destinatario || !procedimento) {
            return res.status(400).json({ success: false, message: 'Dados inválidos.' });
        }

        const solicitacao = await Solicitacao.create({
            login_remetente: remetente.id,
            login_destinatario: destinatario.id,
            numero_procedimento,
            status: 'pendente'
        });

        res.json({ success: true, message: 'Solicitação de transferência enviada.', solicitacao });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao solicitar transferência.', error: err.message });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
