import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ExpressPeerServer } from 'peer';

const app = express();
const server = createServer(app);
const PORT = 5556;

// Configuração do CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Configuração do Socket.IO
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true, // Permite compatibilidade com versões anteriores
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Configuração do PeerServer
const peerServer = ExpressPeerServer(server, {
  path: '/myapp',
  allow_discovery: true,
  proxied: true
});

app.use('/peerjs', peerServer);

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor rodando!');
});

// Lógica do Socket.IO
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
    
    // Adicionar os novos eventos de gravação aqui
    socket.on('start-recording', (userId) => {
      socket.to(roomId).emit('recording-started', userId);
    });

    socket.on('stop-recording', () => {
      socket.to(roomId).emit('recording-stopped');
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
