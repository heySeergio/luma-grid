-- Etiquetas de plantilla demo suprimidas al borrar (evita reinyectar celdas default-left/default).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "demo_suppressed_template_labels" JSONB;
