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