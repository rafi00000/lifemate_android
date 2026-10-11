import { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useRetained } from '@/hooks/use-retained';
import { makeStyles } from '@/theme';
import type { GroceryItem } from '@/types/api';
import { validateRequired } from '@/utils/validation';

export const UNITS = ['', 'kg', 'g', 'L', 'pcs', 'dozen', 'packet'];

type ItemInput = { name: string; quantity: number; unit: string };

interface ItemSheetProps {
  item: GroceryItem | null;
  onClose: () => void;
  onSave: (input: ItemInput) => void;
  onDelete: () => void;
}

export function ItemSheet({ item, onClose, onSave, onDelete }: ItemSheetProps) {
  const shown = useRetained(item);
  return (
    <BottomSheet visible={!!item} onClose={onClose} title="Edit item">
      {shown ? <ItemForm key={shown.id} item={shown} onSave={onSave} onDelete={onDelete} /> : null}
    </BottomSheet>
  );
}

function ItemForm({ item, onSave, onDelete }: { item: GroceryItem; onSave: (input: ItemInput) => void; onDelete: () => void }) {
  const styles = useStyles();
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);
  const [error, setError] = useState<string>();

  const step = unit === 'kg' || unit === 'L' ? 0.5 : 1;
  const adjust = (delta: number) => setQuantity((q) => Math.min(9999, Math.max(step, Math.round((q + delta) * 100) / 100)));

  return (
    <View style={styles.body}>
      <TextField label="Item" value={name} onChangeText={setName} error={error} maxLength={100} />
      <View style={styles.qtyRow}>
        <Text variant="label" tone="textSecondary" style={styles.flex}>
          Quantity
        </Text>
        <IconButton icon="minus" label="Decrease quantity" variant="soft" onPress={() => adjust(-step)} />
        <Text variant="amountL" style={styles.qty} accessibilityLiveRegion="polite">
          {quantity}
        </Text>
        <IconButton icon="plus" label="Increase quantity" variant="soft" onPress={() => adjust(step)} />
      </View>
      <ChipGroup scroll value={unit} onChange={setUnit} options={UNITS.map((u) => ({ value: u, label: u || 'No unit' }))} accessibilityLabel="Unit" />
      <View style={styles.actions}>
        <Button label="Remove" variant="ghost" icon="trash-2" onPress={onDelete} />
        <Button
          label="Save"
          onPress={() => {
            const problem = validateRequired(name, 'Item name', 100);
            if (problem) return setError(problem);
            onSave({ name: name.trim(), quantity, unit });
          }}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.space.lg, paddingBottom: t.space.xs },
  flex: { flex: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  qty: { minWidth: 56, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: t.space.md, alignItems: 'center' },
}));
