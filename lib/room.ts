import { customAlphabet } from "nanoid";

const roomIdAlphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const hostTokenAlphabet =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const makeRoomId = customAlphabet(roomIdAlphabet, 8);
const makeHostToken = customAlphabet(hostTokenAlphabet, 32);

export function generateRoomId() {
  return makeRoomId();
}

export function generateHostToken() {
  return makeHostToken();
}
