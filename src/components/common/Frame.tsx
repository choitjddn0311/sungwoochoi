import Image from "next/image";
import { Link } from "@/i18n/navigation";

export interface FrameItem {
  key: string;
  title: string;
  /** 글자 프레임 위쪽의 작은 정보. 예: POST · 2026-10-01 */
  eyebrow?: string;
  /** 있으면 링크, 없으면 눌러서 선택하는 버튼이 된다 */
  href?: string;
  image?: { src: string; alt: string; position?: string };
}

interface FrameProps {
  item: FrameItem;
  selected: boolean;
  sizes: string;
  onSelect: () => void;
  onFocus: () => void;
}

const Frame = ({ item, selected, sizes, onSelect, onFocus }: FrameProps) => {
  const className = `frame${item.image ? " frame-image" : ""}`;
  const content = item.image ? (
    <Image
      src={item.image.src}
      alt={item.image.alt}
      fill
      sizes={sizes}
      className="object-cover"
      style={item.image.position ? { objectPosition: item.image.position } : undefined}
    />
  ) : (
    <>
      <span className="frame-eyebrow meta">{item.eyebrow}</span>
      <span className="frame-title">{item.title}</span>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={className} data-selected={selected} onFocus={onFocus}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} data-selected={selected} onClick={onSelect} onFocus={onFocus}>
      {content}
    </button>
  );
};

export default Frame;
