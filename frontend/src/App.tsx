import { Route, Routes } from "react-router-dom";
import { Busca } from "./pages/Busca";
import { ProdutoDetalhe } from "./pages/ProdutoDetalhe";
import { CategoriaPagina } from "./pages/Categoria";
import { LojaPagina } from "./pages/Loja";
import { ListaCompras } from "./pages/ListaCompras";
import { RevisaoPendentes } from "./pages/admin/RevisaoPendentes";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Busca />} />
      <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
      <Route path="/categorias/:slug" element={<CategoriaPagina />} />
      <Route path="/lojas/:id" element={<LojaPagina />} />
      <Route path="/lista-compras" element={<ListaCompras />} />
      <Route path="/admin/revisao" element={<RevisaoPendentes />} />
    </Routes>
  );
}
