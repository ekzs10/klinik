FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js & NPM (required for Inertia/Vite)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /var/www

# Copy composer files for caching
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-interaction --no-scripts --no-autoloader

# Copy package files for caching
COPY package.json package-lock.json ./

# Install JS dependencies
RUN npm install && chown -R www-data:www-data /var/www/node_modules

# Copy application files
COPY --chown=www-data:www-data . /var/www

# Build React Vite assets for production
RUN npm run build

# Generate Composer autoloader
RUN composer dump-autoload --no-scripts --optimize

# Change ownership of all files to www-data
RUN chown -R www-data:www-data /var/www

USER www-data

EXPOSE 9000
CMD ["php-fpm"]
