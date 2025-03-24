const socket = io();
let peerConnection;
let localStream;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

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
            peerConnection = new RTCPeerConnection(config);
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
            peerConnection.ontrack = event => document.getElementById('remoteVideo').srcObject = event.streams[0];
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit('candidate', { candidate: event.candidate });
                }
            };
            peerConnection.createOffer().then(offer => {
                peerConnection.setLocalDescription(offer);
                socket.emit('offer', { offer, channel: document.getElementById('currentVideoChannel').innerText });
            });
        })
        .catch(error => console.error('Error accessing video devices.', error));
}

socket.on('offer', data => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    peerConnection.createAnswer().then(answer => {
        peerConnection.setLocalDescription(answer);
        socket.emit('answer', { answer, channel: data.channel });
    });
});

socket.on('answer', data => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('candidate', data => {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

function leaveVideoCall() {
    if (peerConnection) peerConnection.close();
    window.location.href = '/';
}