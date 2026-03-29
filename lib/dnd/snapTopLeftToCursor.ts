import type { Modifier } from '@dnd-kit/core'
import { getEventCoordinates } from '@dnd-kit/utilities'

/**
 * Coloca la esquina superior izquierda del nodo arrastrado / overlay exactamente en el cursor.
 * Evita el desfase habitual con scroll y contenedores cuando solo se usa el delta por defecto.
 * (snapCenterToCursor de @dnd-kit/modifiers ancla el centro; aquí anclamos 0,0 al puntero.)
 */
export const snapTopLeftToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (!draggingNodeRect || !activatorEvent) {
    return transform
  }
  const activatorCoordinates = getEventCoordinates(activatorEvent)
  if (!activatorCoordinates) {
    return transform
  }
  const offsetX = activatorCoordinates.x - draggingNodeRect.left
  const offsetY = activatorCoordinates.y - draggingNodeRect.top
  return {
    ...transform,
    x: transform.x + offsetX,
    y: transform.y + offsetY,
  }
}
