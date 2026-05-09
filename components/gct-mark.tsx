import Image from "next/image";

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
        className="h-full w-full object-contain"
        height={112}
        priority
        src="/gct-icon.png"
        width={112}
      />
    </span>
  );
}
