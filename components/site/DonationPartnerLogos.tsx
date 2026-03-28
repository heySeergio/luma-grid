import Image from 'next/image'

const LOGOS = [
  { file: 'ARASAAC.svg', alt: 'ARASAAC', width: 110, height: 36 },
  { file: 'Autismo España.png', alt: 'Confederación Autismo España', width: 130, height: 36 },
  { file: 'Logo Huellas.png', alt: 'Protectora Huellas Ávila', width: 130, height: 36 },
] as const

type Props = {
  className?: string
}

/** Logos en /public/Donar — sin border-radius en las marcas. */
export default function DonationPartnerLogos({ className }: Props) {
  return (
    <div
      className={`flex w-full flex-wrap items-center justify-center gap-6 sm:gap-8 ${className ?? ''}`.trim()}
    >
      {LOGOS.map(({ file, alt, width, height }) => (
        <Image
          key={file}
          src={`/Donar/${encodeURIComponent(file)}`}
          alt={alt}
          width={width}
          height={height}
          className="h-7 w-auto max-w-[min(140px,28vw)] object-contain object-center opacity-[0.88] dark:opacity-95"
        />
      ))}
    </div>
  )
}
