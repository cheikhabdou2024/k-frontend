import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProfileNavigator from './ProfileNavigator';


// Import screens
import PerfectFeedScreen from '../screens/feed/PerfectFeedScreen';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import InboxScreen from '../screens/inbox/InboxScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Import navigators
import CreateNavigator from './CreateNavigator';

// Tab icons
import { TABS } from '../constants/routes';

const Tab = createBottomTabNavigator();

// Custom TabBar component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;
        
        // Handle tab press
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        // Custom Create button
        if (route.name === TABS.CREATE) return (
          <TouchableOpacity 
            key={index}
            style={styles.createButton}
            onPress={onPress}
          >
            <View style={styles.createButtonInner}>
              <Ionicons name="add" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        );
        
        // Get the right icon for each tab
        let iconName;
        if (route.name === TABS.HOME) {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === TABS.DISCOVER) {
          iconName = isFocused ? 'search' : 'search-outline';
        } else if (route.name === TABS.INBOX) {
          iconName = isFocused ? 'notifications' : 'notifications-outline';
        } else if (route.name === TABS.PROFILE) {
          iconName = isFocused ? 'person' : 'person-outline';
        }
        
        return (
          <TouchableOpacity
            key={index}
            style={styles.tabButton}
            onPress={onPress}
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={isFocused ? '#fff' : '#888'} 
            />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? '#fff' : '#888' }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name={TABS.HOME} 
        component={PerfectFeedScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name={TABS.DISCOVER} 
        component={DiscoverScreen} 
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen 
        name={TABS.CREATE} 
        component={CreateNavigator}
        options={{ tabBarLabel: 'Create' }}
      />
      <Tab.Screen 
        name={TABS.INBOX} 
        component={InboxScreen}
        options={{ tabBarLabel: 'Inbox' }}
      />
      <Tab.Screen 
         name={TABS.PROFILE} 
         component={ProfileNavigator}
         options={{ tabBarLabel: 'Profile' }}
/>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000',
    height: 55,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    paddingBottom: 5,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  createButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonInner: {
    width: 45,
    height: 32,
    backgroundColor: '#FE2C55',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderLeftColor: '#FE2C55',
    borderRightColor: '#25F4EE',
  },
});

export default TabNavigator;