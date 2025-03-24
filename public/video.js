const socket = io();
let peerConnections = {};
let localStream;
const config = {
    iceServers: [
        { urls: 'stun1.l.google.com:19302' },
        { urls: 'stun2.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
    ]
};

function joinVideoChannel() {
    const channelName = document.getElementById('channelName').value;
    if (!channelName) return alert('Enter a channel name');
    document.getElementById('currentVideoChannel').innerText = channelName;
    document.getElementById('videoContainer').style.display = 'block';
    socket.emit('joinChannel', { channelName, userId: socket.id });
    startVideoCall();
}

function startVideoCall() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            document.getElementById('localVideo').srcObject = stream;
            localStream = stream;
            socket.on('updateUsers', users => {
                users.forEach(user => {
                    if (user.id !== socket.id && !peerConnections[user.id]) {
                        createPeerConnection(user.id);
                    }
                });
            });
        })
        .catch(error => console.error('Error accessing video devices.', error));
}

function createPeerConnection(remoteSocketId) {
    let peerConnection = new RTCPeerConnection(config);
    peerConnections[remoteSocketId] = peerConnection;

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        let remoteVideo = document.createElement('video');
        remoteVideo.id = `video-${remoteSocketId}`;
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        remoteVideo.srcObject = event.streams[0];
        document.getElementById('remoteVideos').appendChild(remoteVideo);
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log('Sending ICE candidate:', event.candidate);
            socket.emit('candidate', { candidate: event.candidate, target: remoteSocketId });
        }
    };

    peerConnection.createOffer().then(offer => {
        peerConnection.setLocalDescription(offer);
        socket.emit('offer', { offer, target: remoteSocketId });
    });
}

socket.on('offer', data => {
    if (!peerConnections[data.sender]) {
        createPeerConnection(data.sender);
    }
    peerConnections[data.sender].setRemoteDescription(new RTCSessionDescription(data.offer));
    peerConnections[data.sender].createAnswer().then(answer => {
        peerConnections[data.sender].setLocalDescription(answer);
        socket.emit('answer', { answer, target: data.sender });
    });
});

socket.on('answer', data => {
    if (peerConnections[data.sender]) {
        peerConnections[data.sender].setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

socket.on('candidate', data => {
    console.log('Received ICE candidate:', data.candidate);
    if (peerConnections[data.sender]) {
        peerConnections[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

function leaveVideoCall() {
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};
    window.location.href = '/';
}