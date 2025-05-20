////////////////////////////////////////////////////////////////////////////////////
//////FUNÇÔES FUNCOES GLOBAIS////////////////////////////////////////////////////////
//>> Inicio ..funções globais do projeto Devem esta declaradas aqui. Organização


function validarCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]+/g, '');

    // Verifica se o CPF possui 11 dígitos
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false; // CPF inválido
    }

    // Validação dos dígitos verificadores
    let soma = 0;
    let resto;

    // Valida o primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf[i - 1]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
        resto = 0;
    }
    if (resto !== parseInt(cpf[9])) {
        return false; // Primeiro dígito verificador inválido
    }

    // Reseta a soma para validar o segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf[i - 1]) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
        resto = 0;
    }
    if (resto !== parseInt(cpf[10])) {
        return false; // Segundo dígito verificador inválido
    }

    return true; // CPF válido
}

// Exemplos de uso
//console.log(validarCPF('123.456.789-09')); // false
//console.log(validarCPF('111.444.777-35')); // true (exemplo válido)


function validarCNPJ(cnpj) {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]+/g, '');

    // Verifica se o CNPJ possui 14 dígitos
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
        return false; // CNPJ inválido
    }

    // Validação dos dígitos verificadores
    let soma = 0;
    let resto;

    // Valida o primeiro dígito verificador
    for (let i = 0; i < 12; i++) {
        soma += parseInt(cnpj[i]) * ((i < 4) ? (5 - i) : (13 - i));
    }
    resto = soma % 11;
    if (resto < 2) {
        resto = 0;
    } else {
        resto = 11 - resto;
    }
    if (resto !== parseInt(cnpj[12])) {
        return false; // Primeiro dígito verificador inválido
    }

    // Reseta a soma para validar o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 13; i++) {
        soma += parseInt(cnpj[i]) * ((i < 5) ? (6 - i) : (14 - i));
    }
    resto = soma % 11;
    if (resto < 2) {
        resto = 0;
    } else {
        resto = 11 - resto;
    }
    if (resto !== parseInt(cnpj[13])) {
        return false; // Segundo dígito verificador inválido
    }

    return true; // CNPJ válido
}

//Sleep para aguardar um tempo 2000 = 2seg
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//retorno de valor formato BRL R$ 1.500,00 
const valorBR = (data) => {
    if (data)
      return data.toLocaleString("pt-br", { style: "currency", currency: "BRL" });
  };

// Exportando as funções
module.exports = {
    validarCPF,
    validarCNPJ,
    sleep,
    valorBR
};