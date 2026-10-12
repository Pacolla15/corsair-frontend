# Interface Web - Gerenciamento de Perifericos Corsair

Aplicacao cliente desacoplada desenvolvida exclusivamente com HTML5 semantico, CSS3 responsivo e JavaScript moderno (ES6+) para gerenciamento de perifericos Corsair.

## 1. Stack Tecnologica
- HTML5 semantico (acessibilidade e estruturacao de modais)
- CSS3 puro (Grid, Flexbox, Variaveis CSS e media queries responsivas)
- JavaScript ES6+ nativo com Fetch API
- Iconografia 100% vetorial em SVG (sem emojis)

## 2. Estrutura de Arquivos do Repositorio
```
/
  .gitignore
  README.md
  index.html
  css/
    style.css
  js/
    api.js
    app.js
  assets/
```

## 3. Como Executar Localmente

### Opcao 1: Abrir diretamente no navegador
Basta dar um duplo clique no arquivo `index.html` ou abri-lo no seu navegador favorito. O sistema detecta automaticamente o protocolo `file://` e comunica com a API local em `http://localhost:3000/api`.

### Opcao 2: Usar uma extensao como Live Server (VS Code)
Abra a pasta do projeto no VS Code e clique em "Open with Live Server" no `index.html`.

### Opcao 3: Servidor HTTP simples via linha de comando
```bash
# Com Python:
python -m http.server 5000

# Ou com npx:
npx serve .
```
Acesse `http://localhost:5000`.

## 4. Conexao com a API Backend

### Em Desenvolvimento Local
O script `js/api.js` detecta automaticamente quando esta rodando em `localhost`, `127.0.0.1` ou `file://` e se conecta a `http://localhost:3000/api`. Certifique-se de que a API esteja em execucao.

### Em Producao (GitHub Pages, Vercel ou Netlify)
Apos realizar o deploy da API backend (por exemplo, na Vercel), abra o arquivo `js/api.js` e configure a variavel `PRODUCTION_API_URL` no inicio do arquivo com a URL publica da sua API:
```javascript
const PRODUCTION_API_URL = 'https://sua-api.vercel.app/api';
```

## 5. Funcionalidades da Interface
- Listagem dinamica de perifericos com cards estilizados
- Exibicao de foto, marca Corsair, modelo e preco formatado em R$ (BRL)
- Cadastro de novo periferico com validacao de campos em tempo real e preview de foto
- Edicao de perifericos existentes
- Exclusao de perifericos com modal de confirmacao de seguranca
- Estados visuais claros: carregamento (spinner), lista vazia, erro de conexao com botao de tentar novamente e toasts de notificacao
- Tratamento automatico para fotos com URLs quebradas ou inacessiveis via fallback visual
- Protecao nativa contra ataques XSS utilizando manipulacao segura do DOM
