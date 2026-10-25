
let ioInstance = null;

export const setSocketIO = (io) => {
  ioInstance = io;
};

export const getSocketIO = () => ioInstance;

export const emitToOwner = (ownerId, event, payload) => {
  if (!ioInstance || !ownerId) return;

  ioInstance.to(`owner:${ownerId}`).emit(event, payload);
};
