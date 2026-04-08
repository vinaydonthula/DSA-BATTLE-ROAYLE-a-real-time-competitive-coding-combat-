import { io } from "socket.io-client";

class SocketService {
  socket = null;
  connected = false;
  pendingEmits = []; // Queue for emits before connection

  connect() {
    if (this.socket) return; // 🔒 PREVENT MULTIPLE CONNECTIONS

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
      this.connected = true;
      
      // Process any pending emits
      while (this.pendingEmits.length > 0) {
        const { event, data } = this.pendingEmits.shift();
        console.log("📤 PROCESSING PENDING EMIT:", event, data);
        this.socket.emit(event, data);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      this.connected = false;
      this.socket = null;
    });

    this.socket.on("connect_error", (err) => {
      console.error("🚨 Socket error:", err.message);
    });
  }

  emit(event, data) {
    if (!this.socket) {
      console.warn("⚠️ SOCKET NOT INITIALIZED, cannot emit:", event);
      return;
    }
    
    if (!this.connected) {
      // Queue the emit for when connection is established
      console.log("⏳ SOCKET NOT CONNECTED, queuing:", event, data);
      this.pendingEmits.push({ event, data });
      return;
    }

    console.log("📤 SOCKET EMIT:", event, data);
    this.socket.emit(event, data);
  }


  on(event, cb) {
    this.socket?.on(event, cb);
  }

  off(event, cb) {
    this.socket?.off(event, cb);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
  }
}

export default new SocketService();
