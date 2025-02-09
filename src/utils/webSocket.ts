import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import fs from 'fs';
import logger from "./logger";
import { streamContainerData } from './containerService';

export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        logger.debug(`Received upgrade request for URL: ${req.url}`);
        const baseURL = `http://${req.headers.host}/`;
        const requestURL = new URL(req.url || '', baseURL);
        const pathname = requestURL.pathname;
        logger.debug(`Parsed pathname: ${pathname}`);

        // Debug log to verify path handling
        logger.debug(`Handling upgrade for path: ${pathname}`);

        if (pathname === '/wss/container-data' || pathname === '/wss/server-logs') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        } else {
            logger.warn(`Rejected WebSocket connection to invalid path: ${pathname}`);
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            socket.destroy();
        }
    });

    server.on("error", (error) => {
        logger.error("HTTP server error:", error);
    });

    logger.debug("WebSocket server attached to HTTP server");

    wss.on('connection', (ws: WebSocket, req) => {
        const baseURL = `http://${req.headers.host}/`;
        const requestURL = new URL(req.url || '', baseURL);
        const pathname = requestURL.pathname;

        logger.info(`WebSocket connection established to ${pathname}`);

        const handleError = (error: string) => {
            ws.send(JSON.stringify({ error }));
            ws.close();
        };

        if (pathname === '/wss/container-data') {
            const hostName = requestURL.searchParams.get('host');
            if (!hostName) {
                handleError('Missing required host parameter');
                return;
            }
            streamContainerData(ws, hostName);
        } else if (pathname === '/wss/server-logs') {
            const logFiles = fs.readdirSync("logs/").filter(file => file.startsWith('app-'));

            if (logFiles.length === 0) {
                console.error('No log files found');
                return;
            }

            const sortedLogFiles = logFiles.sort((a, b) => {
                const dateA = a.match(/\d{4}-\d{2}-\d{2}/)[0];
                const dateB = b.match(/\d{4}-\d{2}-\d{2}/)[0];

                return dateB.localeCompare(dateA);
            });

            const logPath = "logs/" + sortedLogFiles[0];

            if (!fs.existsSync(logPath)) {
                handleError('Log file not found');
                logger.error(`Log file ${logPath} not found`)
                return;
            }

            // Read the initial content of the log file
            let lastSize = fs.statSync(logPath).size;
            let history = fs.readFileSync(logPath, 'utf-8');
            ws.send(JSON.stringify({ type: 'log-history', data: history }));

            // Watch the log file for changes
            const watcher = fs.watch(logPath, (eventType, filename) => {
                if (eventType === 'change') {
                    const newSize = fs.statSync(logPath).size;
                    if (newSize > lastSize) {
                        const stream = fs.createReadStream(logPath, {
                            start: lastSize,
                            end: newSize - 1,
                            encoding: 'utf-8'
                        });

                        stream.on('data', (chunk) => {
                            ws.send(JSON.stringify({ type: 'log-update', data: chunk }));
                        });

                        lastSize = newSize;
                    }
                }
            });

            ws.on('close', () => {
                watcher.close();
                logger.info('Closed WebSocket connection for logs');
            });
        } else {
            handleError('Invalid WebSocket endpoint');
        }
    });
}