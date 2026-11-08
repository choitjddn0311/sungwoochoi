import { Link } from "@/i18n/navigation";
import { padCount } from "@/lib/work";

interface SectionFooterProps {
  count: number;
  label: string;
  /** 이름을 눌러 이동할 주소 */
  href?: string;
}

/** 섹션 끝의 "12 POSTS" 표기. 숫자는 항상 실제 개수를 넘긴다. */
const SectionFooter = ({ count, label, href }: SectionFooterProps) => (
  <div className="wrap">
    <div className="section-foot">
      <span className="display">{padCount(count)}</span>
      {href ? (
        <Link href={href} className="display hover:underline underline-offset-8 decoration-1">
          {label}
        </Link>
      ) : (
        <span className="display">{label}</span>
      )}
    </div>
  </div>
);

export default SectionFooter;
