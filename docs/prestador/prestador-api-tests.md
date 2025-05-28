# Roteiro de Testes - API do Prestador

Este documento descreve os testes para homologação dos endpoints do módulo Prestador. Os exemplos podem ser importados no Postman ou Insomnia.

---

## 1. Obter Prestador por Usuário

**Endpoint:** GET `/prestadores/usuario/:idUsuario`

**Exemplo:**
- **URL:** `http://localhost:4000/prestadores/usuario/1234567890`
- **Método:** GET
- **Headers:** `{ "Content-Type": "application/json" }`

**Validações:**
- Resposta 200 com dados do prestador caso encontrado.
- Resposta 404 caso o prestador não exista.

---

## 2. Criar Prestador

**Endpoint:** POST `/prestadores/`

**Exemplo de Request Body (JSON):**
```json
{
  "nome": "Prestador Teste",
  "email": "teste@exemplo.com",
  "tipo": "pf",
  "documento": "12345678901",
  "pessoaFisica": {
    "dataNascimento": "01/01/1990",
    "pis": "123456789",
    "rg": {
      "numero": "MG123456",
      "orgaoEmissor": "SSP"
    }
  },
  "pessoaJuridica": {
    "nomeFantasia": "Teste LTDA",
    "codigoCNAE": "1234",
    "codigoServicoNacional": "5678",
    "regimeTributario": "Simples"
  },
  "dadosBancarios": {
    "banco": "001",
    "agencia": "1234",
    "conta": "56789-0",
    "tipoConta": "corrente"
  },
  "endereco": {
    "cep": "12345678",
    "rua": "Rua Exemplo",
    "numero": "100",
    "complemento": "Apto 10",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "pais": { "nome": "Brasil", "cod": "BR" }
  }
}
```

**Validações:**
- Resposta 200 e retorno do objeto inserido.
- Validação dos campos obrigatórios.

---

## 3. Listar Prestadores

**Endpoint:** GET `/prestadores`

**Exemplo:**
- **URL:** `http://localhost:4000/prestadores?searchTerm=Teste&sortBy=nome`
- **Método:** GET
- **Headers:** `{ "Content-Type": "application/json" }`

**Validações:**
- Resposta 200 com array de prestadores, com paginação.
- Verificar que os filtros de busca estão considerando todos os campos do modelo.

---

## 4. Obter Prestador por ID

**Endpoint:** GET `/prestadores/:id`

**Exemplo:**
- **URL:** `http://localhost:4000/prestadores/607d1a81b3c2f72a0c9f1abc`
- **Método:** GET

**Validações:**
- Resposta 200 com os dados do prestador caso o ID seja válido.
- Resposta 404 se o ID não for encontrado.

---

## 5. Atualizar Prestador

**Endpoint:** PATCH `/prestadores/:id`

**Exemplo de Request Body (JSON):**
```json
{
  "email": "novoemail@exemplo.com",
  "endereco": {
    "rua": "Nova Rua Exemplo"
  }
}
```

**Validações:**
- Resposta 200 com o objeto atualizado.
- Após a atualização, a função de sincronização com o Omie (prestadorOmieSync) será acionada.
- Validar se o registro de ação (controle de alteração) foi gravado corretamente.

---

## 6. Excluir Prestador

**Endpoint:** DELETE `/prestadores/:id`

**Exemplo:**
- **URL:** `http://localhost:4000/prestadores/607d1a81b3c2f72a0c9f1abc`
- **Método:** DELETE

**Validações:**
- Resposta 200 confirmando a exclusão.
- Resposta 404 se o prestador não for encontrado.

---

## 7. Teste dos Webhooks (Omie)

**Endpoint:** POST `/prestadores/webhook`

**Exemplo de Request Body (JSON):**
```json
{
  "event": {
    "cnpj_cpf": "12345678901",
    "razao_social": "Prestador Alterado",
    "pessoa_fisica": "S",
    "email": "alterado@exemplo.com",
    "cep": "12345678",
    "endereco": "Rua Alterada",
    "endereco_numero": "200",
    "complemento": "Sala 2",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "dadosBancarios": {
      "codigo_banco": "001",
      "agencia": "4321",
      "conta_corrente": "98765-0"
    }
  },
  "topic": "ClienteFornecedor.Alterado"
}
```

**Observação Especial:**
- Envie um corpo com `ping: "omie"` para testar:
```json
{ "ping": "omie" }
```
- Valide a resposta: deve retornar um "pong".

---

## 8. Instruções para Importação via Excel

**Endpoint:** POST `/prestadores/importar`

**Configuração:**
- **Método:** POST
- **Body:** Form-data com file (arquivo Excel)
- **Exemplo:** Enviar um arquivo com dados das linhas conforme o mapeamento definido no `prestadorExcelImporter.js`

**Validações:**
- Resposta 200 com objeto de importação que contenha informações dos prestadores importados e detalhes de erros.

---

## Considerações Gerais

- Para todos os testes, verifique o status code e o conteúdo da resposta.
- Utilize variáveis de ambiente para URLs base (ex.: `http://localhost:4000`) caso necessário.
- Teste tanto os casos de sucesso quanto os de falha (dados inválidos, IDs inexistentes, etc).

---

Este roteiro cobre a maior parte dos endpoints do módulo Prestador e fornece exemplos que podem ser facilmente importados em ferramentas de testes como Postman ou Insomnia. Ajuste os exemplos conforme as particularidades do seu ambiente de homologação.

