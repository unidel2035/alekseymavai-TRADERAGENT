const axios = require('axios');
const crypto = require('crypto');

class BybitClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
        this.testnet = config.testnet || false;

        // Базовые URL для Bybit
        this.baseUrl = this.testnet
            ? 'https://api-testnet.bybit.com'
            : 'https://api.bybit.com';

        this.recvWindow = 5000;
    }

    // Генерация подписи для запроса
    generateSignature(params) {
        const timestamp = Date.now();
        const queryString = this.buildQueryString({ ...params, api_key: this.apiKey, timestamp });
        const signature = crypto
            .createHmac('sha256', this.apiSecret)
            .update(queryString)
            .digest('hex');

        return { signature, timestamp };
    }

    // Построение строки запроса
    buildQueryString(params) {
        return Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
    }

    // Генерация заголовков для V5 API
    generateV5Headers(params = '', method = 'POST') {
        const timestamp = Date.now();
        const signString = timestamp + this.apiKey + this.recvWindow + params;
        const signature = crypto
            .createHmac('sha256', this.apiSecret)
            .update(signString)
            .digest('hex');

        return {
            'X-BAPI-API-KEY': this.apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': this.recvWindow,
            'Content-Type': 'application/json'
        };
    }

    // Получение баланса аккаунта
    async getAccountBalance() {
        try {
            const endpoint = '/v5/account/wallet-balance';
            const params = {
                accountType: 'UNIFIED'
            };

            const headers = this.generateV5Headers(JSON.stringify(params), 'GET');

            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                params: params,
                headers: headers
            });

            if (response.data.retCode === 0) {
                const walletBalance = response.data.result.list[0];
                return parseFloat(walletBalance.totalEquity);
            } else {
                throw new Error(`Failed to get balance: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error getting account balance:', error);
            throw error;
        }
    }

    // Размещение ордера
    async placeOrder(orderParams) {
        try {
            const endpoint = '/v5/order/create';
            const params = {
                category: 'linear',
                symbol: orderParams.symbol,
                side: orderParams.side,
                orderType: orderParams.orderType || 'Market',
                qty: orderParams.qty.toString(),
                timeInForce: orderParams.timeInForce || 'GTC',
                reduceOnly: orderParams.reduceOnly || false,
                closeOnTrigger: orderParams.closeOnTrigger || false
            };

            // Добавляем цену для лимитных ордеров
            if (orderParams.orderType === 'Limit' && orderParams.price) {
                params.price = orderParams.price.toString();
            }

            const headers = this.generateV5Headers(JSON.stringify(params));

            const response = await axios.post(
                `${this.baseUrl}${endpoint}`,
                params,
                { headers }
            );

            if (response.data.retCode === 0) {
                return response.data.result;
            } else {
                throw new Error(`Failed to place order: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    }

    // Размещение Stop Loss ордера
    async placeStopLossOrder(params) {
        try {
            const endpoint = '/v5/order/create';
            const orderParams = {
                category: 'linear',
                symbol: params.symbol,
                side: params.side,
                orderType: 'Market',
                qty: params.qty.toString(),
                triggerPrice: params.stopPrice.toString(),
                triggerBy: 'LastPrice',
                orderFilter: 'StopOrder',
                timeInForce: 'GTC',
                reduceOnly: true
            };

            const headers = this.generateV5Headers(JSON.stringify(orderParams));

            const response = await axios.post(
                `${this.baseUrl}${endpoint}`,
                orderParams,
                { headers }
            );

            if (response.data.retCode === 0) {
                return response.data.result;
            } else {
                throw new Error(`Failed to place stop loss: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error placing stop loss:', error);
            throw error;
        }
    }

    // Размещение Take Profit ордера
    async placeTakeProfitOrder(params) {
        try {
            const endpoint = '/v5/order/create';
            const orderParams = {
                category: 'linear',
                symbol: params.symbol,
                side: params.side,
                orderType: 'Market',
                qty: params.qty.toString(),
                triggerPrice: params.stopPrice.toString(),
                triggerBy: 'LastPrice',
                orderFilter: 'TpSlOrder',
                timeInForce: 'GTC',
                reduceOnly: true
            };

            const headers = this.generateV5Headers(JSON.stringify(orderParams));

            const response = await axios.post(
                `${this.baseUrl}${endpoint}`,
                orderParams,
                { headers }
            );

            if (response.data.retCode === 0) {
                return response.data.result;
            } else {
                throw new Error(`Failed to place take profit: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error placing take profit:', error);
            throw error;
        }
    }

    // Получение текущих позиций
    async getPositions(symbol = '') {
        try {
            const endpoint = '/v5/position/list';
            const params = {
                category: 'linear'
            };

            if (symbol) {
                params.symbol = symbol;
            }

            const headers = this.generateV5Headers(JSON.stringify(params), 'GET');

            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                params: params,
                headers: headers
            });

            if (response.data.retCode === 0) {
                return response.data.result.list;
            } else {
                throw new Error(`Failed to get positions: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error getting positions:', error);
            throw error;
        }
    }

    // Получение активных ордеров
    async getOrders(symbol = '') {
        try {
            const endpoint = '/v5/order/realtime';
            const params = {
                category: 'linear'
            };

            if (symbol) {
                params.symbol = symbol;
            }

            const headers = this.generateV5Headers(JSON.stringify(params), 'GET');

            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                params: params,
                headers: headers
            });

            if (response.data.retCode === 0) {
                return response.data.result.list;
            } else {
                throw new Error(`Failed to get orders: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error getting orders:', error);
            throw error;
        }
    }

    // Отмена ордера
    async cancelOrder(symbol, orderId) {
        try {
            const endpoint = '/v5/order/cancel';
            const params = {
                category: 'linear',
                symbol: symbol,
                orderId: orderId
            };

            const headers = this.generateV5Headers(JSON.stringify(params));

            const response = await axios.post(
                `${this.baseUrl}${endpoint}`,
                params,
                { headers }
            );

            if (response.data.retCode === 0) {
                return response.data.result;
            } else {
                throw new Error(`Failed to cancel order: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error canceling order:', error);
            throw error;
        }
    }

    // Закрытие всех позиций
    async closeAllPositions() {
        try {
            const positions = await this.getPositions();
            const results = [];

            for (const position of positions) {
                if (position.size > 0) {
                    const side = position.side === 'Buy' ? 'Sell' : 'Buy';
                    const closeOrder = await this.placeOrder({
                        symbol: position.symbol,
                        side: side,
                        orderType: 'Market',
                        qty: position.size,
                        reduceOnly: true
                    });
                    results.push(closeOrder);
                }
            }

            return results;
        } catch (error) {
            console.error('Error closing all positions:', error);
            throw error;
        }
    }

    // Получение истории сделок
    async getTradeHistory(symbol = '', limit = 50) {
        try {
            const endpoint = '/v5/execution/list';
            const params = {
                category: 'linear',
                limit: limit
            };

            if (symbol) {
                params.symbol = symbol;
            }

            const headers = this.generateV5Headers(JSON.stringify(params), 'GET');

            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                params: params,
                headers: headers
            });

            if (response.data.retCode === 0) {
                return response.data.result.list;
            } else {
                throw new Error(`Failed to get trade history: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error getting trade history:', error);
            throw error;
        }
    }

    // Получение информации о символе
    async getSymbolInfo(symbol) {
        try {
            const endpoint = '/v5/market/instruments-info';
            const params = {
                category: 'linear',
                symbol: symbol
            };

            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                params: params
            });

            if (response.data.retCode === 0) {
                return response.data.result.list[0];
            } else {
                throw new Error(`Failed to get symbol info: ${response.data.retMsg}`);
            }
        } catch (error) {
            console.error('Error getting symbol info:', error);
            throw error;
        }
    }
}

module.exports = BybitClient;