
import React from 'react';
import { Input } from '@/components/ui/input';
import { ExternalLink } from 'lucide-react';

interface TicketReferenceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TicketReferenceInput: React.FC<TicketReferenceInputProps> = ({
  value,
  onChange,
  placeholder = "e.g., PPT-82"
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const generateLink = (ticketRef: string) => {
    if (!ticketRef.trim()) return null;
    return `https://proglove.atlassian.net/browse/${ticketRef.trim()}`;
  };

  const link = generateLink(value);

  return (
    <div className="space-y-2">
      <Input
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
      />
      {link && (
        <div className="flex items-center gap-2">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            {value}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
};

export default TicketReferenceInput;
