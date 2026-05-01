import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf="chart.bar.fill" />
        <Label>{t('tabs.dashboard')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="add">
        <Icon sf="plus.circle.fill" />
        <Label>{t('tabs.addEntry')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Icon sf="magnifyingglass" />
        <Label>{t('tabs.explore')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf="gearshape.fill" />
        <Label>{t('tabs.settings')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
