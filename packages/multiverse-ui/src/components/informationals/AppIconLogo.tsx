import { BrandIconLogos } from "../../assets/images";

type Props = {
  alt?: string;
  className?: string;
};

export function ColoredLogo({ className = "w-44", alt = "Brand" }: Props) {
  return (
    <img
      className={className}
      src={BrandIconLogos.coloredLogo}
      alt={alt}
    />
  );
}
