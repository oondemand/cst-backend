# Documentação Técnica – Módulo Prestador

Este documento apresenta detalhes técnicos do módulo Prestador, abrangendo seu modelo de dados, regras de negócio, e o mapeamento bidirecional entre os dados internos e a API do Omie. 

---

## 1. Modelo Prestador

O modelo Prestador, definido via Mongoose, estabelece a estrutura e as validações para os dados dos prestadores. Seguem alguns detalhes importantes:

- **Identificação e Relacionamentos:**
  - `usuario`: Referência opcional para o usuário associado.
  - `documento`: Campo único usado para identificação, com validação de duplicidade.

- **Dados Gerais:**
  - `nome`: (String, obrigatório) Nome do prestador.
  - `email`: (String, opcional) Validação com expressão regular para formato de e-mail. Convertido para lowercase; permite null.
  - `tipo`: (String, enum: ["pj", "pf", "ext", ""]) Classifica o prestador conforme sua natureza.

- **Dados de Pessoa Física:**
  - `pessoaFisica.dataNascimento`: (Date) Aceita datas no formato dd/MM/yyyy via função `parseDate`.
  - `pessoaFisica.pis`: (String) Número de PIS.
  - `pessoaFisica.rg`: Objeto com:
    - `numero`: (String)
    - `orgaoEmissor`: (String)

