# USE APACHE (Web Server), NOT FPM
FROM php:8.2-apache

# 1. Install system dependencies for Postgres (libpq-dev) and image processing
#    (Added libpng, libjpeg, libfreetype, libicu for GD and Intl extensions)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libicu-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql zip bcmath gd intl exif pcntl

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
# CRITICAL FIX: Added --no-scripts to prevent "package:discover" from crashing during build
RUN composer install --no-dev --optimize-autoloader --no-scripts

# 7. Fix permissions (Apache runs as www-data)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 8. Expose Port 80 (Standard HTTP port)
EXPOSE 80

# 9. Start Apache
# Note: We run optimize commands here since we skipped scripts during build
CMD php artisan package:discover --ansi && php artisan config:cache && apache2-foreground