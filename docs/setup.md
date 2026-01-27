# Инструкция по установке

## Требования

- TradingView аккаунт (Pro, Pro+ или Premium для webhook функциональности)
- Bybit аккаунт с API ключами
- Сервер для размещения webhook (VPS, облачный хостинг и т.д.)
- Node.js 14+ установленный на сервере

## Шаг 1: Установка индикатора в TradingView

1. Откройте TradingView и перейдите в Pine Editor
2. Создайте новый индикатор
3. Скопируйте код из файла `pine_script_indicator.pine`
4. Нажмите "Save" и дайте индикатору имя
5. Нажмите "Add to Chart" для добавления на график

## Шаг 2: Настройка Bybit API

### Создание API ключей

1. Войдите в ваш Bybit аккаунт
2. Перейдите в API Management (Управление API)
3. Создайте новый API ключ
4. Установите необходимые разрешения:
   - Чтение позиций
   - Управление ордерами
   - Чтение баланса кошелька
5. Сохраните API Key и API Secret в безопасном месте

### Для тестирования используйте Testnet

1. Зарегистрируйтесь на https://testnet.bybit.com
2. Создайте API ключи на тестовой площадке
3. Используйте тестовые средства для проверки работы

## Шаг 3: Установка webhook сервера

### На локальном компьютере (для тестирования)

```bash
# Клонирование репозитория
git clone <repository-url>
cd webhook_server

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл и добавьте ваши API ключи

# Запуск сервера
npm start
```

### На VPS/облачном сервере

```bash
# SSH подключение к серверу
ssh user@your-server-ip

# Установка Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Клонирование и установка
git clone <repository-url>
cd webhook_server
npm install

# Настройка переменных окружения
cp .env.example .env
nano .env  # Добавьте ваши API ключи

# Установка PM2 для управления процессом
npm install -g pm2

# Запуск с PM2
pm2 start server.js --name tradingview-webhook
pm2 save
pm2 startup  # Следуйте инструкциям для автозапуска
```

## Шаг 4: Настройка webhook в TradingView

1. На графике с индикатором нажмите на часы (Create Alert)
2. Выберите условие: индикатор -> Any alert() function call
3. В разделе "Notifications":
   - Включите "Webhook URL"
   - Введите URL вашего сервера: `http://your-server-ip:3000/webhook`
   - Если используете WEBHOOK_TOKEN, добавьте в заголовки
4. Нажмите "Create"

## Шаг 5: Использование ngrok для локального тестирования

Если вы тестируете на локальном компьютере:

```bash
# Установка ngrok
# Скачайте с https://ngrok.com/download

# Запуск туннеля
ngrok http 3000

# Используйте предоставленный URL в TradingView webhook
# Например: https://abc123.ngrok.io/webhook
```

## Шаг 6: Настройка SSL (для продакшена)

Для безопасности рекомендуется использовать HTTPS:

```bash
# Установка Certbot для Let's Encrypt
sudo apt-get update
sudo apt-get install certbot

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com

# Настройка Nginx как reverse proxy
sudo apt-get install nginx
# Настройте конфигурацию nginx для проксирования на ваш Node.js сервер
```

## Проверка работоспособности

1. Проверьте здоровье сервера:
   ```bash
   curl http://your-server-ip:3000/health
   ```

2. Проверьте логи:
   ```bash
   # Если используете PM2
   pm2 logs tradingview-webhook

   # Или просмотр файлов логов
   tail -f combined.log
   ```

3. Тестовый webhook запрос:
   ```bash
   curl -X POST http://your-server-ip:3000/webhook \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Token: your_secret_webhook_token_here" \
     -d '{"action":"BUY","symbol":"BTCUSDT","price":45000,"stop_loss":44000,"take_profit":46000}'
   ```

## Безопасность

1. **Используйте WEBHOOK_TOKEN** для защиты endpoint
2. **Храните API ключи в .env файле**, никогда не коммитьте их
3. **Используйте HTTPS** в продакшене
4. **Ограничьте IP адреса** которые могут обращаться к webhook
5. **Регулярно ротируйте API ключи**
6. **Используйте отдельные API ключи** для тестирования и продакшена

## Устранение неполадок

### Webhook не срабатывает
- Проверьте, что алерт активен в TradingView
- Убедитесь, что сервер доступен из интернета
- Проверьте логи сервера

### Ордера не размещаются
- Проверьте баланс на Bybit
- Убедитесь, что API ключи имеют правильные разрешения
- Проверьте формат символа (BTCUSDT vs BTCUSD)
- Проверьте логи на наличие ошибок

### Сервер падает
- Используйте PM2 для автоматического перезапуска
- Проверьте логи ошибок
- Убедитесь в достаточности ресурсов сервера