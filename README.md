# CST-Backend

![GitHub stars](https://img.shields.io/github/stars/oondemand/cst-backend)
![GitHub issues](https://img.shields.io/github/issues/oondemand/cst-backend)
![GitHub license](https://img.shields.io/github/license/oondemand/cst-backend)
[![Required Node.JS >=18.0.0](https://img.shields.io/static/v1?label=node&message=%20%3E=18.0.0&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Tecnologias Utilizadas](#2-tecnologias-utilizadas)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Instalação](#4-instalação)
5. [Deploy Automático - Ambiente de Homologação](#5-deploy-automático---ambiente-de-homologação)
6. [Guia de Contribuição](#6-guia-de-contribuição)

## 1. Visão Geral do Sistema

O **CST-Backend** é uma aplicação backend que gerencia processos relacionados a prestadores de serviços, tickets, serviços, integrações com a API da Omie, além de funcionalidades de autenticação e autorização de usuários. A aplicação segue uma arquitetura RESTful, permitindo comunicação eficiente com clientes front-end e serviços externos.

## 2. Tecnologias Utilizadas

- **Node.js**: Ambiente de execução para JavaScript no servidor.
- **Express**: Framework web para Node.js.
- **MongoDB**: Banco de dados NoSQL.
- **Mongoose**: ORM para MongoDB.
- **JWT**: Autenticação e autorização.
- **bcrypt**: Hashing de senhas.
- **SendGrid**: Serviço de envio de emails.
- **Multer**: Manipulação de uploads de arquivos.
- **Helmet**: Segurança de cabeçalhos HTTP.
- **Winston**: Logging.
- **axios**: Cliente HTTP para integrações externas.
- **date-fns**: Manipulação de datas.
- **dotenv**: Gerenciamento de variáveis de ambiente.
- **crypto**: Criptografia e geração de hashes.

## 3. Estrutura do Projeto

```plaintext
src/
├── assets/         # Recursos estáticos como imagens, arquivos públicos, ícones, utilizados pela aplicação.
├── config/         # Configurações centrais da aplicação, incluindo conexão com MongoDB, setup do Axios para integrações externas, configuração do logger Winston e variáveis de ambiente.
├── constants/      # Definições de constantes globais, como status, códigos de erro, tipos de usuário e outras strings fixas usadas em toda a aplicação.
├── controllers/    # Controladores que contêm a lógica principal de tratamento das requisições HTTP, organizados por entidade (usuários, tickets, serviços, etc).
├── middlewares/    # Funções intermediárias que processam requisições HTTP antes de chegarem aos controllers.
├── models/         # Modelos de dados com esquemas Mongoose, representando as coleções do banco MongoDB e suas regras de validação.
├── routers/        # Definição das rotas da API, agrupadas por recursos, responsáveis por direcionar as requisições para os controllers apropriados.
├── seeds/          # Scripts e arquivos JSON para popular o banco de dados com dados iniciais, facilitando testes e ambientes de desenvolvimento. Exemplo: usuários default, configurações iniciais.
├── services/       # Camada responsável pela comunicação com serviços externos, como a API Omie, envio de e-mails via SendGrid e outras integrações, abstraindo a lógica de terceiros.
└── utils/          # Funções utilitárias reutilizáveis para formatação, validação, manipulação de dados, criptografia e outras tarefas comuns da aplicação.
```

## 4. Instalação

### Pré requisitos

- [NodeJs](https://nodejs.org/pt)
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/downloads)
- [Docker compose](https://docs.docker.com/compose/)

### Passos

1. Clone o repositório

```bash
git clone https://github.com/oondemand/cst-backend.git
cd cst-backend
```

2. Inicialise o banco de dados

```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

3. Criar o .env
   > Se você preferir voce pode simplismente criar o arquivo **.env** na raiz do projeto e copiar as variaveis do **.env.dev**

```bash
cp .env.dev .env
```

ou no cmd do windowns

```bash
copy .env.dev .env
```

4. Instalar as dependencias

```bash
npm install
```

5. Executar o projeto

```bash
npm run dev
```

6. Popular banco de dados

> Uma base omie oficial não é necessária, porém desta forma você tera problemas na integração com o omie.

```bash
curl -X POST http://localhost:4000/ativacao \
  -H "Content-Type: application/json" \
  -d '{
    "baseOmie": {
      "nome": "Dev",
      "cnpj": "11111111111112",
      "appKey": "0000000091403",
      "appSecret": "000000000000000000000000000000"
    },
    "usuario": {
      "nome": "User dev",
      "email": "userdev@gmail.com",
      "senha": "123456",
      "tipo": "admin"
    }
  }'
```

## 5. Deploy Automático - Ambiente de Homologação

### 5.1 Como Funciona o Deploy

Pipeline executado via GitHub Actions na branch `homolog`:

1. Checkout do código
2. Configuração do git para criação de tags
3. Instalação das dependências
4. Criação de release e geração de tag via `release-it`
5. Build da imagem Docker e push para GHCR
6. Criação do kubeconfig para acesso ao cluster Kubernetes
7. Aplicação do deployment com substituição das variáveis no arquivo `deployment-homolog.yaml`

### 5.2 Arquivos Importantes

- `infra/docker/Dockerfile.prod`
- `infra/kubernetes/deployment-homolog.yaml`
- `.github/workflows/deploy-homolog.yml`

### 5.3 Variáveis de Ambiente Utilizadas

| Variável                                | Descrição                                             |
| --------------------------------------- | ----------------------------------------------------- |
| `GITHUB_TOKEN`                          | Token padrão do GitHub Actions                        |
| `DOCKER_USERNAME`                       | Usuário para login no GitHub Container Registry       |
| `GH_PAT`                                | Token pessoal para acesso ao GHCR                     |
| `NODE_ENV`                              | Ambiente Node (ex: homolog)                           |
| `SERVICE_NAME`                          | Nome do serviço                                       |
| `PORT`                                  | Porta onde o serviço roda                             |
| `DB_SERVER_HOMOLOG`                     | URL do banco de dados no ambiente homolog             |
| `DB_USER_HOMOLOG`                       | Usuário do banco no homolog                           |
| `DB_PASSWORD_HOMOLOG`                   | Senha do banco no homolog                             |
| `DB_NAME_HOMOLOG`                       | Nome do banco no homolog                              |
| `DB_AUTH_SOURCE`                        | Fonte de autenticação do banco (MongoDB)              |
| `DB_REPLICA_SET_HOMOLOG`                | Replica set do banco (se aplicável)                   |
| `DB_TSL_HOMOLOG`                        | Configuração TLS do banco                             |
| `API_OMIE`                              | Chave ou URL para integração com API Omie             |
| `JWT_SECRET`                            | Chave secreta para geração/verificação de JWT         |
| `BASE_URL_CST_HOMOLOG`                  | URL base do sistema CST para homologação              |
| `BASE_URL_APP_PUBLISHER_HOMOLOG`        | URL base do app publisher em homologação              |
| `DO_ACCESS_TOKEN_HOMOLOG`               | Token para acessar cluster Kubernetes na DigitalOcean |
| `DO_CLUSTER_AUTHENTICATION_URL_HOMOLOG` | Endpoint de autenticação do cluster                   |
| `CLUSTER_HOMOLOG`                       | Nome do cluster Kubernetes para homologação           |

## 6 Guia de Contribuição

Obrigado por querer contribuir com este projeto! 🎉  
Siga os passos abaixo para garantir que sua contribuição seja bem-sucedida.

### 6.1 Como contribuir

- [ ] Faça um fork do repositório
- [ ] Crie uma nova branch descritiva: `git checkout -b feat/nome-da-sua-feature`
- [ ] Faça suas alterações e adicione testes, se necessário
- [ ] Confirme as alterações: `git commit -m "feat: adiciona nova feature"`
- [ ] Envie a branch: `git push origin feat/nome-da-sua-feature`
- [ ] Crie um Pull Request explicando as mudanças realizadas

### 6.2 Padrões de código

- Mantenha o código limpo e legível
- Siga a estrutura e padrões já existentes
- Evite adicionar dependências desnecessárias

### 6.3 Commits

Use o [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/):

Exemplos:

- `feat: adiciona botão de login`
- `fix: corrige erro ao carregar usuários`
- `refactor: melhora performance do datagrid`

### 6.4 Feedback

Se tiver dúvidas ou sugestões, abra uma **Issue** para discutirmos.  
Sua colaboração é sempre bem-vinda! 🚀
