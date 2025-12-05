### Multi-stage Dockerfile for Laravel backend (PHP-FPM)
### - Installs PHP extensions
### - Runs Composer install after extensions are present
### - Produces a lean runtime image

FROM php:8.2-fpm-alpine AS builder

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/composer

RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    icu-dev \
    libzip-dev \
    zlib-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    bash \
    git \
    curl \
    unzip \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(getconf _NPROCESSORS_ONLN || 1) \
    pdo_mysql \
    mbstring \
    zip \
    bcmath \
    pcntl \
    exif \
    intl \
    gd \
  && apk add --no-cache libzip zlib libpng freetype jpeg \
  # install composer (phar)
  && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
  && composer --version

WORKDIR /var/www/html

# Copy composer files first to leverage Docker cache
COPY composer.json composer.lock ./

RUN composer install --prefer-dist --no-interaction --no-progress --optimize-autoloader --no-dev || true

# Copy application files
COPY . .

# Ensure permissions for storage & cache
RUN set -eux; \
    addgroup -g 1000 appgroup || true; \
    adduser -D -u 1000 -G appgroup appuser || true; \
    chown -R appuser:appgroup /var/www/html || true; \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache || true

### Runtime image
FROM php:8.2-fpm-alpine AS runtime

RUN apk add --no-cache \
    libzip zlib libpng freetype jpeg icu-libs \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(getconf _NPROCESSORS_ONLN || 1) pdo_mysql mbstring zip bcmath exif intl gd || true

WORKDIR /var/www/html

# Copy application + vendor from builder
COPY --from=builder /var/www/html /var/www/html

# Ensure correct ownership on runtime
RUN set -eux; \
    chown -R 1000:1000 /var/www/html || true; \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache || true

EXPOSE 9000

# Default command runs php-fpm
CMD ["php-fpm"]
