import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="register"
      screenOptions={{ headerShown: false }}
    />
  );
}