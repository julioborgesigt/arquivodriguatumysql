// Função para pré-cadastrar um usuário
function preCadastrarUsuario() {
    const username = document.getElementById("pre-username").value;

    if (!/^[a-zA-Z0-9]{8}$/.test(username)) {
        alert("O nome de usuário deve ter exatamente 8 caracteres alfanuméricos.");
        return;
    }

    fetch('/preCadastro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
    })
    .then(response => response.json())
    .then(data => {
        const mensagem = document.getElementById("mensagem-admin");
        if (data.success) {
            mensagem.innerHTML = `<p>Usuário ${username} pré-cadastrado com sucesso!</p>`;
        } else {
            mensagem.innerHTML = `<p>${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Erro ao pré-cadastrar usuário:', error);
        alert('Erro ao pré-cadastrar usuário. Tente novamente.');
    });
}

// Função para resetar a senha do usuário
function resetarSenha() {
    const username = document.getElementById("reset-username").value;

    fetch('/resetSenha', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
    })
    .then(response => response.json())
    .then(data => {
        const mensagem = document.getElementById("mensagem-admin");
        if (data.success) {
            mensagem.innerHTML = `<p>Senha do usuário ${username} resetada com sucesso!</p>`;
        } else {
            mensagem.innerHTML = `<p>${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('Erro ao resetar a senha:', error);
        alert('Erro ao resetar a senha. Tente novamente.');
    });
}


// Função para realizar o login de administrador
function loginAdmin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    fetch('/login-admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Login realizado com sucesso!');
            sessionStorage.setItem('adminLogado', true); // Marcar como logado
            window.location.href = '/administrador.html'; // Redirecionar
        } else {
            alert('Usuário ou senha incorretos.');
        }
    })
    .catch(error => {
        console.error('Erro ao realizar login:', error);
        alert('Erro ao realizar login. Tente novamente.');
    });
}


// Função para realizar logout do administrador
function logoutAdmin() {
    // Remover o item de sessionStorage que marca o administrador como logado
    sessionStorage.removeItem('adminLogado');
    
    // Redirecionar para a página de login do administrador
    window.location.href = '/index.html';
}
