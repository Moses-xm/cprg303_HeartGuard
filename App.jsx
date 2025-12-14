/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// App.js - Heart Guard Application Main Entry
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Home from './screens/home/index.js';
import Settings from './screens/settings/index.js';
import History from './screens/history/index.js';

const Tab = createBottomTabNavigator();

const theme = {
  colors: {
    primary: '#7c1c11ff',
    accent: '#3498db',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#2c3e50',
  },
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <PaperProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#af736cff',
            tabBarInactiveTintColor: '#95a5a6',
            headerStyle: {
              backgroundColor: '#cf6357ff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={Home}
            options={{
              title: 'Real-time Monitor',
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Icon name="heart-pulse" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="History"
            component={History}
            options={{
              title: 'Historical Data',
              tabBarLabel: 'History',
              tabBarIcon: ({ color, size }) => (
                <Icon name="chart-line" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={Settings}
            options={{
              title: 'Settings',
              tabBarLabel: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <Icon name="cog" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default App;
