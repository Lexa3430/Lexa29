import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PIECES } from "./catalog";
import { revealArtwork } from "./reveal";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("sealed edition", () => {
  it("decrypts 29 unique works and leaves ciphertext in the repo", async () => {
    const sealed = readFileSync(new URL("./sealed.json", import.meta.url), "utf8");
    expect(sealed.includes("<svg")).toBe(false);
    expect(sealed.includes("Gilded Meridian")).toBe(false);

    const images = await Promise.all(PIECES.map((piece) => revealArtwork(piece.id)));
    expect(new Set(images).size).toBe(29);
    images.forEach((svg, index) => {
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain(PIECES[index].name);
    });
  });

  it("only lets the collection frame open the vault", () => {
    const files = walk(join(process.cwd(), "src")).filter((file) => /\.(ts|tsx)$/.test(file));
    const readers = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return source.includes("vault-key") || source.includes("COLLECTION_VAULT_KEY_HEX");
    });
    expect(readers.map((file) => file.split("/").at(-1)).sort()).toEqual([
      "reveal.ts",
      "vault-key.ts",
      "vault.test.ts",
    ]);

    const frames = files.filter((file) =>
      /from ["']@\/collection\/reveal["']|from ["']\.\/reveal["']/.test(readFileSync(file, "utf8")),
    );
    expect(frames.map((file) => file.split("/").at(-1)).sort()).toEqual(["ArtFrame.tsx", "vault.test.ts"]);
  });
});
