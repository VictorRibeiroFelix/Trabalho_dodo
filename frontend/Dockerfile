# Imagem leve do Nginx para servir arquivos estáticos
FROM nginx:alpine

# Remove a config padrão e coloca a nossa
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos do frontend para a pasta servida pelo Nginx
COPY index.html style.css script.js /usr/share/nginx/html/

EXPOSE 80
