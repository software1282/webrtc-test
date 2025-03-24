const socket = io();
let peerConnection;
let localStream;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;
    })
    .catch(error => console.error('Error accessing video devices.', error));

socket.on('offer', data => {
    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = event => document.getElementById('remoteVideo').srcObject = event.streams[0];
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
    peerConnection.addIceCandidate(new RTCIceCandidate(data));
});

function leaveVideoCall() {
    if (peerConnection) peerConnection.close();
    window.location.href = '/';
}