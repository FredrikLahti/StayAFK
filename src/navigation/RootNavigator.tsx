import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAppData, useReadyAppData } from './AppDataContext';
import { shouldShowCravingButton } from './routeVisibility';
import EntryScreen from '../screens/EntryScreen';
import OnboardingScreen from '../onboarding/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import DayDetailScreen from '../screens/DayDetailScreen';
import DomainDetailScreen from '../screens/DomainDetailScreen';
import GamingControlScreen from '../screens/GamingControlScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';
import CravingButton from '../screens/CravingButton';
import { summarizeCravingEvents } from '../gamingcontrol/cravingStats';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

function EntryRoute({ navigation }: ScreenProps<'Entry'>) {
  return <EntryScreen onStart={() => navigation.navigate('Onboarding')} />;
}

// Onboarding is reached both fresh (Entry -> Onboarding, no profile yet) and
// via "Restart onboarding" from Home (profile already exists). Either way,
// completing it should land cleanly on Home with no onboarding/entry left
// in the back stack.
function OnboardingRoute({ navigation }: ScreenProps<'Onboarding'>) {
  const { completeOnboarding } = useAppData();

  async function handleComplete(answers: Parameters<typeof completeOnboarding>[0]) {
    await completeOnboarding(answers);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  return <OnboardingScreen onComplete={handleComplete} />;
}

function GamingControlRoute({ navigation, route }: ScreenProps<'GamingControl'>) {
  const { gamingControl, cravingEvents, relapseEvents, relapse } = useReadyAppData();
  return (
    <GamingControlScreen
      status={gamingControl}
      cravingEvents={cravingEvents}
      relapseEvents={relapseEvents}
      onBack={() => navigation.goBack()}
      onRelapse={relapse}
      autoOpenWhatHappened={route.params?.autoOpenWhatHappened}
    />
  );
}

function SettingsRoute({ navigation }: ScreenProps<'Settings'>) {
  const { notificationSettings, purchaseStatus, phase, changeNotificationIntensity } = useReadyAppData();
  return (
    <SettingsScreen
      notificationIntensity={notificationSettings.intensity}
      purchaseStatus={purchaseStatus}
      phaseStartDate={phase.phaseStartDate}
      onBack={() => navigation.goBack()}
      onChangeIntensity={changeNotificationIntensity}
    />
  );
}

function PaywallRoute({ navigation }: ScreenProps<'Paywall'>) {
  const { priceDisplay, unlock, restore } = useReadyAppData();
  return (
    <PaywallScreen
      priceDisplay={priceDisplay}
      onUnlock={unlock}
      onRestore={restore}
      onOpenSettings={() => navigation.navigate('Settings')}
    />
  );
}

// Persistent, easy-access craving button, overlaid on top of the navigator
// rather than rendered per-screen - shown on the core habit-loop screens
// only (see routeVisibility.ts), hidden on onboarding/settings/paywall.
// Rendered as a sibling of Stack.Navigator (not a descendant of any single
// screen), so the current route name has to come in via NavigationContainer's
// ref/onStateChange rather than useNavigationState, which requires being
// nested inside an actual screen.
function FloatingCravingButton({ routeName }: { routeName: string | undefined }) {
  const { data, logCraving } = useAppData();

  if (!data || !shouldShowCravingButton(routeName)) return null;

  return (
    <CravingButton onPress={logCraving} weeklyCountAfterLogging={summarizeCravingEvents(data.cravingEvents).recentCount} />
  );
}

export default function RootNavigator() {
  const { status, data } = useAppData();
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.metalFlat} />
      </View>
    );
  }

  const initialRouteName: keyof RootStackParamList =
    status === 'needsOnboarding' ? 'Entry' : data?.isPaywalled ? 'Paywall' : 'Home';

  return (
    <NavigationContainer
      ref={navRef}
      onReady={() => setCurrentRoute(navRef.current?.getCurrentRoute()?.name)}
      onStateChange={() => setCurrentRoute(navRef.current?.getCurrentRoute()?.name)}
    >
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Entry" component={EntryRoute} />
        <Stack.Screen name="Onboarding" component={OnboardingRoute} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DayDetail" component={DayDetailScreen} />
        <Stack.Screen name="DomainDetail" component={DomainDetailScreen} />
        <Stack.Screen name="GamingControl" component={GamingControlRoute} />
        <Stack.Screen name="Settings" component={SettingsRoute} />
        <Stack.Screen name="Paywall" component={PaywallRoute} />
      </Stack.Navigator>
      <FloatingCravingButton routeName={currentRoute} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
