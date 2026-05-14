-- Autocompletar pictogramas al escribir con el teclado (por defecto activado)
ALTER TABLE "User" ADD COLUMN "keyboard_picto_autocomplete" BOOLEAN NOT NULL DEFAULT true;
