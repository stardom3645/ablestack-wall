import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown } from 'lucide-react';

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '../components/ui/dropdown-menu';
import { wallEditorTypographyVariables } from '../typography';
import { Button } from '../ui';

/** A finite native API choice, using Wall's existing Base UI menu rather than a second select engine. */
export function WallChoice({
  value,
  options,
  label,
  disabled,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  label: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" />}
        disabled={disabled}
        aria-label={label}
        className="wall-choice"
      >
        <span>{options.find((option) => option.value === value)?.label ?? value}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="wall-users-menu" style={wallEditorTypographyVariables}>
        <Menu.RadioGroup
          value={value}
          onValueChange={(next) => {
            if (!disabled && next !== value && options.some((option) => option.value === next)) {
              onChange(next);
            }
          }}
        >
          {options.map((option) => (
            <Menu.RadioItem key={option.value} value={option.value} className="wall-users-menu-item" closeOnClick>
              {option.label}
              <Menu.RadioItemIndicator className="wall-user-role-indicator">
                <Check size={14} aria-hidden="true" />
              </Menu.RadioItemIndicator>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
