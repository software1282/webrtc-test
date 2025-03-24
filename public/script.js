 
const socket = io();
const channelInput = document.getElementById('channelName');
const userIdInput = document.getElementById('userId');
const userList = document.getElementById('userList');
const localAudio = document.getElementById('localAudio');
const remoteAudio = document.getElementById('remoteAudio');
let localStream;
let peerConnection;
let currentChannel;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function createOrJoinChannel() {
    currentChannel = channelInput.value;
    const userId = userIdInput.value || `User-${Math.floor(Math.random() * 1000)}`;
    if (!currentChannel) return alert("Enter a valid channel name");
    document.getElementById("currentChannel").textContent = currentChannel;
    document.getElementById("channel").style.display = "block";
    socket.emit('joinChannel', { channelName: currentChannel, userId });
}

socket.on('updateUsers', users => {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.userId;
        userList.appendChild(li);
    });
});

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        localAudio.srcObject = stream;
        localStream = stream;
    })
    .catch(error => console.error('Error accessing audio devices.', error));

socket.on('offer', data => {
    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = event => remoteAudio.srcObject = event.streams[0];
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    peerConnection.createAnswer().then(answer => {
        peerConnection.setLocalDescription(answer);
        socket.emit('answer', { answer, channel: currentChannel });
    });
});

socket.on('answer', data => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('candidate', data => {
    peerConnection.addIceCandidate(new RTCIceCandidate(data));
});

function leaveChannel() {
    if (peerConnection) peerConnection.close();
    document.getElementById("channel").style.display = "none";
    location.reload();
} 