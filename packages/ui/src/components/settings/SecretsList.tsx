// SecretsList — names in, add/remove intents out. Was `SecretsManager`.
//
// It never reads or writes storage. It holds exactly the state a form must hold:
// the two drafts and the reveal flag. On a successful add it clears the drafts —
// which is why `onAdd` may return a promise: the component awaits it so a
// rejected write leaves the user's typing intact.

import { useCallback, useMemo, useState } from 'react';
import { Button, Input, InputGroup, TextField } from '@heroui/react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { SettingsList, SettingsRow } from './SettingsLayout';
import { cn } from '../../utils/cn';

export interface SecretsListProps {
  names: ReadonlyArray<string>;
  /** WIRING: persist the secret. Rejecting keeps the drafts on screen. */
  onAdd: (name: string, value: string) => Promise<void> | void;
  /** WIRING: delete the secret by name. */
  onRemove: (name: string) => Promise<void> | void;
  className?: string;
}

export function SecretsList({ names, onAdd, onRemove, className }: SecretsListProps) {
  // Sorted defensively — the consumer's ordering is not a contract.
  const sorted = useMemo(() => [...names].sort(), [names]);

  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [revealed, setRevealed] = useState(false);

  const canAdd = newName.trim().length > 0 && newValue.length > 0;

  const handleAdd = useCallback(async () => {
    const name = newName.trim();
    if (name.length === 0 || newValue.length === 0) return;
    await onAdd(name, newValue);
    setNewName('');
    setNewValue('');
  }, [newName, newValue, onAdd]);

  return (
    <div className={className}>
      {sorted.length > 0 ? (
        <SettingsList className="mb-3">
          {sorted.map((name) => (
            <li key={name}>
              <SettingsRow
                trailing={
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove ${name}`}
                    onPress={() => void onRemove(name)}
                  >
                    <Trash2 size={12} />
                  </Button>
                }
              >
                <span className="truncate font-mono text-xs text-slate-700">{name}</span>
              </SettingsRow>
            </li>
          ))}
        </SettingsList>
      ) : null}

      {/* Equal-width name/value columns; the add button collapses to its icon. */}
      <div className={cn('grid grid-cols-1 gap-1.5', 'sm:grid-cols-[1fr_1fr_auto]')}>
        <TextField
          value={newName}
          onChange={setNewName}
          aria-label="New secret name"
          className="w-full"
        >
          <Input placeholder="NAME" spellCheck={false} className="w-full font-mono text-xs" />
        </TextField>

        <TextField
          value={newValue}
          onChange={setNewValue}
          aria-label="New secret value"
          className="w-full"
        >
          <InputGroup fullWidth>
            <InputGroup.Input
              type={revealed ? 'text' : 'password'}
              placeholder="value"
              spellCheck={false}
              autoComplete="off"
              className="w-full font-mono text-xs"
            />
            <InputGroup.Suffix className="pr-0">
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                excludeFromTabOrder
                aria-label={revealed ? 'Hide secret' : 'Show secret'}
                onPress={() => setRevealed((v) => !v)}
              >
                {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
              </Button>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>

        <Button
          isIconOnly
          size="sm"
          variant="secondary"
          aria-label="Add secret"
          isDisabled={!canAdd}
          onPress={() => void handleAdd()}
        >
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}
