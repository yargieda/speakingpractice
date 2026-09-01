import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { colors, fonts } from "@/src/theme/theme";

const useNativeTabs =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;

export default function TabsLayout() {
  if (useNativeTabs) {
    // iOS 26+ Liquid Glass native tabs.
    const {
      NativeTabs,
      Icon,
      Label,
    } = require("expo-router/unstable-native-tabs");
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="ielts">
          <Label>IELTS</Label>
          <Icon sf="text.book.closed" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="icao">
          <Label>ICAO</Label>
          <Icon sf="airplane" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="free">
          <Label>Free Talk</Label>
          <Icon sf="bubble.left.and.bubble.right" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history">
          <Label>History</Label>
          <Icon sf="clock.arrow.circlepath" />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      initialRouteName="ielts"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.divider,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="ielts"
        options={{
          title: "IELTS",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="icao"
        options={{
          title: "ICAO",
          tabBarIcon: ({ color, size }) => (
            <Feather name="send" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="free"
        options={{
          title: "Free Talk",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
