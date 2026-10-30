import { describe, expect, it } from "vitest";
import { ordenarPelaOrdemDosIds } from "./precos.service.js";

describe("ordenarPelaOrdemDosIds", () => {
  it("devolve os produtos na ordem de relevância dos ids, não na ordem em que vieram do banco", () => {
    const doBanco = [{ produtoCanonicoId: "c" }, { produtoCanonicoId: "a" }, { produtoCanonicoId: "b" }];
    expect(ordenarPelaOrdemDosIds(doBanco, ["a", "b", "c"]).map((p) => p.produtoCanonicoId)).toEqual(["a", "b", "c"]);
  });

  it("ignora ids sem produto (ex.: produto sem preço ativo, filtrado antes)", () => {
    const doBanco = [{ produtoCanonicoId: "b" }];
    expect(ordenarPelaOrdemDosIds(doBanco, ["a", "b"]).map((p) => p.produtoCanonicoId)).toEqual(["b"]);
  });
});
