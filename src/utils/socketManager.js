// Global Socket Manager
let globalSocket = null;

export const setGlobalSocket = (socket) => {
  globalSocket = socket;
};

export const getGlobalSocket = () => {
  return globalSocket;
};

export const disconnectGlobalSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
};
