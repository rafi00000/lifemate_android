import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/layout/tab-bar';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.colors.background },
        animation: 'fade',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="money" options={{ title: 'Money' }} />
      <Tabs.Screen name="bills" options={{ title: 'Bills' }} />
      <Tabs.Screen name="lists" options={{ title: 'Lists' }} />
    </Tabs>
  );
}
