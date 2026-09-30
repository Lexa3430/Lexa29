import sealed from "./sealed.json";
import { COLLECTION_VAULT_KEY_HEX } from "./vault-key";

type SealedPiece = { id: number; iv: string; tag: string; data: string };

const pieces = sealed.pieces as SealedPiece[];

function bytesFromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesFromHex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** Decrypt one sealed work. Only the collection frame should call this. */
export async function revealArtwork(id: number): Promise<string> {
  const entry = pieces.find((piece) => piece.id === id);
  if (!entry) throw new Error("This work is not in the sealed edition");
  if (!COLLECTION_VAULT_KEY_HEX || COLLECTION_VAULT_KEY_HEX.length !== 64) {
    throw new Error("Collection vault key is missing");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    bytesFromHex(COLLECTION_VAULT_KEY_HEX),
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const iv = bytesFromBase64(entry.iv);
  const data = bytesFromBase64(entry.data);
  const tag = bytesFromBase64(entry.tag);
  const payload = new Uint8Array(data.length + tag.length);
  payload.set(data, 0);
  payload.set(tag, data.length);

  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, payload);
  const svg = new TextDecoder().decode(plain);
  if (!svg.startsWith("<svg")) throw new Error("Sealed work did not open as artwork");
  return svg;
}
