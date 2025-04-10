FROM php:8.2-apache

# Instala as dependências necessárias
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql \
    && docker-php-ext-install mysqli \
    && a2enmod rewrite

# Copia os arquivos do projeto
COPY src/ /var/www/html/

# Define as permissões
RUN chown -R www-data:www-data /var/www/html