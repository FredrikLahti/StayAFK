import { Domain } from '../domain/types';

export type RootStackParamList = {
  Entry: undefined;
  Onboarding: undefined;
  Home: undefined;
  DayDetail: { date: string };
  DomainDetail: { domain: Domain };
  GamingControl: { autoOpenWhatHappened?: boolean } | undefined;
  Settings: undefined;
  Paywall: undefined;
};
