# USE APACHE (Web Server)
FROM php:8.2-apache

# 1. Install system dependencies
# We add 'supervisor' here to run Apache and Reverb at the same time
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libicu-dev \
    unzip \
    supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql zip bcmath gd intl exif pcntl

# 2. Enable Apache mod_rewrite (Required for Laravel)
RUN a2enmod rewrite

# 3. Point Apache to the 'public' folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# 4. Set working directory
WORKDIR /var/www/html

# 5. Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 6. Copy files and install dependencies
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-scripts

# 7. Create missing storage folders (Prevents 500 Errors on startup)
RUN mkdir -p /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/cache \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache \
    /var/log/supervisor && \
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/log/supervisor

# 8. Copy Supervisor Config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 9. Expose Ports (80 for Web, 8080 for Reverb)
EXPOSE 80 8080

# 10. Start Supervisor (Controls both Apache and Reverb)
CMD php artisan package:discover --ansi && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf