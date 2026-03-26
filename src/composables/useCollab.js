import { reactive } from 'vue'
import Peer from 'peerjs'
import { useI18n } from './useI18n.js'

const PEER_COLORS = ['#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const collab = reactive({
  peer: null,
  conns: [],
  isHost: false,
  roomId: null,
  myColor: null,
  myName: '',
  peerCursors: {},
  connectedCount: 0,
})

let nextColorIdx = 0

export function useCollab({ onMove, onSync, onHello, onCursor, onToast, onConnChange }) {
  const { t } = useI18n()
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
    broadcast({ type: 'cursor', r, c, color: collab.myColor, name: collab.myName })
  }

  function broadcastFullState(seed, difficulty, board, cellOwners, timerStart) {
    broadcast({ type: 'sync', seed, difficulty, board: board.map((r) => [...r]), cellOwners: cellOwners?.map((r) => [...r]), timerStart })
  }

  function broadcastPeerList() {
    const peers = {}
    peers[collab.peer.id] = { color: collab.myColor, name: collab.myName }
    for (const [id, data] of Object.entries(collab.peerCursors)) {
      peers[id] = { color: data.color, name: data.name }
    }
    broadcast({ type: 'peer-list', peers })
  }

  function handlePeerData(peerId, data) {
    if (data.type === 'move') {
      onMove?.(data.move)
      // Host relays guest moves to all other guests
      if (collab.isHost) {
        collab.conns.filter((c) => c.open && c.peer !== peerId).forEach((c) => c.send(data))
      }
    } else if (data.type === 'cursor') {
      // For relayed cursors, use the attributed peerId; otherwise the connection peer
      const sourcePeerId = data.peerId || peerId
      const existing = collab.peerCursors[sourcePeerId]
      const color = data.color || existing?.color || PEER_COLORS[0]
      const name = data.name || existing?.name || ''
      collab.peerCursors[sourcePeerId] = { r: data.r, c: data.c, color, name }
      onCursor?.()
      // Host relays guest cursors to all other guests
      if (collab.isHost) {
        collab.conns.filter((c) => c.open && c.peer !== peerId).forEach((c) =>
          c.send({ type: 'cursor', r: data.r, c: data.c, peerId: sourcePeerId, color, name })
        )
      }
    } else if (data.type === 'sync') {
      onSync?.(data)
    } else if (data.type === 'hello') {
      if (collab.isHost) {
        // Assign a unique color to the new guest using a dedicated counter
        const color = PEER_COLORS[nextColorIdx % PEER_COLORS.length]
        nextColorIdx++
        collab.peerCursors[peerId] = { r: -1, c: -1, color, name: data.name || '' }
        sendToPeer(peerId, { type: 'your-color', color, name: collab.myName })
        broadcastPeerList()
      } else {
        // Guest received hello from host
        collab.peerCursors[peerId] = { r: -1, c: -1, color: data.color || '#6ee7b7', name: data.name || '' }
      }
      onHello?.(peerId)
      updateConnectedCount()
    } else if (data.type === 'your-color') {
      collab.myColor = data.color
      // your-color always comes from the host, so peerId is the host
      if (data.name && collab.peerCursors[peerId]) {
        collab.peerCursors[peerId].name = data.name
      }
    } else if (data.type === 'peer-list') {
      const myId = collab.peer?.id
      const peerIds = new Set(Object.keys(data.peers))
      for (const [id, info] of Object.entries(data.peers)) {
        if (id === myId) continue
        const existing = collab.peerCursors[id]
        if (existing) {
          existing.color = info.color
          existing.name = info.name
        } else {
          collab.peerCursors[id] = { r: -1, c: -1, color: info.color, name: info.name }
        }
      }
      for (const id of Object.keys(collab.peerCursors)) {
        if (id !== myId && !peerIds.has(id)) {
          delete collab.peerCursors[id]
        }
      }
    }
  }

  function setupConn(conn) {
    collab.conns.push(conn)
    conn.on('data', (data) => handlePeerData(conn.peer, data))
    conn.on('open', () => {
      conn.send({ type: 'hello', color: collab.myColor, name: collab.myName })
      updateConnectedCount()
      onToast?.(t('playerConnected'))
    })
    conn.on('close', () => {
      collab.conns = collab.conns.filter((c) => c !== conn)
      delete collab.peerCursors[conn.peer]
      updateConnectedCount()
      if (collab.isHost) broadcastPeerList()
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
    collab.myColor = PEER_COLORS[0]
    nextColorIdx = 1
    collab.peer = new Peer(roomId)
    collab.peer.on('open', (id) => {
      updateConnectedCount()
      onToast?.(t('roomCreated', id))
    })
    collab.peer.on('connection', (conn) => setupConn(conn))
    collab.peer.on('error', (err) => onToast?.('Error: ' + err.type, 3000))
    return roomId
  }

  function joinRoom(roomId) {
    collab.roomId = roomId
    collab.isHost = false
    collab.myColor = null // Don't set a default; wait for host assignment
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
