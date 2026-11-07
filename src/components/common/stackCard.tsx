interface StackCardProps {
  title: string;
  items: string[];
}

/** 기술 스택 한 분야 */
const StackCard = ({ title, items }: StackCardProps) => (
  <div>
    <h3 className="meta pb-1.5 text-muted">{title}</h3>
    <ul>
      {items.map((item) => (
        <li key={item} className="stack-name">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default StackCard;
