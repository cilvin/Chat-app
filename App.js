import React, { Component } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView } from 'react-native';
// import react Navigation
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

// import the screens
import Start from './components/Start.js';
import Chat from './components/Chat.js';

// Create the navigator
const navigator = createStackNavigator({
  Start: {
    screen: Start,
    navigationOptions: {
      header: null,
    }, 
  },
  Chat: { screen: Chat },
});

const navigatorContainer = createAppContainer(navigator);
// Export it as the root component
export default navigatorContainer;