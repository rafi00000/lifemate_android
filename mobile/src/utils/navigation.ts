import { router } from 'expo-router';

/**
 * Back that always lands somewhere: screens can be opened without history
 * (a notification tap, a deep link, a restored web tab), where a plain
 * router.back() would do nothing.
 */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
