import '@styles/components/EmptyPlaceholder.css'

interface EmptyPlaceholderProps {
  title: string;
}

const EmptyPlaceholder: React.FC<EmptyPlaceholderProps> = ({ title }) => {
    return (
      <div className="empty-placeholder"
      >
        {title}
      </div>
    );
  };
  
  export default EmptyPlaceholder;
  