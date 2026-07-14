import { SearchField } from '@heroui/react';
import { cn } from '../../utils/cn';

export interface ConversationSearchFieldProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

/**
 * Search box for the conversations list.
 *
 * The source hand-rolled this from a bare `<input type="search">` plus an
 * absolutely-positioned magnifier icon. HeroUI's SearchField brings the clear
 * button, the icon slot, and the labelling for free — the visible label stays
 * hidden because the drawer already names this region.
 */
export function ConversationSearchField({
  value,
  onChange,
  placeholder = 'Search conversations…',
  label = 'Search conversations',
  className,
}: ConversationSearchFieldProps) {
  return (
    <SearchField
      aria-label={label}
      value={value}
      onChange={onChange}
      fullWidth
      className={cn(className)}
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
