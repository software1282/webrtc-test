const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

let channels = {};

io.on('connection', socket => {
    console.log('User connected:', socket.id);
    
    socket.on('joinChannel', ({ channelName, userId }) => {
        socket.join(channelName);
        if (!channels[channelName]) channels[channelName] = [];
        channels[channelName].push({ id: socket.id, userId });
        io.to(channelName).emit('updateUsers', channels[channelName]);
    });

    socket.on('offer', data => {
        socket.to(data.channel).emit('offer', data);
    });

    socket.on('answer', data => {
        socket.to(data.channel).emit('answer', data);
    });

    socket.on('candidate', data => {
        socket.to(data.channel).emit('candidate', data);
    });

    socket.on('disconnect', () => {
        for (let channel in channels) {
            channels[channel] = channels[channel].filter(user => user.id !== socket.id);
            io.to(channel).emit('updateUsers', channels[channel]);
            if (channels[channel].length === 0) delete channels[channel];
        }
    });
});

server.listen(3000, () => console.log('Signaling Server running on http://localhost:3000'));
