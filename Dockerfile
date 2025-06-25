# Usa uma imagem oficial do Node.js
FROM node:18

# Instala o Oracle Instant Client e dependências
RUN apt-get update && apt-get install -y libaio1 unzip curl

# Cria diretório para o Oracle Instant Client
RUN mkdir -p /opt/oracle && \
    curl -L -o basic.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linux.x64-21.10.0.0.0dbru.zip && \
    unzip basic.zip -d /opt/oracle && rm basic.zip

# Define variáveis de ambiente
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_10
ENV PATH=$PATH:/opt/oracle/instantclient_21_10

# Define diretório de trabalho
WORKDIR /app

# Copia tudo para a imagem
COPY . .

# Instala dependências do Node.js
RUN npm install

# Expõe a porta usada no seu backend
EXPOSE 3000

# Inicia o servidor
CMD ["node", "index.js"]


