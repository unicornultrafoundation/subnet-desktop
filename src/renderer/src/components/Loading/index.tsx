import "./style.css";

type Props = {
  className?: string;
  size?: number;
};

const Loading: React.FC<Props> = ({ className, size = 48 }) => {
  return (
    <div className={`${className} flex items-center justify-center py-8`}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        className={`loader`}
      />
    </div>
  );
};

export default Loading;