- **Dados de Pessoa Jurídica:**
  - `pessoaJuridica.nomeFantasia`: (String)
  - `pessoaJuridica.codigoCNAE`: (String)
  - `pessoaJuridica.codigoServicoNacional`: (String)
  - `pessoaJuridica.regimeTributario`: (String, enum: ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"])

- **Dados Bancários:**
  - Estruturado via `dadosBancariosSchema`, contendo:
    - `banco`: (String)
    - `agencia`: (String)
    - `conta`: (String)
    - `tipoConta`: (String, enum: ["", "corrente", "poupanca"])
    - `tipoChavePix` e `chavePix`: (Strings com default)

- **Endereço:**
  - Estruturado via `enderecoSchema`, com:
    - `cep`: (String) Validação com regex para exatamente 8 dígitos.
    - `rua`, `numero`, `complemento`, `cidade`, `estado`
    - `pais`: Objeto com subcampos `nome` e `cod` (default para "Brasil" e código 1058)

- **Outros Campos:**
  - `comentariosRevisao`, `status` (enum: ["ativo", "pendente-de-revisao", "inativo", "arquivado"]), e `dataExportacao`.

- **Métodos do Modelo:**
  - `gerarToken()`: Gera um JWT contendo o id do prestador com validade de 24 horas.

---

## 2. Regras de Negócio – prestadorBusinessService

Os serviços de negócio para o Prestador (ex. `validateCreatePrestador` e `validateUpdatePrestador`) implementam as seguintes regras:

- **Validação de Dados:**  
  Antes de criar ou atualizar um prestador, os dados são validados quanto à consistência e obrigatoriedade dos campos. Erros de validação são tratados para impedir inserções com dados mal formados.

- **Unicidade do Documento:**  
  Verifica se já existe um prestador com o mesmo documento, garantindo integridade dos dados.

- **Sincronização com o Omie:**  
  Após criação ou atualização, o serviço dispara a sincronização para refletir as mudanças no sistema Omie.

- **Auditoria:**  
  Toda alteração (criação, atualização e exclusão) dispara o registro de ação com informações sobre o usuário e os dados modificados.

> **Observação:**  
> O prestadorBusinessService encapsula as validações e chamadas ao CRUD, abstraindo a complexidade do fluxo de criação/atualização e garantindo que as regras de negócio sejam seguidas.

---

## 3. Mapeamento com API Omie

O mapeamento entre dados internos e o formato esperado pelo Omie é implementado em dois módulos: um para exportação (Prestador -> Omie) e outro para importação (Omie -> Prestador).

### 3.1. Prestador para Omie (Exporter)

Implementado em `prestadorOmieExporter.js`, a função `mapPrestadorToOmieExport` realiza as seguintes conversões:

- **Documento e Nome:**  
  `cnpj_cpf` recebe o valor do campo `documento`.  
  `razao_social` é derivada do campo `nome`, truncada para no máximo 60 caracteres.

- **Indicador de Pessoa Física:**  
  O campo `pessoa_fisica` é definido como "S" se `tipo` for "pf" e "N" caso contrário.

- **Dados Bancários:**  
  Converte `dadosBancarios` para os campos:
  - `codigo_banco`: valor de `banco`
  - `agencia`: valor de `agencia`
  - `conta_corrente`: valor de `conta`

- **Endereço:**  
  Campos `cep`, `endereco` (rua), `endereco_numero`, `complemento`, `cidade` e `estado` são mapeados diretamente dos subcampos de `endereco`.

Exemplo de saída:
```json
{
  "cnpj_cpf": "12345678901",
  "razao_social": "Prestador Exemplo",
  "pessoa_fisica": "S",
  "email": "exemplo@dominio.com",
  "dadosBancarios": {
    "codigo_banco": "001",
    "agencia": "1234",
    "conta_corrente": "56789-0"
  },
  "cep": "12345678",
  "endereco": "Rua Exemplo",
  "endereco_numero": "100",
  "complemento": "Apto 10",
  "cidade": "Belo Horizonte",
  "estado": "MG"
}
```

### 3.2. Omie para Prestador (Importer)

Implementado em `prestadorOmieImporter.js`, a função `mapOmieToPrestador` realiza o inverso:

- **Documento:**  
  Extraído de `cnpj_cpf` removendo caracteres não numéricos.

- **Nome e Tipo:**  
  O campo `nome` é mapeado a partir de `razao_social`.  
  O atributo `tipo` é definido como "pf" se `pessoa_fisica` for "S" ou "pf", caso contrário "ext".

- **Email e Dados Bancários:**  
  Campos `email`, e dentro de `dadosBancarios` (banco, agencia, conta_corrente) são atribuídos diretamente.

- **Endereço:**  
  Campos como `cep`, `endereco`, `endereco_numero`, `complemento`, `cidade` e `estado` são mapeados para a estrutura interna.

Exemplo de entrada do Omie:
```json
{
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
}
```

Resultado mapeado:
```json
{
  "nome": "Prestador Alterado",
  "tipo": "pf",
  "documento": "12345678901",
  "email": "alterado@exemplo.com",
  "dadosBancarios": {
    "banco": "001",
    "agencia": "4321",
    "conta": "98765-0"
  },
  "endereco": {
    "cep": "12345678",
    "rua": "Rua Alterada",
    "numero": "200",
    "complemento": "Sala 2",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "pais": { "nome": "", "cod": "" }
  }
}
```

---

## 4. Fluxo de Sincronização com Omie

Após a atualização ou criação de um prestador via API, o módulo invoca a função de sincronização (por exemplo, `prestadorOmieSync`), que:
- Consulta se o prestador já existe na base Omie usando `pesquisarPorCNPJ` ou `pesquisarCodIntegracao`.
- Mapeia o objeto Prestador para o formato Omie utilizando o mapeador exporter.
- Se já existe, atualiza os dados no Omie; caso contrário, insere o novo prestador.
- Retorna o objeto local sem alterar o fluxo principal, mas garantindo que a integração seja disparada.

---

> **Considerações Técnicas:**
> - As funções de mapeamento e sincronização tratam de conversões específicas de formato e limitação de tamanho de campos (ex.: truncamento de nome).
> - Os processos de validação de dados e de controle de duplicidade são realizados antes da chamada à sincronização.
> - A integração com a API do Omie é feita de forma resiliente, com múltiplas tentativas e uso de cache para melhorar a performance e evitar consumo redundante.

---

Este documento técnico detalha a implementação interna e os fluxos críticos do módulo Prestador, sendo útil para desenvolvedores e integradores que necessitam compreender o funcionamento e adaptar ou estender as funcionalidades conforme requisitos futuros.
