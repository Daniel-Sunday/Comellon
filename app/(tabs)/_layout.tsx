import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#636366',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 1,
          borderTopColor: '#1c1c1e',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: '#000000',
          borderBottomWidth: 1,
          borderBottomColor: '#1c1c1e',
        },
        headerTitleStyle: {
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: 18,
          fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
        },
        headerShown: false, // We will build a beautiful custom header directly on the screens
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notebook',
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Drop Thoughts',
          tabBarIcon: ({ color, size }) => (
            <Feather name="edit-2" size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
