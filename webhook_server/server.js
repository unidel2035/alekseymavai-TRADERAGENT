const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const BybitClient = require('./bybitClient');

// Настройка логирования
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Инициализация Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text());

// Инициализация Bybit клиента
const bybitClient = new BybitClient({
    apiKey: process.env.BYBIT_API_KEY,
    apiSecret: process.env.BYBIT_API_SECRET,
    testnet: process.env.USE_TESTNET === 'true'
});

// Проверка безопасности webhook
const verifyWebhookSource = (req, res, next) => {
    const token = req.headers['x-webhook-token'];

    if (process.env.WEBHOOK_TOKEN && token !== process.env.WEBHOOK_TOKEN) {
        logger.warn('Unauthorized webhook attempt', {
            ip: req.ip,
            headers: req.headers
        });
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

// Маршрут для проверки здоровья сервера
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Основной webhook endpoint
app.post('/webhook', verifyWebhookSource, async (req, res) => {
    try {
        let alertData;

        // Парсинг входящих данных
        if (typeof req.body === 'string') {
            try {
                alertData = JSON.parse(req.body);
            } catch (e) {
                // Если не JSON, пытаемся обработать как текст
                alertData = parseTextAlert(req.body);
            }
        } else {
            alertData = req.body;
        }

        logger.info('Received webhook', { data: alertData });

        // Валидация данных
        if (!validateAlertData(alertData)) {
            logger.error('Invalid alert data', { data: alertData });
            return res.status(400).json({ error: 'Invalid alert data' });
        }

        // Обработка сигнала
        const result = await processTradeSignal(alertData);

        logger.info('Trade signal processed', { result });

        res.json({
            status: 'success',
            result: result
        });

    } catch (error) {
        logger.error('Webhook processing error', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Функция валидации данных алерта
function validateAlertData(data) {
    const requiredFields = ['action', 'symbol', 'price'];

    for (const field of requiredFields) {
        if (!data[field]) {
            logger.warn(`Missing required field: ${field}`);
            return false;
        }
    }

    if (!['BUY', 'SELL'].includes(data.action.toUpperCase())) {
        logger.warn(`Invalid action: ${data.action}`);
        return false;
    }

    return true;
}

// Функция парсинга текстового алерта
function parseTextAlert(text) {
    // Простой парсер для текстовых алертов
    // Формат: ACTION:SYMBOL:PRICE:SL:TP
    const parts = text.split(':');

    if (parts.length < 3) {
        throw new Error('Invalid text alert format');
    }

    return {
        action: parts[0],
        symbol: parts[1],
        price: parseFloat(parts[2]),
        stop_loss: parts[3] ? parseFloat(parts[3]) : null,
        take_profit: parts[4] ? parseFloat(parts[4]) : null
    };
}

// Функция обработки торгового сигнала
async function processTradeSignal(alertData) {
    const {
        action,
        symbol,
        price,
        stop_loss,
        take_profit,
        risk_percent = 1
    } = alertData;

    try {
        // Получение баланса аккаунта
        const balance = await bybitClient.getAccountBalance();

        // Расчет размера позиции на основе риска
        const positionSize = calculatePositionSize(
            balance,
            risk_percent,
            price,
            stop_loss
        );

        // Подготовка параметров ордера
        const orderParams = {
            symbol: formatSymbolForBybit(symbol),
            side: action.toUpperCase() === 'BUY' ? 'Buy' : 'Sell',
            orderType: 'Market',
            qty: positionSize,
            timeInForce: 'GTC',
            reduceOnly: false,
            closeOnTrigger: false
        };

        // Размещение основного ордера
        const mainOrder = await bybitClient.placeOrder(orderParams);

        logger.info('Main order placed', { order: mainOrder });

        // Размещение Stop Loss
        if (stop_loss) {
            const slOrder = await bybitClient.placeStopLossOrder({
                symbol: orderParams.symbol,
                side: action.toUpperCase() === 'BUY' ? 'Sell' : 'Buy',
                stopPrice: stop_loss,
                qty: positionSize
            });

            logger.info('Stop loss order placed', { order: slOrder });
        }

        // Размещение Take Profit
        if (take_profit) {
            const tpOrder = await bybitClient.placeTakeProfitOrder({
                symbol: orderParams.symbol,
                side: action.toUpperCase() === 'BUY' ? 'Sell' : 'Buy',
                stopPrice: take_profit,
                qty: positionSize
            });

            logger.info('Take profit order placed', { order: tpOrder });
        }

        return {
            mainOrder: mainOrder,
            stopLoss: stop_loss ? 'placed' : 'not set',
            takeProfit: take_profit ? 'placed' : 'not set',
            positionSize: positionSize
        };

    } catch (error) {
        logger.error('Error processing trade signal', {
            error: error.message,
            alertData: alertData
        });
        throw error;
    }
}

// Функция расчета размера позиции
function calculatePositionSize(balance, riskPercent, entryPrice, stopLoss) {
    if (!stopLoss) {
        // Если нет стоп-лосса, используем фиксированный процент от баланса
        return (balance * (riskPercent / 100)) / entryPrice;
    }

    const riskAmount = balance * (riskPercent / 100);
    const stopLossDistance = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / stopLossDistance;

    // Округление до допустимого количества знаков после запятой
    return Math.floor(positionSize * 10000) / 10000;
}

// Функция форматирования символа для Bybit
function formatSymbolForBybit(symbol) {
    // TradingView обычно использует формат как "BTCUSD"
    // Bybit может требовать "BTCUSDT" или "BTCUSD"

    if (symbol.endsWith('USD') && !symbol.endsWith('USDT')) {
        // Проверяем, нужно ли добавить 'T' для perpetual
        if (process.env.USE_PERP === 'true') {
            return symbol + 'T';
        }
    }

    return symbol;
}

// Маршрут для получения статуса позиций
app.get('/positions', async (req, res) => {
    try {
        const positions = await bybitClient.getPositions();
        res.json(positions);
    } catch (error) {
        logger.error('Error fetching positions', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Маршрут для получения истории ордеров
app.get('/orders', async (req, res) => {
    try {
        const orders = await bybitClient.getOrders();
        res.json(orders);
    } catch (error) {
        logger.error('Error fetching orders', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Маршрут для ручного закрытия всех позиций
app.post('/close-all', async (req, res) => {
    try {
        const result = await bybitClient.closeAllPositions();
        res.json(result);
    } catch (error) {
        logger.error('Error closing positions', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Обработка ошибок
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack
    });

    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Запуск сервера
app.listen(PORT, () => {
    logger.info(`Webhook server started on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Testnet mode: ${process.env.USE_TESTNET === 'true' ? 'ON' : 'OFF'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;