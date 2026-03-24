import { reactive } from 'vue'
import Peer from 'peerjs'

const PEER_COLORS = ['#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const collab = reactive({
  peer: null,
  conns: [],
  isHost: false,
  roomId: null,
  myColor: null,
  peerCursors: {},
  connectedCount: 0,
})

export function useCollab({ onMove, onSync, onHello, onCursor, onToast, onConnChange }) {
  function updateConnectedCount() {
    collab.connectedCount = collab.conns.filter((c) => c.open).length
    onConnChange?.()
  }

  function broadcast(data) {
    collab.conns.filter((c) => c.open).forEach((c) => c.send(data))
  }

  function broadcastMove(move) {
    broadcast({ type: 'move', move })
  }

  function broadcastCursor(r, c) {
    broadcast({ type: 'cursor', r, c })
  }

  function broadcastFullState(seed, difficulty, board) {
    broadcast({ type: 'sync', seed, difficulty, board: board.map((r) => [...r]) })
  }

  function handlePeerData(peerId, data) {
    if (data.type === 'move') {
      onMove?.(data.move)
    } else if (data.type === 'cursor') {
      const color =
        collab.peerCursors[peerId]?.color ||
        PEER_COLORS[Object.keys(collab.peerCursors).length % PEER_COLORS.length]
      collab.peerCursors[peerId] = { r: data.r, c: data.c, color }
      onCursor?.()
    } else if (data.type === 'sync') {
      onSync?.(data)
    } else if (data.type === 'hello') {
      const color = PEER_COLORS[Object.keys(collab.peerCursors).length % PEER_COLORS.length]
      collab.peerCursors[peerId] = { r: -1, c: -1, color }
      onHello?.(peerId)
      updateConnectedCount()
    }
  }

  function setupConn(conn) {
    collab.conns.push(conn)
    const color = PEER_COLORS[Object.keys(collab.peerCursors).length % PEER_COLORS.length]
    collab.peerCursors[conn.peer] = { r: -1, c: -1, color }
    conn.on('data', (data) => handlePeerData(conn.peer, data))
    conn.on('open', () => {
      conn.send({ type: 'hello' })
      updateConnectedCount()
      onToast?.('Jugador conectado')
    })
    conn.on('close', () => {
      collab.conns = collab.conns.filter((c) => c !== conn)
      delete collab.peerCursors[conn.peer]
      updateConnectedCount()
    })
  }

  function sendToPeer(peerId, data) {
    const conn = collab.conns.find((c) => c.peer === peerId)
    if (conn && conn.open) conn.send(data)
  }

  function createRoom() {
    const roomId = 'sdk-' + Math.random().toString(36).substr(2, 6)
    collab.roomId = roomId
    collab.isHost = true
    collab.myColor = '#6ee7b7'
    collab.peer = new Peer(roomId)
    collab.peer.on('open', (id) => {
      updateConnectedCount()
      onToast?.('Sala creada: ' + id)
    })
    collab.peer.on('connection', (conn) => setupConn(conn))
    collab.peer.on('error', (err) => onToast?.('Error: ' + err.type, 3000))
    return roomId
  }

  function joinRoom(roomId) {
    collab.roomId = roomId
    collab.isHost = false
    collab.myColor = PEER_COLORS[0]
    collab.peer = new Peer()
    return new Promise((resolve) => {
      collab.peer.on('open', () => {
        const conn = collab.peer.connect(roomId, { reliable: true })
        setupConn(conn)
        updateConnectedCount()
        resolve()
      })
      collab.peer.on('error', (err) => onToast?.('Error: ' + err.type, 3000))
    })
  }

  return {
    collab,
    PEER_COLORS,
    createRoom,
    joinRoom,
    broadcastMove,
    broadcastCursor,
    broadcastFullState,
    sendToPeer,
  }
}
