# USE APACHE (Web Server), NOT FPM
FROM php:8.2-apache

# 1. Install system dependencies for Postgres (libpq-dev) and image processing
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql zip

# 2. Enable Apache mod_rewrite (REQUIRED for Laravel routes to work)
RUN a2enmod rewrite

# 3. Point Apache to the 'public' folder (Laravel standard)
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# 4. Set working directory
WORKDIR /var/www/html

# 5. Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 6. Copy files and install dependencies
COPY . .
RUN composer install --no-dev --optimize-autoloader

# 7. Fix permissions (Apache runs as www-data)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 8. Expose Port 80 (Standard HTTP port)
EXPOSE 80

# 9. Start Apache
CMD ["apache2-foreground"]