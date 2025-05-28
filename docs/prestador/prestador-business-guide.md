# Guia de Negócio - Módulo Prestador

## 1. Visão Geral

O módulo **Prestador** é responsável por gerenciar as informações dos prestadores de serviço que interagem com o sistema CST.  
Este módulo fornece funcionalidades para:

- **Cadastro e Atualização**: Permitir a criação e edição de dados cadastrais dos prestadores, seja pessoa física, jurídica ou estrangeira.
- **Consulta e Listagem**: Buscar e filtrar prestadores por diversos critérios (usuário, documento, e-mail, PIS, etc).
- **Sincronização com o Omie**: Integrar os dados dos prestadores com a API da Omie, garantindo que as informações estejam aprovadas e atualizadas em ambos os sistemas.
- **Importação via Excel**: Permitir o carregamento de dados em massa de prestadores a partir de planilhas, facilitando a migração e atualização.
- **Webhook**: Processar eventos vindos da Omie para atualização automática de cadastros, mantendo a consistência entre os sistemas.

## 2. Regras de Negócio

- **Validação de Dados**: Antes de criar ou atualizar um prestador, os dados são validados conforme regras internas definidas nos serviços de negócio.
- **Unicidade do Documento**: O campo _documento_ é único para evitar duplicidades. Alterações dependem de validações adicionais.
- **Sincronização Omie**:  
  - Ao atualizar um prestador, o sistema automaticamente dispara a sincronização com o Omie.
  - Se o prestador já estiver cadastrado no Omie, seus dados serão atualizados.
  - Caso contrário, o prestador será incluído no sistema Omie, garantindo a integração.
- **Importação**:  
  - Durante a importação via Excel, linhas com erros são registradas e exportadas para análise.
  - A importação registra estatísticas como número de linhas lidas, linhas com erro, cadastro de novos prestadores etc.
- **Rastreabilidade e Auditoria**: Cada alteração gera um registro de ação (controle de alteração) para garantir a rastreabilidade das operações.

## 3. Fluxo do Cadastro de Prestadores

1. **Criação**:  
   - O usuário preenche o formulário com os dados do prestador.
   - O sistema valida as informações e aciona a criação via serviço de CRUD.
   - Se aprovado, o prestador é sincronizado com o Omie.

2. **Atualização**:  
   - Quando os dados do prestador são modificados, uma validação é realizada.
   - Após a atualização, o serviço de sincronização com o Omie é chamado automaticamente.

3. **Consulta e Exclusão**:  
   - O sistema permite a busca por diversos filtros.
   - A exclusão é realizada com a validação prévia da existência do prestador.

## 4. Benefícios para o Negócio

- **Integração Contínua**: Garante que os dados cadastrais dos prestadores estejam sempre sincronizados com o ERP Omie.
- **Automação**: Reduz a necessidade de inserção manual de informações e minimiza erros.
- **Rastreabilidade**: Permite o controle detalhado de alterações, essencial para auditoria e conformidade.
- **Flexibilidade**: Com a funcionalidade de importação via Excel, é possível migrar dados em massa de maneira assertiva.

## 5. Considerações Finais

Este guia visa ajudar usuários de negócio e gestores a compreenderem as funcionalidades e fluxos do módulo Prestador, facilitando a tomada de decisão e o acompanhamento do desempenho do setor.
