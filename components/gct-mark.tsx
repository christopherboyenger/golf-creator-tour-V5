import Image from "next/image";
import gctIconLogo from "../logo-gct-icon.png.png";

type GctMarkProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
};

const sizes = {
  sm: "h-10 w-10",
  md: "h-20 w-20",
  lg: "h-28 w-28"
};

export function GctMark({ size = "md", label = "Golf Creator Tour" }: GctMarkProps) {
  return (
    <span className={`inline-flex items-center justify-center ${sizes[size]}`} aria-label={label}>
      <Image
        alt=""
        className="h-full w-full scale-[1.35] object-contain"
        height={112}
        priority
        src={gctIconLogo}
        unoptimized
        width={112}
      />
    </span>
  );
}
