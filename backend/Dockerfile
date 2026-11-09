# Imagem base leve com Node.js
FROM node:20-alpine

# Diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia apenas os arquivos de dependência primeiro (melhora cache do build)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copia o restante do código da aplicação
COPY . .

# Porta que a API vai expor dentro da rede do Docker
EXPOSE 3000

CMD ["node", "server.js"]
