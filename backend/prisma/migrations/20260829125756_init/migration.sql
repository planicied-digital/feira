-- CreateEnum
CREATE TYPE "TipoValidade" AS ENUM ('DATA_DEFINIDA', 'ENQUANTO_DURAR_ESTOQUE');

-- CreateEnum
CREATE TYPE "UnidadePadrao" AS ENUM ('KG', 'L', 'UN');

-- CreateEnum
CREATE TYPE "StatusImportacao" AS ENUM ('PROCESSADO', 'ERRO');

-- CreateEnum
CREATE TYPE "StatusMatch" AS ENUM ('PENDENTE_REVISAO', 'AUTO_CONFIRMADO', 'REVISADO_CONFIRMADO', 'REVISADO_REJEITADO');

-- CreateEnum
CREATE TYPE "StatusSugestaoFusao" AS ENUM ('PENDENTE', 'ACEITA', 'REJEITADA');

-- CreateTable
CREATE TABLE "lojas" (
    "id" TEXT NOT NULL,
    "nome_raw" TEXT NOT NULL,
    "nome_normalizado" TEXT NOT NULL,
    "rede" TEXT,
    "endereco_raw" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lojas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folhetos" (
    "id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "arquivo_origem" TEXT NOT NULL,
    "tipo_validade" "TipoValidade" NOT NULL,
    "validade_inicio" DATE,
    "validade_fim" DATE,
    "extraido_em" TIMESTAMP(3) NOT NULL,
    "importado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_json" JSONB NOT NULL,
    "status" "StatusImportacao" NOT NULL DEFAULT 'PROCESSADO',

    CONSTRAINT "folhetos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_folheto" (
    "id" TEXT NOT NULL,
    "folheto_id" TEXT NOT NULL,
    "nome_raw" TEXT NOT NULL,
    "nome_normalizado" TEXT NOT NULL,
    "marca_raw" TEXT,
    "categoria_sugerida" TEXT,
    "quantidade" DECIMAL(10,3),
    "unidade" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "preco_original" DECIMAL(10,2),
    "unidade_padrao" "UnidadePadrao" NOT NULL,
    "preco_por_unidade_padrao" DECIMAL(12,4) NOT NULL,
    "confianca_ocr" DOUBLE PRECISION,
    "tipo_validade_item" "TipoValidade",
    "validade_inicio_item" DATE,
    "validade_fim_item" DATE,
    "produto_canonico_id" TEXT,
    "status_match" "StatusMatch" NOT NULL DEFAULT 'PENDENTE_REVISAO',
    "score_similaridade" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_folheto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos_canonicos" (
    "id" TEXT NOT NULL,
    "nome_canonico" TEXT NOT NULL,
    "nome_normalizado" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT,
    "unidade_padrao" "UnidadePadrao" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_canonicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precos" (
    "id" TEXT NOT NULL,
    "produto_canonico_id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "folheto_id" TEXT NOT NULL,
    "item_folheto_id" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "preco_por_unidade_padrao" DECIMAL(12,4) NOT NULL,
    "unidade_padrao" "UnidadePadrao" NOT NULL,
    "tipo_validade" "TipoValidade" NOT NULL,
    "validade_inicio" DATE,
    "validade_fim" DATE,
    "extraido_em" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "precos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sugestoes_fusao_produto" (
    "id" TEXT NOT NULL,
    "produto_origem_id" TEXT NOT NULL,
    "produto_destino_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" "StatusSugestaoFusao" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvido_em" TIMESTAMP(3),

    CONSTRAINT "sugestoes_fusao_produto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lojas_nome_normalizado_idx" ON "lojas"("nome_normalizado");

-- CreateIndex
CREATE INDEX "folhetos_loja_id_idx" ON "folhetos"("loja_id");

-- CreateIndex
CREATE INDEX "itens_folheto_folheto_id_idx" ON "itens_folheto"("folheto_id");

-- CreateIndex
CREATE INDEX "itens_folheto_produto_canonico_id_idx" ON "itens_folheto"("produto_canonico_id");

-- CreateIndex
CREATE INDEX "itens_folheto_status_match_idx" ON "itens_folheto"("status_match");

-- CreateIndex
CREATE INDEX "produtos_canonicos_categoria_unidade_padrao_idx" ON "produtos_canonicos"("categoria", "unidade_padrao");

-- CreateIndex
CREATE UNIQUE INDEX "precos_item_folheto_id_key" ON "precos"("item_folheto_id");

-- CreateIndex
CREATE INDEX "precos_produto_canonico_id_preco_por_unidade_padrao_idx" ON "precos"("produto_canonico_id", "preco_por_unidade_padrao");

-- CreateIndex
CREATE INDEX "precos_tipo_validade_validade_fim_idx" ON "precos"("tipo_validade", "validade_fim");

-- CreateIndex
CREATE INDEX "sugestoes_fusao_produto_status_idx" ON "sugestoes_fusao_produto"("status");

-- AddForeignKey
ALTER TABLE "folhetos" ADD CONSTRAINT "folhetos_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_folheto" ADD CONSTRAINT "itens_folheto_folheto_id_fkey" FOREIGN KEY ("folheto_id") REFERENCES "folhetos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_folheto" ADD CONSTRAINT "itens_folheto_produto_canonico_id_fkey" FOREIGN KEY ("produto_canonico_id") REFERENCES "produtos_canonicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos" ADD CONSTRAINT "precos_produto_canonico_id_fkey" FOREIGN KEY ("produto_canonico_id") REFERENCES "produtos_canonicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos" ADD CONSTRAINT "precos_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos" ADD CONSTRAINT "precos_folheto_id_fkey" FOREIGN KEY ("folheto_id") REFERENCES "folhetos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precos" ADD CONSTRAINT "precos_item_folheto_id_fkey" FOREIGN KEY ("item_folheto_id") REFERENCES "itens_folheto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sugestoes_fusao_produto" ADD CONSTRAINT "sugestoes_fusao_produto_produto_origem_id_fkey" FOREIGN KEY ("produto_origem_id") REFERENCES "produtos_canonicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sugestoes_fusao_produto" ADD CONSTRAINT "sugestoes_fusao_produto_produto_destino_id_fkey" FOREIGN KEY ("produto_destino_id") REFERENCES "produtos_canonicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
