-- Opción explícita: celda que abre el teclado en /tablero (además de etiquetas Teclado / Números).

ALTER TABLE "symbols" ADD COLUMN "opens_keyboard" BOOLEAN NOT NULL DEFAULT false;
