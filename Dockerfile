# A tanulókártyák statikus fájlok: nginx szolgálja ki őket.
FROM nginx:1.27-alpine

# Az alap MIME-tábla nem ismeri a webmanifestet, az m4a-t pedig a
# nem szabványos audio/x-m4a néven adja.
RUN sed -i 's|audio/x-m4a|audio/mp4|; s|^}|    application/manifest+json             webmanifest;\n}|' /etc/nginx/mime.types

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/

EXPOSE 80
