import { reactive } from 'vue'

const voice = reactive({
  micReady: false,
  isTalking: false,
  micError: false,
})

let localStream = null
const mediaConns = new Map() // peerId -> MediaConnection
const audioElements = new Map() // peerId -> HTMLAudioElement
const pendingIncomingCalls = [] // mediaConns received before mic was ready

export function useVoiceChat() {
  async function initMic() {
    if (localStream) return // already initialized
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Start muted
      localStream.getAudioTracks().forEach((t) => { t.enabled = false })
      voice.micReady = true
      voice.micError = false
      // Answer any calls that arrived before mic was ready
      while (pendingIncomingCalls.length) {
        answerCall(pendingIncomingCalls.shift())
      }
    } catch {
      voice.micReady = false
      voice.micError = true
    }
  }

  function handleRemoteStream(peerId, stream) {
    let audio = audioElements.get(peerId)
    if (!audio) {
      audio = document.createElement('audio')
      audio.autoplay = true
      audioElements.set(peerId, audio)
    }
    audio.srcObject = stream
  }

  function callPeer(peer, peerId) {
    if (!localStream || !peer || mediaConns.has(peerId)) return
    const call = peer.call(peerId, localStream)
    if (!call) return
    mediaConns.set(peerId, call)
    call.on('stream', (remoteStream) => handleRemoteStream(peerId, remoteStream))
    call.on('close', () => cleanupPeer(peerId))
  }

  function answerCall(mediaConn) {
    if (!localStream) {
      pendingIncomingCalls.push(mediaConn)
      return
    }
    const peerId = mediaConn.peer
    mediaConns.set(peerId, mediaConn)
    mediaConn.answer(localStream)
    mediaConn.on('stream', (remoteStream) => handleRemoteStream(peerId, remoteStream))
    mediaConn.on('close', () => cleanupPeer(peerId))
  }

  function setPTT(active) {
    if (!localStream) return
    voice.isTalking = active
    localStream.getAudioTracks().forEach((t) => { t.enabled = active })
  }

  function connectToPeers(peer, peerIds) {
    if (!localStream || !peer) return
    for (const id of peerIds) {
      callPeer(peer, id)
    }
  }

  function cleanupPeer(peerId) {
    const conn = mediaConns.get(peerId)
    if (conn) {
      conn.close()
      mediaConns.delete(peerId)
    }
    const audio = audioElements.get(peerId)
    if (audio) {
      audio.srcObject = null
      audioElements.delete(peerId)
    }
  }

  function destroy() {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop())
      localStream = null
    }
    for (const [id] of mediaConns) cleanupPeer(id)
    pendingIncomingCalls.length = 0
    voice.micReady = false
    voice.isTalking = false
    voice.micError = false
  }

  return { voice, initMic, callPeer, answerCall, setPTT, connectToPeers, cleanupPeer, destroy }
}
