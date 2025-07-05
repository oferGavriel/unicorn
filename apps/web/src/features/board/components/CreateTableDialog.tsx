import React, { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input
} from '@/components';

export interface CreateTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTable: (name: string) => Promise<void>;
  isCreatingTable?: boolean;
}

export const CreateTableDialog: React.FC<CreateTableDialogProps> = ({
  isOpen,
  onClose,
  onCreateTable,
  isCreatingTable = false
}): React.ReactElement | null => {
  const [name, setName] = useState<string>('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && name.trim() !== '') {
      await handleCreateTable();
    }
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Backspace' && name.length === 0) {
      onClose();
    }
  };

  const handleCreateTable = async (): Promise<void> => {
    await onCreateTable(name);
    setName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Table</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Enter table name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="bg-[#2a2a2a] border-gray-600 text-white placeholder-gray-400"
        />

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTable}
            disabled={isCreatingTable || !name.trim()}
            variant={'primary'}
          >
            {isCreatingTable ? 'Creating...' : 'Create Table'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
