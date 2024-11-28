if (data.success) {
    let html = `<h3>Movimentações para o procedimento ${numeroCompleto}:</h3><ul>`;
    data.leituras.forEach(leitura => {
        html += `<li>${leitura.usuario}, Data: ${leitura.data}, Hora: ${leitura.hora}, Obs.: ${leitura.observacoesProcedimento}</li>`;
    });
    html += `</ul>`;
    

    // Adicionar observações ao resultado
    if (data.observacoes) {
        html += `<p><strong>Observações:</strong> ${data.observacoes}</p>`;
    } else {
        html += `<p><strong>Observações:</strong> Nenhuma observação registrada.</p>`;
    }

    resultadoDiv.innerHTML = html;
} else {
    resultadoDiv.innerHTML = `<p>${data.message}</p>`;
}
