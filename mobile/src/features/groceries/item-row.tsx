import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import { enterFade, exitFade, layoutTransition, makeStyles } from '@/theme';
import type { GroceryItem } from '@/types/api';

export function quantityLabel(item: Pick<GroceryItem, 'quantity' | 'unit'>): string | null {
  if (item.quantity === 1 && !item.unit) return null;
  const q = Number.isInteger(item.quantity) ? String(item.quantity) : item.quantity.toFixed(2).replace(/0+$/, '');
  return item.unit ? `${q} ${item.unit}` : `×${q}`;
}

interface ItemRowProps {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
  onPress: (item: GroceryItem) => void;
}

export const ItemRow = memo(function ItemRow({ item, onToggle, onPress }: ItemRowProps) {
  const styles = useStyles();
  const pending = item.id.startsWith('temp-'); // still being saved
  const qty = quantityLabel(item);
  return (
    <Animated.View entering={enterFade} exiting={exitFade} layout={layoutTransition}>
      <View style={[styles.row, pending && styles.pending]}>
        <Checkbox
          checked={item.purchased}
          onToggle={() => onToggle(item)}
          disabled={pending}
          label={`${item.purchased ? 'Move back to list' : 'Mark as bought'}: ${item.name}`}
          testID={`grocery-check-${item.name}`}
        />
        <Pressable
          style={styles.body}
          onPress={() => onPress(item)}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}${qty ? `, ${qty}` : ''}${item.purchased ? ', bought' : ''}`}
          accessibilityHint="Edit quantity or remove">
          <Text variant="bodyMedium" tone={item.purchased ? 'textTertiary' : 'text'} style={[styles.name, item.purchased && styles.strike]} numberOfLines={1}>
            {item.name}
          </Text>
          {qty ? (
            <View style={styles.qty}>
              <Text variant="label" tone="textSecondary">
                {qty}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </Animated.View>
  );
});

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.sm + 2, minHeight: 56 },
  pending: { opacity: 0.6 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.space.sm, minHeight: 44 },
  name: { flex: 1 },
  strike: { textDecorationLine: 'line-through' },
  qty: { paddingHorizontal: t.space.sm, paddingVertical: 2, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceMuted },
}));
