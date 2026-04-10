-- Colores del teclado en /tablero (solo JSON de tema visual)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "keyboard_theme" JSONB;
